import express from 'express';
import crypto from 'crypto';
import qrcode from 'qrcode';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// In-memory session store — unchanged from original (use Redis in production)
const qrSessions = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of qrSessions.entries()) {
    if (session.expiresAt < now) {
      qrSessions.delete(id);
      logger.info(`[Terminal QR] Cleaned up expired session: ${id}`);
    }
  }
}, 30000);

// @route POST /api/terminal-qr/generate
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { passType, passData, expirySeconds = 60 } = req.body;

    if (!passType || !passData) return res.status(400).json({ success: false, message: 'Pass type and pass data are required' });

    const validExpiry = Math.min(Math.max(expirySeconds, 30), 300);
    const sessionId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + validExpiry * 1000;

    const sessionData = { sessionId, userId, passType, passData, timestamp, expiresAt, scanned: false, createdAt: new Date().toISOString() };
    qrSessions.set(sessionId, sessionData);

    let host = req.get('host');
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      try {
        const os = await import('os');
        const nets = os.networkInterfaces();
        Object.values(nets).forEach(ifaces => {
          (ifaces || []).forEach(iface => { if (iface.family === 'IPv4' && !iface.internal) host = iface.address + ':' + (process.env.PORT || 5000); });
        });
      } catch (_) {}
    }

    const scanUrl = `${req.protocol}://${host}/api/terminal-qr/scan/${sessionId}`;
    const qrImage = await qrcode.toDataURL(scanUrl, { errorCorrectionLevel: 'H', width: 300 });

    logger.info(`[Terminal QR] Session created: ${sessionId} for user ${userId}`);

    res.json({
      success: true,
      session: { sessionId, qrImage, scanUrl, expiresAt: new Date(expiresAt).toISOString(), expirySeconds: validExpiry, passType },
    });
  } catch (error) {
    logger.error('Terminal QR generate error:', error);
    res.status(500).json({ success: false, message: 'Error generating QR session', error: error.message });
  }
});

// @route GET /api/terminal-qr/scan/:sessionId  (public — scanned by a mobile device)
router.get('/scan/:sessionId', async (req, res) => {
  try {
    const session = qrSessions.get(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found or expired' });
    if (session.expiresAt < Date.now()) {
      qrSessions.delete(req.params.sessionId);
      return res.status(410).json({ success: false, message: 'Session has expired' });
    }
    if (session.scanned) return res.status(409).json({ success: false, message: 'Session has already been scanned' });

    session.scanned = true;
    session.scannedAt = new Date().toISOString();
    session.scannerInfo = { ip: req.ip, userAgent: req.get('user-agent') };
    qrSessions.set(req.params.sessionId, session);

    // Save to qr_codes so it shows up in the user's vault
    const { data: qrCodeRow, error: insertErr } = await supabaseAdmin.from('qr_codes').insert({
      user_id: session.userId,
      qr_type: session.passType,
      title: `Scanned: ${session.passType}`,
      data: typeof session.passData === 'string' ? { text: session.passData } : session.passData,
      category: 'general',
    }).select().single();

    if (insertErr) logger.warn('Could not save scanned QR to vault:', insertErr.message);

    logger.info(`[Terminal QR] Session scanned: ${req.params.sessionId}`);

    res.json({
      success: true,
      message: 'Pass data retrieved successfully',
      passType: session.passType,
      passData: session.passData,
      scannedAt: session.scannedAt,
      savedToVault: !!qrCodeRow,
    });
  } catch (error) {
    logger.error('Terminal QR scan error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving pass data', error: error.message });
  }
});

// @route GET /api/terminal-qr/status/:sessionId
router.get('/status/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = qrSessions.get(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found or expired' });
    if (session.userId !== req.user.userId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const expired = session.expiresAt < Date.now();
    if (expired) qrSessions.delete(req.params.sessionId);

    res.json({
      success: true,
      status: {
        sessionId: session.sessionId, scanned: session.scanned, expired,
        scannedAt: session.scannedAt || null, expiresAt: new Date(session.expiresAt).toISOString(),
        timeLeft: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
      },
    });
  } catch (error) {
    logger.error('Terminal QR status error:', error);
    res.status(500).json({ success: false, message: 'Error checking session status', error: error.message });
  }
});

// @route DELETE /api/terminal-qr/cancel/:sessionId
router.delete('/cancel/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = qrSessions.get(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.userId !== req.user.userId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    qrSessions.delete(req.params.sessionId);
    logger.info(`[Terminal QR] Session cancelled: ${req.params.sessionId}`);
    res.json({ success: true, message: 'Session cancelled successfully' });
  } catch (error) {
    logger.error('Terminal QR cancel error:', error);
    res.status(500).json({ success: false, message: 'Error cancelling session', error: error.message });
  }
});

// @route GET /api/terminal-qr/active-sessions
router.get('/active-sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = Date.now();
    const userSessions = [];

    for (const [id, session] of qrSessions.entries()) {
      if (session.userId === userId && session.expiresAt > now) {
        userSessions.push({ sessionId: id, passType: session.passType, createdAt: session.createdAt, expiresAt: new Date(session.expiresAt).toISOString(), scanned: session.scanned, timeLeft: Math.floor((session.expiresAt - now) / 1000) });
      }
    }

    res.json({ success: true, activeSessions: userSessions, count: userSessions.length });
  } catch (error) {
    logger.error('Active sessions error:', error);
    res.status(500).json({ success: false, message: 'Error fetching active sessions', error: error.message });
  }
});

// @route GET /api/terminal-qr/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data: scans, error } = await supabaseAdmin
      .from('qr_scan_history')
      .select('*, qr_codes(title, qr_type)')
      .eq('user_id', req.user.userId)
      .order('scanned_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json({ success: true, history: scans || [] });
  } catch (error) {
    logger.error('Terminal QR history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching QR history', error: error.message });
  }
});

export default router;
