// sync.js — migrated from Mongoose to Supabase Postgres
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

const performSync = async (syncLogId, deviceId, dataTypes, userId) => {
  try {
    await supabaseAdmin.from('sync_logs').update({ sync_status: 'in_progress' }).eq('id', syncLogId);
    await new Promise(r => setTimeout(r, 2000));
    await supabaseAdmin.from('sync_logs').update({
      sync_status: 'completed', completed_at: new Date().toISOString(),
      items_synced: { passwords: 10, documents: 5, settings: 1, notes: 0, qrcodes: 3 },
      total_items: 19, data_synced: 153600, duration: 2000,
    }).eq('id', syncLogId);
    await supabaseAdmin.from('devices').update({ status: 'online', last_synced_at: new Date().toISOString() }).eq('id', deviceId);
  } catch (err) { logger.error('performSync error:', err); }
};

router.post('/initiate', async (req, res) => {
  try {
    const { deviceId, syncType = 'manual', dataTypes = ['passwords', 'documents', 'settings', 'notes', 'qrcodes'], metadata = {} } = req.body;
    const userId = req.user.userId;

    if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID is required' });

    const { data: device, error: devErr } = await supabaseAdmin.from('devices').select('id, sync_enabled').eq('id', deviceId).eq('user_id', userId).single();
    if (devErr || !device) return res.status(404).json({ success: false, message: 'Device not found' });
    if (!device.sync_enabled) return res.status(400).json({ success: false, message: 'Sync is disabled for this device' });

    const { data: active } = await supabaseAdmin.from('sync_logs').select('id').eq('user_id', userId).eq('device_id', deviceId).in('sync_status', ['initiated', 'in_progress']).maybeSingle();
    if (active) return res.status(409).json({ success: false, message: 'Sync already in progress for this device', syncLog: active });

    const { data: syncLog, error } = await supabaseAdmin.from('sync_logs').insert({
      user_id: userId, device_id: deviceId, sync_type: syncType, sync_status: 'initiated',
      data_types: dataTypes, metadata: { ...metadata, initiatedBy: 'user', clientVersion: req.headers['client-version'] || 'unknown' },
    }).select().single();
    if (error) throw error;

    await supabaseAdmin.from('devices').update({ status: 'syncing' }).eq('id', deviceId);
    performSync(syncLog.id, deviceId, dataTypes, userId);

    res.status(201).json({ success: true, message: 'Sync initiated successfully', syncLog: { id: syncLog.id, syncType: syncLog.sync_type, syncStatus: syncLog.sync_status, dataTypes: syncLog.data_types, startedAt: syncLog.started_at } });
  } catch (error) {
    logger.error('Sync initiation error:', error);
    res.status(500).json({ success: false, message: 'Error initiating sync', error: error.message });
  }
});

router.get('/status/:syncLogId', async (req, res) => {
  try {
    const { data: syncLog, error } = await supabaseAdmin.from('sync_logs').select('*, devices(device_name, device_type)').eq('id', req.params.syncLogId).eq('user_id', req.user.userId).single();
    if (error || !syncLog) return res.status(404).json({ success: false, message: 'Sync log not found' });
    res.json({ success: true, syncLog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sync status', error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20, deviceId } = req.query;
    const pg = parseInt(page, 10), lim = parseInt(limit, 10);

    let q = supabaseAdmin.from('sync_logs').select('*', { count: 'exact' }).eq('user_id', req.user.userId).order('started_at', { ascending: false }).range((pg - 1) * lim, pg * lim - 1);
    if (deviceId) q = q.eq('device_id', deviceId);

    const { data: logs, count, error } = await q;
    if (error) throw error;
    res.json({ success: true, syncLogs: logs || [], pagination: { current: pg, pages: Math.ceil((count || 0) / lim), total: count || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sync history', error: error.message });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const { data: logs, error } = await supabaseAdmin.from('sync_logs').select('*').eq('user_id', req.user.userId).order('started_at', { ascending: false }).limit(5);
    if (error) throw error;
    res.json({ success: true, syncLogs: logs || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching recent syncs', error: error.message });
  }
});

router.get('/conflicts', async (req, res) => {
  try {
    const { data: logs, error } = await supabaseAdmin.from('sync_logs').select('id, conflicts, started_at, sync_status').eq('user_id', req.user.userId).neq('conflicts', '[]').order('started_at', { ascending: false });
    if (error) throw error;
    const conflicts = (logs || []).flatMap(l => (l.conflicts || []).map(c => ({ ...c, syncLogId: l.id, syncDate: l.started_at })));
    res.json({ success: true, conflicts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching conflicts', error: error.message });
  }
});

router.put('/resolve-conflict/:syncLogId', async (req, res) => {
  try {
    const { conflictId, resolution } = req.body;
    const { data: log, error: fetchErr } = await supabaseAdmin.from('sync_logs').select('conflicts').eq('id', req.params.syncLogId).eq('user_id', req.user.userId).single();
    if (fetchErr || !log) return res.status(404).json({ success: false, message: 'Sync log not found' });

    const updated = (log.conflicts || []).map(c => c.id === conflictId ? { ...c, resolution, resolvedAt: new Date().toISOString() } : c);
    const { error } = await supabaseAdmin.from('sync_logs').update({ conflicts: updated }).eq('id', req.params.syncLogId);
    if (error) throw error;
    res.json({ success: true, message: 'Conflict resolved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resolving conflict', error: error.message });
  }
});

router.get('/stats/overview', async (req, res) => {
  try {
    const { data: logs, error } = await supabaseAdmin.from('sync_logs').select('sync_status, data_synced, duration, started_at, sync_type').eq('user_id', req.user.userId);
    if (error) throw error;

    const rows = logs || [];
    const total = rows.length;
    const completed = rows.filter(l => l.sync_status === 'completed').length;
    const failed = rows.filter(l => l.sync_status === 'failed').length;
    const totalData = rows.reduce((s, l) => s + (l.data_synced || 0), 0);
    const avgDuration = total ? rows.reduce((s, l) => s + (l.duration || 0), 0) / total : 0;

    res.json({ success: true, stats: { total, completed, failed, successRate: total ? (completed / total * 100).toFixed(1) : 0, totalDataSynced: totalData, averageDuration: Math.round(avgDuration) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sync stats', error: error.message });
  }
});

router.post('/cancel/:syncLogId', async (req, res) => {
  try {
    const { data: log, error: fetchErr } = await supabaseAdmin.from('sync_logs').select('id, sync_status').eq('id', req.params.syncLogId).eq('user_id', req.user.userId).single();
    if (fetchErr || !log) return res.status(404).json({ success: false, message: 'Sync log not found' });
    if (!['initiated', 'in_progress'].includes(log.sync_status)) return res.status(400).json({ success: false, message: 'Sync cannot be cancelled in its current state' });

    await supabaseAdmin.from('sync_logs').update({ sync_status: 'failed', error: { message: 'Cancelled by user' }, completed_at: new Date().toISOString() }).eq('id', log.id);
    res.json({ success: true, message: 'Sync cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling sync', error: error.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const { data: devices, error } = await supabaseAdmin.from('devices').select('id, device_name, sync_enabled, auto_sync_enabled, sync_settings').eq('user_id', req.user.userId);
    if (error) throw error;
    res.json({ success: true, devices: devices || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sync settings', error: error.message });
  }
});

router.put('/settings/:deviceId', async (req, res) => {
  try {
    const { syncEnabled, autoSyncEnabled, syncSettings } = req.body;
    const updates = {};
    if (syncEnabled !== undefined) updates.sync_enabled = syncEnabled;
    if (autoSyncEnabled !== undefined) updates.auto_sync_enabled = autoSyncEnabled;
    if (syncSettings) {
      const { data: existing } = await supabaseAdmin.from('devices').select('sync_settings').eq('id', req.params.deviceId).eq('user_id', req.user.userId).single();
      updates.sync_settings = { ...(existing?.sync_settings || {}), ...syncSettings };
    }
    const { data: device, error } = await supabaseAdmin.from('devices').update(updates).eq('id', req.params.deviceId).eq('user_id', req.user.userId).select().single();
    if (error || !device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, message: 'Sync settings updated', device });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating sync settings', error: error.message });
  }
});

export default router;
