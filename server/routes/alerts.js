import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

// Auto-check QR codes and passwords for expiring/expired items and create alerts
const autoCheckExpirations = async (userId) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let created = 0;

    // QR codes with expiry in data or expires_at field
    const { data: qrCodes } = await supabaseAdmin
      .from('qr_codes')
      .select('id, title, data, expires_at, category, qr_type')
      .eq('user_id', userId)
      .eq('is_active', true);

    for (const qr of qrCodes || []) {
      let expiryDate = null;
      let cardType = qr.qr_type || 'item';
      let expiryFormatted = null;

      const parsedData = typeof qr.data === 'object' ? qr.data : {};
      const expiry = parsedData.expiry || parsedData.expiryDate;
      if (expiry) {
        expiryFormatted = expiry;
        const [mm, yy] = expiry.split('/');
        if (mm && yy) expiryDate = new Date(parseInt('20' + yy, 10), parseInt(mm, 10), 0);
      }
      if (!expiryDate && qr.expires_at) expiryDate = new Date(qr.expires_at);
      if (parsedData.type) cardType = parsedData.type.toLowerCase();

      if (!expiryDate || expiryDate > thirtyDaysFromNow) continue;

      const { data: existing } = await supabaseAdmin
        .from('alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('related_to', 'qrcode')
        .eq('related_id', qr.id)
        .eq('is_resolved', false)
        .maybeSingle();

      if (existing) continue;

      const daysUntil = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      const isCard = ['credit', 'debit'].includes(cardType);
      const icon = isCard ? '💳' : '🎫';
      const alertType = isCard ? 'card_expiry' : 'pass_expiry';
      let severity = 'low', title = '', message = '';

      if (daysUntil <= 0) {
        severity = 'critical';
        const ago = Math.abs(daysUntil);
        title = `${icon} ${qr.title} EXPIRED`;
        message = `Your ${cardType} "${qr.title}" expired ${ago === 0 ? 'today' : `${ago} day${ago === 1 ? '' : 's'} ago`}. Immediate renewal required!`;
      } else if (daysUntil <= 7) {
        severity = 'high'; title = `${icon} ${qr.title} Expiring Very Soon`;
        message = `Your ${cardType} "${qr.title}" will expire in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`;
      } else if (daysUntil <= 14) {
        severity = 'medium'; title = `${icon} ${qr.title} Expiring Soon`;
        message = `Your ${cardType} "${qr.title}" will expire in ${daysUntil} days.`;
      } else {
        severity = 'low'; title = `${icon} ${qr.title} Expiring Soon`;
        message = `Your ${cardType} "${qr.title}" will expire in ${daysUntil} days.`;
      }

      await supabaseAdmin.from('alerts').insert({
        user_id: userId, alert_type: alertType, severity, title, message,
        related_to: 'qrcode', related_id: qr.id, action_required: true,
        action_url: '/features/qr-scan', action_label: daysUntil <= 0 ? 'Renew Now' : 'View Card',
        expiry_date: expiryDate.toISOString(),
        metadata: { cardType, isCard, qrTitle: qr.title, daysUntilExpiry: daysUntil, category: qr.category, expiryFormatted },
      });
      created++;
    }

    // Expiring passwords
    const { data: expiringPasswords } = await supabaseAdmin
      .from('passwords')
      .select('id, title, expires_at')
      .eq('user_id', userId)
      .gte('expires_at', now.toISOString())
      .lte('expires_at', thirtyDaysFromNow.toISOString());

    for (const pw of expiringPasswords || []) {
      const { data: existing } = await supabaseAdmin
        .from('alerts').select('id')
        .eq('user_id', userId).eq('related_to', 'password').eq('related_id', pw.id).eq('is_resolved', false).maybeSingle();
      if (existing) continue;

      const daysUntil = Math.ceil((new Date(pw.expires_at) - now) / (1000 * 60 * 60 * 24));
      await supabaseAdmin.from('alerts').insert({
        user_id: userId, alert_type: 'password_expiry',
        severity: daysUntil <= 7 ? 'high' : 'medium',
        title: 'Password Expiring Soon',
        message: `Your password for "${pw.title}" will expire in ${daysUntil} days`,
        related_to: 'password', related_id: pw.id, action_required: true,
        action_url: `/dashboard/passwords/${pw.id}`, action_label: 'Update Password',
        expiry_date: pw.expires_at,
      });
      created++;
    }

    // Expiring documents
    const { data: expiringDocs } = await supabaseAdmin
      .from('secure_documents')
      .select('id, original_name, expires_at')
      .eq('user_id', userId)
      .gte('expires_at', now.toISOString())
      .lte('expires_at', thirtyDaysFromNow.toISOString());

    for (const doc of expiringDocs || []) {
      const { data: existing } = await supabaseAdmin
        .from('alerts').select('id')
        .eq('user_id', userId).eq('related_to', 'document').eq('related_id', doc.id).eq('is_resolved', false).maybeSingle();
      if (existing) continue;

      const daysUntil = Math.ceil((new Date(doc.expires_at) - now) / (1000 * 60 * 60 * 24));
      await supabaseAdmin.from('alerts').insert({
        user_id: userId, alert_type: 'document_expiry',
        severity: daysUntil <= 7 ? 'high' : 'medium',
        title: 'Document Expiring Soon',
        message: `Your document "${doc.original_name}" will expire in ${daysUntil} days`,
        related_to: 'document', related_id: doc.id, action_required: true,
        action_url: `/dashboard/documents/${doc.id}`, action_label: 'Renew Document',
        expiry_date: doc.expires_at,
      });
      created++;
    }

    return created;
  } catch (err) {
    logger.error('autoCheckExpirations error:', err);
    return 0;
  }
};

// @route GET /api/alerts
router.get('/', async (req, res) => {
  try {
    await autoCheckExpirations(req.user.userId);

    const { alertType, severity, isRead, isResolved, page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;
    const pg = parseInt(page, 10), lim = parseInt(limit, 10);

    let q = supabaseAdmin
      .from('alerts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((pg - 1) * lim, pg * lim - 1);

    if (alertType) q = q.eq('alert_type', alertType);
    if (severity) q = q.eq('severity', severity);
    if (isRead !== undefined) q = q.eq('is_read', isRead === 'true');
    if (isResolved !== undefined) q = q.eq('is_resolved', isResolved === 'true');

    const { data: alerts, count, error } = await q;
    if (error) throw error;

    res.json({ success: true, alerts: alerts || [], pagination: { current: pg, pages: Math.ceil((count || 0) / lim), total: count || 0 } });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, message: 'Error fetching alerts', error: error.message });
  }
});

// @route GET /api/alerts/stats
router.get('/stats', async (req, res) => {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('alerts').select('severity, is_read, is_resolved, alert_type').eq('user_id', req.user.userId);
    if (error) throw error;

    const total = (rows || []).length;
    const unread = (rows || []).filter(a => !a.is_read).length;
    const unresolved = (rows || []).filter(a => !a.is_resolved).length;
    const bySeverity = {}, byType = {};

    for (const a of rows || []) {
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
      byType[a.alert_type] = (byType[a.alert_type] || 0) + 1;
    }

    res.json({ success: true, stats: { total, unread, unresolved, bySeverity, byType } });
  } catch (error) {
    logger.error('Error fetching alert stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching alert stats', error: error.message });
  }
});

// @route GET /api/alerts/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: alert, error } = await supabaseAdmin
      .from('alerts').select('*').eq('id', req.params.id).eq('user_id', req.user.userId).single();
    if (error || !alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, alert });
  } catch (error) {
    logger.error('Error fetching alert:', error);
    res.status(500).json({ success: false, message: 'Error fetching alert', error: error.message });
  }
});

// @route PUT /api/alerts/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const { data: alert, error } = await supabaseAdmin
      .from('alerts')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', req.params.id).eq('user_id', req.user.userId)
      .select().single();
    if (error || !alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert marked as read', alert });
  } catch (error) {
    logger.error('Error marking alert as read:', error);
    res.status(500).json({ success: false, message: 'Error updating alert', error: error.message });
  }
});

// @route PUT /api/alerts/mark-all-read
router.put('/mark-all-read', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('alerts')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', req.user.userId).eq('is_read', false);
    if (error) throw error;
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    logger.error('Error marking all alerts as read:', error);
    res.status(500).json({ success: false, message: 'Error updating alerts', error: error.message });
  }
});

// @route PUT /api/alerts/:id/resolve
router.put('/:id/resolve', async (req, res) => {
  try {
    const { resolvedBy = 'user' } = req.body;
    const { data: alert, error } = await supabaseAdmin
      .from('alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: resolvedBy })
      .eq('id', req.params.id).eq('user_id', req.user.userId)
      .select().single();
    if (error || !alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert resolved', alert });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ success: false, message: 'Error resolving alert', error: error.message });
  }
});

// @route DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    const { data: deleted, error } = await supabaseAdmin
      .from('alerts').delete().eq('id', req.params.id).eq('user_id', req.user.userId).select().single();
    if (error || !deleted) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert deleted successfully' });
  } catch (error) {
    logger.error('Error deleting alert:', error);
    res.status(500).json({ success: false, message: 'Error deleting alert', error: error.message });
  }
});

// @route POST /api/alerts/check-expirations
router.post('/check-expirations', async (req, res) => {
  try {
    const created = await autoCheckExpirations(req.user.userId);
    res.json({ success: true, message: 'Expiration check completed', alertsCreated: created });
  } catch (error) {
    logger.error('Error checking expirations:', error);
    res.status(500).json({ success: false, message: 'Error checking expirations', error: error.message });
  }
});

export default router;
