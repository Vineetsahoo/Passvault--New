import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

// @route GET /api/history
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, type = 'all', startDate, endDate, sortBy = 'desc' } = req.query;
    const userId = req.user.userId;
    const pg = parseInt(page, 10), lim = parseInt(limit, 10);

    const dateGte = startDate ? new Date(startDate).toISOString() : null;
    const dateLte = endDate ? new Date(endDate).toISOString() : null;

    const applyDate = (q, col) => {
      if (dateGte) q = q.gte(col, dateGte);
      if (dateLte) q = q.lte(col, dateLte);
      return q;
    };

    const historyItems = [];

    if (type === 'all' || type === 'password') {
      let q = supabaseAdmin.from('passwords').select('id, title, website, created_at, updated_at').eq('user_id', userId);
      q = applyDate(q, 'created_at');
      const { data: passwords } = await q;
      for (const p of passwords || []) {
        historyItems.push({ id: p.id, type: 'password', action: 'added', title: p.title, description: `Password added for ${p.website || p.title}`, icon: '🔑', color: 'blue', resourceId: p.id, resourceType: 'password', createdAt: p.created_at, updatedAt: p.updated_at });
        if (p.updated_at !== p.created_at) {
          historyItems.push({ id: `${p.id}-updated`, type: 'password', action: 'updated', title: p.title, description: `Password updated for ${p.website || p.title}`, icon: '🔄', color: 'yellow', resourceId: p.id, resourceType: 'password', createdAt: p.updated_at, updatedAt: p.updated_at });
        }
      }
    }

    if (type === 'all' || type === 'document') {
      let q = supabaseAdmin.from('secure_documents').select('id, original_name, file_type, created_at, updated_at').eq('user_id', userId);
      q = applyDate(q, 'created_at');
      const { data: docs } = await q;
      for (const d of docs || []) {
        historyItems.push({ id: d.id, type: 'document', action: 'uploaded', title: d.original_name, description: `Document uploaded: ${d.original_name}`, icon: '📄', color: 'green', resourceId: d.id, resourceType: 'document', createdAt: d.created_at, updatedAt: d.updated_at });
      }
    }

    if (type === 'all' || type === 'qrcode') {
      let q = supabaseAdmin.from('qr_codes').select('id, title, qr_type, scan_count, created_at, updated_at').eq('user_id', userId);
      q = applyDate(q, 'created_at');
      const { data: qrcodes } = await q;
      for (const q2 of qrcodes || []) {
        historyItems.push({ id: q2.id, type: 'qrcode', action: 'created', title: q2.title, description: `QR code created: ${q2.title}`, icon: '📱', color: 'purple', resourceId: q2.id, resourceType: 'qrcode', createdAt: q2.created_at, updatedAt: q2.updated_at });
        if ((q2.scan_count || 0) > 0) {
          historyItems.push({ id: `${q2.id}-scan`, type: 'qrcode', action: 'scanned', title: q2.title, description: `QR code scanned ${q2.scan_count} time${q2.scan_count === 1 ? '' : 's'}: ${q2.title}`, icon: '🔍', color: 'indigo', resourceId: q2.id, resourceType: 'qrcode', createdAt: q2.updated_at, updatedAt: q2.updated_at });
        }
      }
    }

    if (type === 'all' || type === 'backup') {
      let q = supabaseAdmin.from('backups').select('id, backup_type, backup_status, item_count, started_at, completed_at').eq('user_id', userId);
      q = applyDate(q, 'started_at');
      const { data: backups } = await q;
      for (const b of backups || []) {
        historyItems.push({ id: b.id, type: 'backup', action: b.backup_status, title: `${b.backup_type} Backup`, description: `Backup ${b.backup_status}${b.item_count ? ` (${b.item_count} items)` : ''}`, icon: '💾', color: b.backup_status === 'completed' ? 'green' : b.backup_status === 'failed' ? 'red' : 'orange', resourceId: b.id, resourceType: 'backup', createdAt: b.started_at, updatedAt: b.completed_at || b.started_at });
      }
    }

    if (type === 'all' || type === 'device') {
      let q = supabaseAdmin.from('devices').select('id, device_name, device_type, is_verified, created_at, updated_at').eq('user_id', userId);
      q = applyDate(q, 'created_at');
      const { data: devices } = await q;
      for (const d of devices || []) {
        historyItems.push({ id: d.id, type: 'device', action: 'registered', title: d.device_name, description: `Device registered: ${d.device_name} (${d.device_type})`, icon: '💻', color: 'teal', resourceId: d.id, resourceType: 'device', createdAt: d.created_at, updatedAt: d.updated_at });
        if (d.is_verified && d.updated_at !== d.created_at) {
          historyItems.push({ id: `${d.id}-verified`, type: 'device', action: 'verified', title: d.device_name, description: `Device verified: ${d.device_name}`, icon: '✅', color: 'green', resourceId: d.id, resourceType: 'device', createdAt: d.updated_at, updatedAt: d.updated_at });
        }
      }
    }

    if (type === 'all' || type === 'login') {
      let q = supabaseAdmin.from('login_history').select('id, device, browser, location, status, ip_address, created_at').eq('user_id', userId);
      q = applyDate(q, 'created_at');
      const { data: logins } = await q;
      for (const l of logins || []) {
        historyItems.push({ id: l.id, type: 'login', action: l.status, title: `Login ${l.status === 'success' ? 'successful' : 'failed'}`, description: `Login ${l.status} from ${l.device || 'unknown device'} (${l.location || l.ip_address || 'unknown location'})`, icon: l.status === 'success' ? '🔓' : '🚫', color: l.status === 'success' ? 'green' : 'red', resourceId: l.id, resourceType: 'login', createdAt: l.created_at, updatedAt: l.created_at });
      }
    }

    // Sort and paginate in-memory (history is a cross-table view — no single column to ORDER BY in DB)
    historyItems.sort((a, b) => sortBy === 'asc'
      ? new Date(a.createdAt) - new Date(b.createdAt)
      : new Date(b.createdAt) - new Date(a.createdAt));

    const total = historyItems.length;
    const paginated = historyItems.slice((pg - 1) * lim, pg * lim);

    res.json({
      success: true,
      history: paginated,
      pagination: { current: pg, pages: Math.ceil(total / lim), total },
    });
  } catch (error) {
    logger.error('History error:', error);
    res.status(500).json({ success: false, message: 'Error fetching history', error: error.message });
  }
});

// @route GET /api/history/summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.userId;
    const last30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: passwords },
      { count: documents },
      { count: qrcodes },
      { count: backups },
      { count: logins },
    ] = await Promise.all([
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', last30days),
      supabaseAdmin.from('secure_documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', last30days),
      supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', last30days),
      supabaseAdmin.from('backups').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('started_at', last30days),
      supabaseAdmin.from('login_history').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', last30days),
    ]);

    res.json({
      success: true,
      summary: {
        period: '30 days',
        activity: { passwords: passwords || 0, documents: documents || 0, qrCodes: qrcodes || 0, backups: backups || 0, logins: logins || 0 },
        total: (passwords || 0) + (documents || 0) + (qrcodes || 0) + (backups || 0) + (logins || 0),
      },
    });
  } catch (error) {
    logger.error('History summary error:', error);
    res.status(500).json({ success: false, message: 'Error fetching history summary', error: error.message });
  }
});

// @route GET /api/history/login
router.get('/login', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const pg = parseInt(page, 10), lim = parseInt(limit, 10);

    const { data: logins, count, error } = await supabaseAdmin
      .from('login_history')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .range((pg - 1) * lim, pg * lim - 1);

    if (error) throw error;
    res.json({ success: true, loginHistory: logins || [], pagination: { current: pg, pages: Math.ceil((count || 0) / lim), total: count || 0 } });
  } catch (error) {
    logger.error('Login history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching login history', error: error.message });
  }
});

export default router;
