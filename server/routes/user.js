import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';
import upload from '../middleware/upload.js';
import { uploadFile, deleteFile } from '../lib/supabaseStorage.js';
import crypto from 'crypto';

const router = express.Router();
router.use(authenticateToken);

// @route GET /api/user/profile
router.get('/profile', async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin.from('profiles').select('*').eq('id', req.user.userId).single();
    if (error || !profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    res.json({
      success: true, message: 'Profile retrieved successfully',
      data: {
        user: {
          id: profile.id, name: profile.name, email: req.user.email,
          avatarUrl: profile.avatar_url, bio: profile.bio, role: profile.role,
          securityScore: profile.security_score, totalDevices: profile.total_devices,
          personalInfo: profile.personal_info, professionalInfo: profile.professional_info,
          address: profile.address, socialProfiles: profile.social_profiles,
          preferences: profile.preferences, securitySettings: profile.security_settings,
          billing: profile.billing, subscriptionPlan: profile.subscription_plan,
          subscriptionIsActive: profile.subscription_is_active,
          createdAt: profile.created_at, updatedAt: profile.updated_at,
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
});

// @route PUT /api/user/profile
router.put('/profile', async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { name, bio, profile, securitySettings } = req.body;
    const { data: existing, error: fetchErr } = await supabaseAdmin.from('profiles').select('*').eq('id', req.user.userId).single();
    if (fetchErr || !existing) return res.status(404).json({ success: false, message: 'Profile not found' });

    const updates = {};
    if (name) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio;
    if (securitySettings) updates.security_settings = { ...existing.security_settings, ...securitySettings };
    if (profile) {
      if (profile.personalInfo) updates.personal_info = { ...existing.personal_info, ...profile.personalInfo };
      if (profile.professionalInfo) updates.professional_info = { ...existing.professional_info, ...profile.professionalInfo };
      if (profile.address) updates.address = { ...existing.address, ...profile.address };
      if (profile.socialProfiles) updates.social_profiles = { ...existing.social_profiles, ...profile.socialProfiles };
      if (profile.preferences) updates.preferences = { ...existing.preferences, ...profile.preferences };
    }

    const { data: updated, error } = await supabaseAdmin.from('profiles').update(updates).eq('id', req.user.userId).select().single();
    if (error) throw error;

    res.json({ success: true, message: 'Profile updated successfully', data: { user: updated } });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
});

// @route PUT /api/user/password  (Supabase Auth handles this now)
router.put('/password', [body('newPassword').isLength({ min: 8 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { newPassword } = req.body;
    // Forward to Supabase Auth admin API
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.userId, { password: newPassword });
    if (error) throw error;

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Error updating password', error: error.message });
  }
});

// @route DELETE /api/user/account
router.delete('/account', async (req, res) => {
  try {
    // Delete all user data (cascade from auth.users via FK)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user.userId);
    if (error) throw error;

    logger.info(`Account deleted: ${req.user.userId}`);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Error deleting account', error: error.message });
  }
});

// @route GET /api/user/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const [{ count: pwCount }, { count: docCount }, { count: qrCount }, { count: devCount }] = await Promise.all([
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('secure_documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('devices').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    res.json({ success: true, stats: { passwords: pwCount || 0, documents: docCount || 0, qrCodes: qrCount || 0, devices: devCount || 0 } });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

// @route POST /api/user/sessions/revoke
router.post('/sessions/revoke', async (req, res) => {
  try {
    // Sign out all sessions for this user
    await supabaseAdmin.auth.admin.signOut(req.user.userId, 'global');
    res.json({ success: true, message: 'All sessions revoked successfully' });
  } catch (error) {
    logger.error('Revoke sessions error:', error);
    res.status(500).json({ success: false, message: 'Error revoking sessions', error: error.message });
  }
});

// @route POST /api/user/documents/upload  (profile documents, e.g. avatar or ID)
router.post('/documents/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { category = 'document' } = req.body;
    const userId = req.user.userId;
    const storagePath = `${userId}/${category}/${Date.now()}-${req.file.originalname}`;

    await uploadFile('documents', storagePath, req.file.buffer, req.file.mimetype);

    const { data: profile, error: fetchErr } = await supabaseAdmin.from('profiles').select('personal_info').eq('id', userId).single();
    if (fetchErr) throw fetchErr;

    const personalInfo = profile?.personal_info || {};
    const docs = personalInfo[category] || [];
    docs.push({ id: crypto.randomUUID(), storagePath, originalName: req.file.originalname, uploadedAt: new Date().toISOString() });
    personalInfo[category] = docs;

    await supabaseAdmin.from('profiles').update({ personal_info: personalInfo }).eq('id', userId);

    res.status(201).json({ success: true, message: 'Document uploaded successfully', document: { storagePath, originalName: req.file.originalname } });
  } catch (error) {
    logger.error('Document upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
  }
});

// @route GET /api/user/documents
router.get('/documents', async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin.from('profiles').select('personal_info').eq('id', req.user.userId).single();
    if (error) throw error;
    res.json({ success: true, documents: profile?.personal_info || {} });
  } catch (error) {
    logger.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'Error fetching documents', error: error.message });
  }
});

// @route GET /api/user/billing
router.get('/billing', async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin.from('profiles').select('billing, subscription_plan, subscription_is_active, subscription_start_date, subscription_end_date').eq('id', req.user.userId).single();
    if (error) throw error;
    res.json({ success: true, billing: { ...profile.billing, subscriptionPlan: profile.subscription_plan, subscriptionIsActive: profile.subscription_is_active } });
  } catch (error) {
    logger.error('Get billing error:', error);
    res.status(500).json({ success: false, message: 'Error fetching billing', error: error.message });
  }
});

// @route GET /api/user/security
router.get('/security', async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin.from('profiles').select('security_settings, security_score').eq('id', req.user.userId).single();
    if (error) throw error;

    const { data: loginHistory } = await supabaseAdmin.from('login_history').select('*').eq('user_id', req.user.userId).order('created_at', { ascending: false }).limit(10);

    res.json({ success: true, security: { securitySettings: profile.security_settings, securityScore: profile.security_score, loginHistory: loginHistory || [] } });
  } catch (error) {
    logger.error('Get security error:', error);
    res.status(500).json({ success: false, message: 'Error fetching security settings', error: error.message });
  }
});

// @route GET /api/user/notifications
router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pg = parseInt(page, 10), lim = parseInt(limit, 10);

    const { data: notifications, count, error } = await supabaseAdmin
      .from('notifications').select('*', { count: 'exact' })
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .range((pg - 1) * lim, pg * lim - 1);
    if (error) throw error;

    const unreadCount = await supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', req.user.userId).eq('is_read', false);

    res.json({ success: true, notifications: notifications || [], unreadCount: unreadCount.count || 0, pagination: { current: pg, pages: Math.ceil((count || 0) / lim), total: count || 0 } });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
});

// @route POST /api/user/notifications
router.post('/notifications', async (req, res) => {
  try {
    const { title, message, type = 'info', category = 'system', priority = 'medium', action = {}, metadata = {} } = req.body;
    const { data, error } = await supabaseAdmin.from('notifications').insert({ user_id: req.user.userId, title, message, type, category, priority, action, metadata }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, notification: data });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Error creating notification', error: error.message });
  }
});

// @route PUT /api/user/notifications/:notificationId/read
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', req.params.notificationId).eq('user_id', req.user.userId).select().single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification: data });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Error updating notification', error: error.message });
  }
});

// @route PUT /api/user/notifications/mark-all-read
router.put('/notifications/mark-all-read', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', req.user.userId).eq('is_read', false);
    if (error) throw error;
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Error updating notifications', error: error.message });
  }
});

// @route DELETE /api/user/notifications/:notificationId
router.delete('/notifications/:notificationId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('notifications').delete().eq('id', req.params.notificationId).eq('user_id', req.user.userId).select().single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Error deleting notification', error: error.message });
  }
});

// @route DELETE /api/user/notifications
router.delete('/notifications', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('notifications').delete().eq('user_id', req.user.userId);
    if (error) throw error;
    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    logger.error('Delete all notifications error:', error);
    res.status(500).json({ success: false, message: 'Error deleting notifications', error: error.message });
  }
});

export default router;
