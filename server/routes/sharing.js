// sharing.js
import express from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { authenticateToken as auth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  next();
};

const logShare = async (sharedPassId, ownerId, action, performedBy, details = {}, metadata = {}) => {
  try {
    await supabaseAdmin.from('share_logs').insert({
      shared_pass_id: sharedPassId, owner_id: ownerId, action,
      performed_by_user_id: performedBy, details, metadata,
    });
  } catch (e) { logger.error('share log error:', e); }
};

router.post('/share', auth, [
  body('passId').isUUID(),
  body('recipientEmail').isEmail().normalizeEmail(),
  body('accessLevel').isIn(['read', 'edit']),
  body('expiryDays').optional().isInt({ min: 1, max: 365 }),
], validate, async (req, res) => {
  try {
    const { passId, recipientEmail, recipientName, accessLevel, expiryDays, restrictions, templateId, message: msg } = req.body;
    const userId = req.user.userId;

    const { data: pass, error: passErr } = await supabaseAdmin.from('qr_codes').select('id').eq('id', passId).eq('user_id', userId).single();
    if (passErr || !pass) return res.status(404).json({ success: false, message: 'Pass not found or you do not have permission' });

    const { data: existing } = await supabaseAdmin.from('shared_passes').select('id').eq('owner_id', userId).eq('qr_code_id', passId).eq('recipient_email', recipientEmail).in('status', ['pending', 'active']).maybeSingle();
    if (existing) return res.status(400).json({ success: false, message: 'Pass already shared with this email' });

    const { data: recipientUser } = await supabaseAdmin.from('profiles').select('id').eq('email', recipientEmail).maybeSingle();

    let expiresAt = null;
    if (expiryDays) { const d = new Date(); d.setDate(d.getDate() + expiryDays); expiresAt = d.toISOString(); }

    const shareLinkToken = crypto.randomBytes(32).toString('hex');
    const linkExpiry = new Date(Date.now() + (expiryDays || 7) * 24 * 60 * 60 * 1000).toISOString();

    const { data: share, error } = await supabaseAdmin.from('shared_passes').insert({
      owner_id: userId, qr_code_id: passId, recipient_email: recipientEmail,
      recipient_user_id: recipientUser?.id || null, recipient_name: recipientName || null,
      access_level: accessLevel, status: 'pending',
      permissions: { canView: true, canEdit: accessLevel === 'edit', canDownload: true, canPrint: true, canShare: false },
      restrictions: restrictions || [], share_method: 'email',
      share_link_token: shareLinkToken, share_link_expires_at: linkExpiry,
      template_id: templateId || null, expires_at: expiresAt,
    }).select().single();
    if (error) throw error;

    await logShare(share.id, userId, 'shared', userId, { recipientEmail, accessLevel });
    res.status(201).json({ success: true, message: 'Pass shared successfully', share });
  } catch (error) {
    logger.error('Share error:', error);
    res.status(500).json({ success: false, message: 'Error sharing pass', error: error.message });
  }
});

router.get('/my-shares', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pg = parseInt(page, 10), lim = parseInt(limit, 10);

    let q = supabaseAdmin.from('shared_passes').select('*, qr_codes(title, qr_type)', { count: 'exact' })
      .eq('owner_id', req.user.userId).order('created_at', { ascending: false }).range((pg - 1) * lim, pg * lim - 1);
    if (status) q = q.eq('status', status);

    const { data: shares, count, error } = await q;
    if (error) throw error;
    res.json({ success: true, shares: shares || [], pagination: { current: pg, pages: Math.ceil((count || 0) / lim), total: count || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching shares', error: error.message });
  }
});

router.get('/shared-with-me', auth, async (req, res) => {
  try {
    const { data: shares, error } = await supabaseAdmin.from('shared_passes').select('*, qr_codes(title, qr_type, qr_code_image)').eq('recipient_user_id', req.user.userId).eq('status', 'active');
    if (error) throw error;
    res.json({ success: true, shares: shares || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching shared passes', error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { accessLevel, restrictions, expiryDays } = req.body;
    const updates = {};
    if (accessLevel) { updates.access_level = accessLevel; updates.permissions = { canView: true, canEdit: accessLevel === 'edit', canDownload: true, canPrint: true, canShare: false }; }
    if (restrictions) updates.restrictions = restrictions;
    if (expiryDays) { const d = new Date(); d.setDate(d.getDate() + expiryDays); updates.expires_at = d.toISOString(); }

    const { data: share, error } = await supabaseAdmin.from('shared_passes').update(updates).eq('id', req.params.id).eq('owner_id', req.user.userId).select().single();
    if (error || !share) return res.status(404).json({ success: false, message: 'Share not found' });

    await logShare(share.id, req.user.userId, 'modified', req.user.userId, req.body);
    res.json({ success: true, message: 'Share updated successfully', share });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating share', error: error.message });
  }
});

router.delete('/:id/revoke', auth, async (req, res) => {
  try {
    const { data: share, error: fetchErr } = await supabaseAdmin.from('shared_passes').select('id, owner_id').eq('id', req.params.id).eq('owner_id', req.user.userId).single();
    if (fetchErr || !share) return res.status(404).json({ success: false, message: 'Share not found' });

    await supabaseAdmin.from('shared_passes').update({ status: 'revoked' }).eq('id', share.id);
    await logShare(share.id, req.user.userId, 'revoked', req.user.userId);
    res.json({ success: true, message: 'Share revoked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error revoking share', error: error.message });
  }
});

// Templates
router.get('/templates', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('share_templates').select('*').eq('owner_id', req.user.userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, templates: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching templates', error: error.message });
  }
});

router.post('/templates', auth, async (req, res) => {
  try {
    const { name, description, accessLevel, expiryDays, restrictions, permissions, isDefault } = req.body;
    const { data, error } = await supabaseAdmin.from('share_templates').insert({ owner_id: req.user.userId, name, description, access_level: accessLevel || 'read', expiry_days: expiryDays || 30, restrictions: restrictions || [], permissions: permissions || {}, is_default: isDefault || false }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Template created', template: data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating template', error: error.message });
  }
});

router.put('/templates/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('share_templates').update(req.body).eq('id', req.params.id).eq('owner_id', req.user.userId).select().single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, message: 'Template updated', template: data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating template', error: error.message });
  }
});

router.delete('/templates/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('share_templates').delete().eq('id', req.params.id).eq('owner_id', req.user.userId).select().single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting template', error: error.message });
  }
});

router.get('/logs', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('share_logs').select('*').eq('owner_id', req.user.userId).order('occurred_at', { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ success: true, logs: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching share logs', error: error.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const { data: shares, error } = await supabaseAdmin.from('shared_passes').select('status, access_count, access_level').eq('owner_id', req.user.userId);
    if (error) throw error;
    const total = (shares || []).length;
    const active = (shares || []).filter(s => s.status === 'active').length;
    const totalAccess = (shares || []).reduce((s, sh) => s + (sh.access_count || 0), 0);
    res.json({ success: true, stats: { total, active, revoked: (shares || []).filter(s => s.status === 'revoked').length, totalAccess } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching share stats', error: error.message });
  }
});

export default router;
