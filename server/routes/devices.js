import express from 'express';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';
import emailService from '../services/emailService.js';

const router = express.Router();
router.use(authenticateToken);

const notify = async (userId, title, message, category = 'security', priority = 'medium', action = {}, metadata = {}) => {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId, title, message,
      type: 'success', category, priority,
      action, metadata,
    });
  } catch (e) {
    logger.error('Failed to create notification:', e);
  }
};

// @route POST /api/devices/register
router.post('/register', async (req, res) => {
  try {
    const { deviceName, deviceType, operatingSystem, browser, location } = req.body;
    const userId = req.user.userId;

    if (!deviceName || !deviceType) {
      return res.status(400).json({ success: false, message: 'Device name and type are required' });
    }

    const validTypes = ['laptop', 'mobile', 'tablet', 'desktop', 'other'];
    if (!validTypes.includes(deviceType)) {
      return res.status(400).json({ success: false, message: `Invalid device type. Must be one of: ${validTypes.join(', ')}` });
    }

    // Upsert: if same name+type already exists for this user, update it
    const { data: existing } = await supabaseAdmin
      .from('devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_name', deviceName)
      .eq('device_type', deviceType)
      .maybeSingle();

    if (existing) {
      const { data: updated } = await supabaseAdmin
        .from('devices')
        .update({
          last_active_at: new Date().toISOString(),
          status: 'online',
          operating_system: operatingSystem || existing.operating_system,
          browser: browser || existing.browser,
          ip_address: req.ip,
          ...(location && { location }),
        })
        .eq('id', existing.id)
        .select()
        .single();
      return res.json({ success: true, message: 'Device updated successfully', device: updated });
    }

    const { count } = await supabaseAdmin
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const isPrimary = (count || 0) === 0;
    const deviceId = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    const verificationCode = isPrimary ? null : Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = isPrimary ? null : new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: device, error } = await supabaseAdmin
      .from('devices')
      .insert({
        user_id: userId,
        device_name: deviceName,
        device_type: deviceType,
        device_id: deviceId,
        operating_system: operatingSystem || 'Unknown',
        browser: browser || 'Unknown',
        ip_address: req.ip || '0.0.0.0',
        location: location || {},
        status: 'online',
        is_primary: isPrimary,
        is_trusted: isPrimary,
        is_verified: isPrimary,
        verification_method: isPrimary ? 'manual' : null,
        verification_code: verificationCode,
        verification_code_expiry: verificationExpiry,
      })
      .select()
      .single();

    if (error) throw error;

    await notify(userId, 'New Device Registered', `"${deviceName}" has been added to your account.`,
      'security', 'medium',
      { type: 'internal', label: 'View Devices', link: '/features/multi-device' },
      { resourceType: 'device', resourceId: device.id, deviceName, deviceType });

    if (!isPrimary) {
      try {
        await emailService.sendVerificationCode(
          req.user.email, req.user.name, deviceName, verificationCode,
          { deviceType, operatingSystem, browser },
        );
      } catch (emailErr) {
        logger.error('Failed to send verification email:', emailErr);
      }
    }

    res.status(201).json({
      success: true,
      message: isPrimary ? 'Device registered successfully' : 'Device registered. Check your email for verification code.',
      device,
      requiresVerification: !isPrimary,
    });
  } catch (error) {
    logger.error('Device registration error:', error);
    res.status(500).json({ success: false, message: 'Error registering device', error: error.message });
  }
});

// @route GET /api/devices
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.userId;

    let q = supabaseAdmin
      .from('devices')
      .select('id, device_name, device_type, device_id, operating_system, browser, ip_address, location, status, last_synced_at, last_active_at, sync_enabled, auto_sync_enabled, sync_settings, is_trusted, is_primary, is_verified, verification_method, verified_at, created_at, updated_at')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    if (status) q = q.eq('status', status);

    const { data: devices, error } = await q;
    if (error) throw error;

    const online = (devices || []).filter(d => d.status === 'online').length;

    res.json({
      success: true,
      devices: devices || [],
      stats: { total: (devices || []).length, online, offline: (devices || []).length - online },
    });
  } catch (error) {
    logger.error('Error fetching devices:', error);
    res.status(500).json({ success: false, message: 'Error fetching devices', error: error.message });
  }
});

// @route GET /api/devices/stats  (must precede /:id)
router.get('/stats', async (req, res) => {
  try {
    const { data: devices, error } = await supabaseAdmin
      .from('devices')
      .select('status, device_type, last_active_at, device_name, sync_enabled, is_trusted')
      .eq('user_id', req.user.userId);

    if (error) throw error;

    const rows = devices || [];
    const statusMap = {}, typeMap = {};
    let trustedDevices = 0, syncEnabledCount = 0;

    for (const d of rows) {
      statusMap[d.status] = (statusMap[d.status] || 0) + 1;
      typeMap[d.device_type] = (typeMap[d.device_type] || 0) + 1;
      if (d.is_trusted) trustedDevices++;
      if (d.sync_enabled) syncEnabledCount++;
    }

    const recentActivity = [...rows]
      .sort((a, b) => new Date(b.last_active_at) - new Date(a.last_active_at))
      .slice(0, 5)
      .map(d => ({ deviceName: d.device_name, deviceType: d.device_type, lastActiveAt: d.last_active_at, status: d.status }));

    res.json({
      success: true,
      stats: [{
        statusBreakdown: Object.entries(statusMap).map(([_id, count]) => ({ _id, count })),
        typeBreakdown: Object.entries(typeMap).map(([_id, count]) => ({ _id, count })),
        recentActivity,
        syncStats: [{ _id: null, avgSyncEnabled: syncEnabledCount / (rows.length || 1), trustedDevices }],
      }],
    });
  } catch (error) {
    logger.error('Error fetching device stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
  }
});

// @route GET /api/devices/stats/overview
router.get('/stats/overview', async (req, res) => {
  // Same as /stats — delegate
  req.url = '/stats';
  router.handle(req, res, () => {});
});

// @route GET /api/devices/:id
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: device, error } = await supabaseAdmin
      .from('devices')
      .select('*, sync_logs(sync_type, sync_status, started_at, completed_at, duration, total_items)')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !device) return res.status(404).json({ success: false, message: 'Device not found' });

    const recentSyncs = (device.sync_logs || [])
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      .slice(0, 10);

    const { sync_logs, ...deviceData } = device;
    res.json({ success: true, device: deviceData, recentSyncs });
  } catch (error) {
    logger.error('Error fetching device details:', error);
    res.status(500).json({ success: false, message: 'Error fetching device details', error: error.message });
  }
});

// @route PUT /api/devices/:id
router.put('/:id', async (req, res) => {
  try {
    const { deviceName, syncEnabled, autoSyncEnabled, syncSettings, isTrusted } = req.body;
    const userId = req.user.userId;

    const updates = {};
    if (deviceName) updates.device_name = deviceName;
    if (syncEnabled !== undefined) updates.sync_enabled = syncEnabled;
    if (autoSyncEnabled !== undefined) updates.auto_sync_enabled = autoSyncEnabled;
    if (isTrusted !== undefined) updates.is_trusted = isTrusted;

    if (syncSettings) {
      const { data: existing } = await supabaseAdmin.from('devices').select('sync_settings').eq('id', req.params.id).eq('user_id', userId).single();
      updates.sync_settings = { ...(existing?.sync_settings || {}), ...syncSettings };
    }

    const { data: device, error } = await supabaseAdmin
      .from('devices')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, message: 'Device updated successfully', device });
  } catch (error) {
    logger.error('Error updating device:', error);
    res.status(500).json({ success: false, message: 'Error updating device', error: error.message });
  }
});

// @route DELETE /api/devices/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: device, error: fetchErr } = await supabaseAdmin
      .from('devices').select('*').eq('id', req.params.id).eq('user_id', userId).single();

    if (fetchErr || !device) return res.status(404).json({ success: false, message: 'Device not found' });

    if (device.is_primary) {
      const { count } = await supabaseAdmin
        .from('devices').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).neq('id', device.id);
      if ((count || 0) > 0) {
        return res.status(400).json({ success: false, message: 'Cannot remove primary device. Set another device as primary first.' });
      }
    }

    const { error } = await supabaseAdmin.from('devices').delete().eq('id', device.id);
    if (error) throw error;

    await notify(userId, 'Device Removed', `"${device.device_name}" has been removed from your account.`,
      'security', 'high',
      { type: 'internal', label: 'View Devices', link: '/features/multi-device' },
      { resourceType: 'device', resourceId: device.id, deviceName: device.device_name });

    res.json({ success: true, message: 'Device removed successfully' });
  } catch (error) {
    logger.error('Error removing device:', error);
    res.status(500).json({ success: false, message: 'Error removing device', error: error.message });
  }
});

// @route POST /api/devices/:id/sync
router.post('/:id/sync', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: device, error: fetchErr } = await supabaseAdmin
      .from('devices').select('*').eq('id', req.params.id).eq('user_id', userId).single();

    if (fetchErr || !device) return res.status(404).json({ success: false, message: 'Device not found' });

    const enabledTypes = Object.entries(device.sync_settings || {})
      .filter(([, v]) => v).map(([k]) => k);

    const { data: syncLog, error } = await supabaseAdmin
      .from('sync_logs')
      .insert({ user_id: userId, device_id: device.id, sync_type: 'manual', sync_status: 'initiated', data_types: enabledTypes })
      .select().single();

    if (error) throw error;

    await supabaseAdmin.from('devices').update({ status: 'syncing' }).eq('id', device.id);

    setTimeout(async () => {
      await supabaseAdmin.from('sync_logs').update({
        sync_status: 'completed',
        items_synced: { passwords: 10, documents: 5, settings: 1, notes: 0, qrcodes: 3 },
        total_items: 19,
        data_synced: 153600,
        duration: 2000,
        completed_at: new Date().toISOString(),
      }).eq('id', syncLog.id);
      await supabaseAdmin.from('devices').update({ status: 'online', last_synced_at: new Date().toISOString() }).eq('id', device.id);
    }, 2000);

    res.json({ success: true, message: 'Sync initiated successfully', syncLog: { id: syncLog.id, status: syncLog.sync_status, startedAt: syncLog.started_at } });
  } catch (error) {
    logger.error('Error initiating sync:', error);
    res.status(500).json({ success: false, message: 'Error initiating sync', error: error.message });
  }
});

// @route PUT /api/devices/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['online', 'offline', 'syncing'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const { data: device, error } = await supabaseAdmin
      .from('devices')
      .update({ status, last_active_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .select().single();

    if (error || !device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, message: 'Device status updated', device });
  } catch (error) {
    logger.error('Error updating device status:', error);
    res.status(500).json({ success: false, message: 'Error updating device status', error: error.message });
  }
});

// @route POST /api/devices/:id/send-verification
router.post('/:id/send-verification', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data: device, error: fetchErr } = await supabaseAdmin
      .from('devices').select('*').eq('id', req.params.id).eq('user_id', userId).single();

    if (fetchErr || !device) return res.status(404).json({ success: false, message: 'Device not found' });
    if (device.is_verified) return res.status(400).json({ success: false, message: 'Device is already verified' });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin.from('devices').update({
      verification_code: verificationCode,
      verification_code_expiry: verificationExpiry,
      verification_attempts: 0,
    }).eq('id', device.id);

    await emailService.sendVerificationCode(req.user.email, req.user.name, device.device_name, verificationCode, {
      deviceType: device.device_type, operatingSystem: device.operating_system, browser: device.browser,
    });

    res.json({ success: true, message: 'Verification code sent to your email', expiresIn: '10 minutes' });
  } catch (error) {
    logger.error('Error sending verification code:', error);
    res.status(500).json({ success: false, message: 'Error sending verification code', error: error.message });
  }
});

// @route POST /api/devices/:id/verify
router.post('/:id/verify', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Verification code is required' });

    const userId = req.user.userId;
    const { data: device, error: fetchErr } = await supabaseAdmin
      .from('devices').select('*').eq('id', req.params.id).eq('user_id', userId).single();

    if (fetchErr || !device) return res.status(404).json({ success: false, message: 'Device not found' });
    if (device.is_verified) return res.status(400).json({ success: false, message: 'Device is already verified' });

    const attempts = (device.verification_attempts || 0) + 1;
    if (device.verification_code !== code || new Date(device.verification_code_expiry) < new Date()) {
      await supabaseAdmin.from('devices').update({ verification_attempts: attempts }).eq('id', device.id);
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code', attemptsRemaining: 5 - attempts });
    }

    const { data: verified } = await supabaseAdmin
      .from('devices')
      .update({ is_verified: true, is_trusted: true, verified_at: new Date().toISOString(), verification_method: 'email', verification_code: null, verification_code_expiry: null, verification_attempts: 0 })
      .eq('id', device.id)
      .select().single();

    await emailService.sendDeviceVerifiedNotification(req.user.email, req.user.name, device.device_name);

    await notify(userId, 'Device Verified', `"${device.device_name}" has been successfully verified and is now trusted.`,
      'security', 'medium',
      { type: 'internal', label: 'View Devices', link: '/features/multi-device' },
      { resourceType: 'device', resourceId: device.id });

    res.json({ success: true, message: 'Device verified successfully', device: { id: verified.id, deviceName: verified.device_name, isVerified: verified.is_verified, verifiedAt: verified.verified_at, isTrusted: verified.is_trusted } });
  } catch (error) {
    logger.error('Error verifying device:', error);
    res.status(500).json({ success: false, message: 'Error verifying device', error: error.message });
  }
});

// @route POST /api/devices/:id/resend-verification
router.post('/:id/resend-verification', async (req, res) => {
  // Delegate to send-verification — identical logic
  req.url = `/${req.params.id}/send-verification`;
  router.handle(req, res, () => {});
});

export default router;
