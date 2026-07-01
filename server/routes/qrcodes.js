import express from 'express';
import crypto from 'crypto';
import qrcode from 'qrcode';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const ALG = 'aes-256-cbc';

const encryptData = (text, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALG, Buffer.from(key, 'hex'), iv);
  return { iv: iv.toString('hex'), encryptedData: cipher.update(text, 'utf8', 'hex') + cipher.final('hex') };
};

const decryptData = (encryptedData, key, iv) => {
  const decipher = crypto.createDecipheriv(ALG, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  return decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');
};

const buildQrString = (qrType, data) => {
  switch (qrType) {
    case 'wifi': return `WIFI:T:${data.encryption};S:${data.ssid};P:${data.password};;`;
    case 'url': return data.url;
    case 'email': return `mailto:${data.email}?subject=${data.subject || ''}&body=${data.body || ''}`;
    case 'phone': return `tel:${data.phone}`;
    case 'contact': return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name}\nTEL:${data.phone}\nEMAIL:${data.email}\nEND:VCARD`;
    case 'text': {
      let t = data.text;
      if (typeof t === 'string') { try { t = JSON.parse(t); } catch (_) {} }
      return typeof t === 'object' ? JSON.stringify(t) : String(t);
    }
    default: return JSON.stringify(data);
  }
};

// @route POST /api/qrcodes
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { qrType, title, data, isEncrypted, category, tags, description, expiresIn, maxScans, color, backgroundColor, size } = req.body;
    const userId = req.user.userId;

    if (!qrType || !title || !data) {
      return res.status(400).json({ success: false, message: 'QR type, title, and data are required' });
    }

    let encryptedPayload = null, encryptionMeta = null;
    if (isEncrypted) {
      const key = crypto.randomBytes(32).toString('hex');
      const { iv, encryptedData } = encryptData(JSON.stringify(data), key);
      encryptedPayload = encryptedData;
      encryptionMeta = { encryptionKey: key, iv };
    }

    let expiresAt = null;
    if (expiresIn) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(expiresIn, 10));
      expiresAt = d.toISOString();
    }
    if (!expiresAt && data?.expiry) {
      const [mm, yy] = data.expiry.split('/');
      if (mm && yy) expiresAt = new Date(parseInt('20' + yy, 10), parseInt(mm, 10), 0).toISOString();
    }

    const qrStr = qrType === 'password' && isEncrypted ? encryptedPayload : buildQrString(qrType, data);
    const qrCodeImage = await qrcode.toDataURL(qrStr, { color: { dark: color || '#000000', light: backgroundColor || '#FFFFFF' }, width: size || 256, errorCorrectionLevel: 'H' });

    const { data: record, error } = await supabaseAdmin
      .from('qr_codes')
      .insert({
        user_id: userId,
        qr_type: qrType,
        title,
        data: isEncrypted ? encryptionMeta : data,
        encrypted_data: encryptedPayload,
        qr_code_image: qrCodeImage,
        is_encrypted: !!isEncrypted,
        category: category || 'general',
        tags: tags || [],
        description: description || '',
        expires_at: expiresAt,
        max_scans: maxScans || null,
        color: color || '#000000',
        background_color: backgroundColor || '#FFFFFF',
        size: size || 256,
      })
      .select()
      .single();

    if (error) throw error;

    // Notification
    try {
      const cardType = qrType === 'password' ? 'Card' : 'Pass';
      const icon = qrType === 'password' ? '💳' : '🎫';
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        title: `${icon} New ${cardType} Created`,
        message: `Your "${title}" has been successfully created and secured with a QR code.`,
        type: qrType === 'password' ? 'security' : 'success',
        category: 'document', priority: 'medium',
        action: { type: 'internal', label: 'View Card', link: '/features/qr-scan' },
        metadata: { resourceType: 'qrcode', resourceId: record.id, newValue: `${qrType}:${title}` },
      });
    } catch (notifErr) { logger.error('Notification error:', notifErr); }

    res.status(201).json({
      success: true, message: 'QR code created successfully',
      qrCode: { id: record.id, _id: record.id, title: record.title, qrType: record.qr_type, data: record.data, qrCodeImage: record.qr_code_image, isEncrypted: record.is_encrypted, category: record.category, color: record.color, backgroundColor: record.background_color, expiresAt: record.expires_at, createdAt: record.created_at },
    });
  } catch (error) {
    logger.error('QR code creation error:', error);
    res.status(500).json({ success: false, message: 'Error creating QR code', error: error.message });
  }
});

// @route GET /api/qrcodes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { qrType, category, search, page = 1, limit = 20 } = req.query;
    const pg = parseInt(page, 10), lim = parseInt(limit, 10);
    const userId = req.user.userId;

    let q = supabaseAdmin
      .from('qr_codes')
      .select('id, qr_type, title, data, qr_code_image, is_encrypted, category, tags, description, scan_count, last_scanned_at, expires_at, is_active, max_scans, share_settings, color, background_color, size, created_at, updated_at', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range((pg - 1) * lim, pg * lim - 1);

    if (qrType && qrType !== 'all') q = q.eq('qr_type', qrType);
    if (category && category !== 'all') q = q.eq('category', category);
    if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data: qrCodes, count, error } = await q;
    if (error) throw error;

    res.json({ success: true, qrCodes: qrCodes || [], pagination: { current: pg, pages: Math.ceil((count || 0) / lim), total: count || 0 } });
  } catch (error) {
    logger.error('Error fetching QR codes:', error);
    res.status(500).json({ success: false, message: 'Error fetching QR codes', error: error.message });
  }
});

// @route GET /api/qrcodes/stats/overview  (must precede /:id)
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('qr_codes')
      .select('qr_type, scan_count, last_scanned_at, is_active, title')
      .eq('user_id', req.user.userId);
    if (error) throw error;

    const typeMap = {};
    let totalScans = 0, activeCount = 0;

    for (const r of rows || []) {
      totalScans += r.scan_count || 0;
      if (r.is_active) activeCount++;
      if (!typeMap[r.qr_type]) typeMap[r.qr_type] = { _id: r.qr_type, count: 0, scans: 0 };
      typeMap[r.qr_type].count++;
      typeMap[r.qr_type].scans += r.scan_count || 0;
    }

    const recentScans = [...(rows || [])]
      .filter(r => r.last_scanned_at)
      .sort((a, b) => new Date(b.last_scanned_at) - new Date(a.last_scanned_at))
      .slice(0, 5)
      .map(r => ({ title: r.title, qrType: r.qr_type, lastScannedAt: r.last_scanned_at, scanCount: r.scan_count }));

    const popularQRCodes = [...(rows || [])]
      .sort((a, b) => (b.scan_count || 0) - (a.scan_count || 0))
      .slice(0, 5)
      .map(r => ({ title: r.title, qrType: r.qr_type, scanCount: r.scan_count }));

    res.json({
      success: true,
      stats: [{
        totalStats: [{ totalQRCodes: (rows || []).length, totalScans, activeQRCodes: activeCount }],
        typeBreakdown: Object.values(typeMap),
        recentScans,
        popularQRCodes,
      }],
    });
  } catch (error) {
    logger.error('Error fetching QR stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
  }
});

// @route POST /api/qrcodes/scan/decode  (must precede /:id)
router.post('/scan/decode', authenticateToken, async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ success: false, message: 'QR data is required' });

    let type = 'text', parsedData = {};

    if (qrData.startsWith('WIFI:')) {
      type = 'wifi';
      const m = qrData.match(/T:([^;]+);S:([^;]+);P:([^;]+)/);
      if (m) parsedData = { encryption: m[1], ssid: m[2], password: m[3] };
    } else if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      type = 'url'; parsedData = { url: qrData };
    } else if (qrData.startsWith('mailto:')) {
      type = 'email'; parsedData = { email: (qrData.match(/mailto:([^?]+)/) || [])[1] || '' };
    } else if (qrData.startsWith('tel:')) {
      type = 'phone'; parsedData = { phone: qrData.replace('tel:', '') };
    } else if (qrData.startsWith('BEGIN:VCARD')) {
      type = 'contact'; parsedData = { vcard: qrData };
    } else {
      parsedData = { text: qrData };
    }

    res.json({ success: true, type, data: parsedData });
  } catch (error) {
    logger.error('Error decoding QR code:', error);
    res.status(500).json({ success: false, message: 'Error decoding QR code', error: error.message });
  }
});

// @route GET /api/qrcodes/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: qrCode, error } = await supabaseAdmin
      .from('qr_codes')
      .select('id, qr_type, title, data, qr_code_image, is_encrypted, category, tags, description, scan_count, last_scanned_at, expires_at, is_active, color, background_color, size, share_settings, created_at, updated_at')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (error || !qrCode) return res.status(404).json({ success: false, message: 'QR code not found' });
    res.json({ success: true, qrCode });
  } catch (error) {
    logger.error('Error fetching QR code:', error);
    res.status(500).json({ success: false, message: 'Error fetching QR code', error: error.message });
  }
});

// @route PUT /api/qrcodes/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, category, tags, description, isActive } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (category) updates.category = category;
    if (tags) updates.tags = tags;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data: qrCode, error } = await supabaseAdmin
      .from('qr_codes').update(updates).eq('id', req.params.id).eq('user_id', req.user.userId).select().single();
    if (error || !qrCode) return res.status(404).json({ success: false, message: 'QR code not found' });
    res.json({ success: true, message: 'QR code updated successfully', qrCode });
  } catch (error) {
    logger.error('Error updating QR code:', error);
    res.status(500).json({ success: false, message: 'Error updating QR code', error: error.message });
  }
});

// @route DELETE /api/qrcodes/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: deleted, error } = await supabaseAdmin
      .from('qr_codes').delete().eq('id', req.params.id).eq('user_id', req.user.userId).select().single();
    if (error || !deleted) return res.status(404).json({ success: false, message: 'QR code not found' });
    res.json({ success: true, message: 'QR code deleted successfully' });
  } catch (error) {
    logger.error('Error deleting QR code:', error);
    res.status(500).json({ success: false, message: 'Error deleting QR code', error: error.message });
  }
});

// @route POST /api/qrcodes/:id/scan  (public)
router.post('/:id/scan', async (req, res) => {
  try {
    const { deviceInfo, location } = req.body;

    const { data: qrCode, error } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !qrCode) return res.status(404).json({ success: false, message: 'QR code not found' });
    if (!qrCode.is_active) return res.status(403).json({ success: false, message: 'QR code is not active' });
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) return res.status(403).json({ success: false, message: 'QR code has expired' });
    if (qrCode.max_scans && qrCode.scan_count >= qrCode.max_scans) return res.status(403).json({ success: false, message: 'QR code has reached maximum scans' });

    await supabaseAdmin.from('qr_codes').update({ scan_count: qrCode.scan_count + 1, last_scanned_at: new Date().toISOString() }).eq('id', qrCode.id);

    await supabaseAdmin.from('qr_scan_history').insert({
      qr_code_id: qrCode.id, user_id: qrCode.user_id,
      device_info: deviceInfo || null, ip_address: req.ip,
      location: location || {},
    });

    let responseData = qrCode.data;
    if (qrCode.is_encrypted && qrCode.encrypted_data) {
      const { encryptionKey, iv } = qrCode.data || {};
      if (encryptionKey && iv) responseData = JSON.parse(decryptData(qrCode.encrypted_data, encryptionKey, iv));
    }

    res.json({ success: true, message: 'QR code scanned successfully', data: { type: qrCode.qr_type, title: qrCode.title, content: responseData, scanCount: qrCode.scan_count + 1 } });
  } catch (error) {
    logger.error('Error recording QR scan:', error);
    res.status(500).json({ success: false, message: 'Error recording scan', error: error.message });
  }
});

// @route GET /api/qrcodes/:id/image  (public)
router.get('/:id/image', async (req, res) => {
  try {
    const { data: qrCode, error } = await supabaseAdmin
      .from('qr_codes').select('qr_code_image, is_active').eq('id', req.params.id).single();
    if (error || !qrCode?.is_active) return res.status(404).json({ success: false, message: 'QR code not found' });
    res.json({ success: true, image: qrCode.qr_code_image });
  } catch (error) {
    logger.error('Error fetching QR image:', error);
    res.status(500).json({ success: false, message: 'Error fetching QR image', error: error.message });
  }
});

export default router;
