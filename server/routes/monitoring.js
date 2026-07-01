import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

const getPeriodStart = (period) => {
  const now = new Date();
  switch (period) {
    case 'today': { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
    case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
};

// @route GET /api/monitoring/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const userId = req.user.userId;
    const startDate = getPeriodStart(period).toISOString();

    const [
      { count: totalPasswords },
      { count: totalDocuments },
      { count: totalQRCodes },
      { count: totalBackups },
      { count: recentPasswords },
      { count: recentDocuments },
      { count: recentQRCodes },
      { count: recentBackups },
      { count: weakPasswords },
      { count: expiredPasswords },
      { data: profile },
    ] = await Promise.all([
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('secure_documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('backups').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startDate),
      supabaseAdmin.from('secure_documents').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startDate),
      supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startDate),
      supabaseAdmin.from('backups').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startDate),
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('strength', 'weak'),
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId).lte('expires_at', new Date().toISOString()),
      supabaseAdmin.from('profiles').select('security_score, subscription_plan').eq('id', userId).single(),
    ]);

    // Password strength breakdown
    const { data: pwRows } = await supabaseAdmin.from('passwords').select('strength, category, is_compromised').eq('user_id', userId);
    const strengthDist = { weak: 0, medium: 0, strong: 0, 'very-strong': 0 };
    const catDist = {};
    let compromised = 0;
    for (const p of pwRows || []) {
      if (strengthDist[p.strength] !== undefined) strengthDist[p.strength]++;
      catDist[p.category] = (catDist[p.category] || 0) + 1;
      if (p.is_compromised) compromised++;
    }

    // QR scan trends for the period
    const { data: scanRows } = await supabaseAdmin.from('qr_scan_history').select('scanned_at').eq('user_id', userId).gte('scanned_at', startDate);

    // Backup stats
    const { data: backupRows } = await supabaseAdmin.from('backups').select('backup_status, backup_size, completed_at').eq('user_id', userId).order('completed_at', { ascending: false });
    const lastBackup = (backupRows || []).find(b => b.backup_status === 'completed');
    const totalBackupSize = (backupRows || []).reduce((s, b) => s + (b.backup_size || 0), 0);

    // Document categories
    const { data: docRows } = await supabaseAdmin.from('secure_documents').select('category, file_size').eq('user_id', userId);
    const docCats = {};
    let totalDocSize = 0;
    for (const d of docRows || []) {
      docCats[d.category] = (docCats[d.category] || 0) + 1;
      totalDocSize += d.file_size || 0;
    }

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalPasswords: totalPasswords || 0,
          totalDocuments: totalDocuments || 0,
          totalQRCodes: totalQRCodes || 0,
          totalBackups: totalBackups || 0,
          securityScore: profile?.security_score || 50,
          subscriptionPlan: profile?.subscription_plan || 'free',
        },
        period: {
          label: period,
          start: startDate,
          newPasswords: recentPasswords || 0,
          newDocuments: recentDocuments || 0,
          newQRCodes: recentQRCodes || 0,
          newBackups: recentBackups || 0,
          qrScans: (scanRows || []).length,
        },
        security: {
          weakPasswords: weakPasswords || 0,
          expiredPasswords: expiredPasswords || 0,
          compromisedPasswords: compromised,
          strengthDistribution: strengthDist,
          categoryDistribution: Object.entries(catDist).map(([k, v]) => ({ category: k, count: v })),
        },
        storage: {
          totalDocumentSize: totalDocSize,
          totalBackupSize,
          lastBackupAt: lastBackup?.completed_at || null,
          documentCategories: Object.entries(docCats).map(([k, v]) => ({ category: k, count: v })),
        },
      },
    });
  } catch (error) {
    logger.error('Monitoring dashboard error:', error);
    res.status(500).json({ success: false, message: 'Error fetching monitoring data', error: error.message });
  }
});

// @route GET /api/monitoring/security
router.get('/security', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: pwRows } = await supabaseAdmin.from('passwords').select('strength, is_compromised, expires_at, category').eq('user_id', userId);
    const rows = pwRows || [];

    const strengthDist = rows.reduce((acc, p) => { acc[p.strength] = (acc[p.strength] || 0) + 1; return acc; }, {});
    const compromised = rows.filter(p => p.is_compromised).length;
    const expiring = rows.filter(p => p.expires_at && new Date(p.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length;

    const { data: recentLogins } = await supabaseAdmin.from('login_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);

    const { data: alerts } = await supabaseAdmin.from('alerts').select('severity, is_resolved').eq('user_id', userId).eq('is_resolved', false);
    const alertsBySeverity = (alerts || []).reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {});

    res.json({
      success: true,
      security: {
        passwordHealth: { total: rows.length, strengthDistribution: strengthDist, compromised, expiring },
        recentLogins: recentLogins || [],
        activeAlerts: alertsBySeverity,
        totalActiveAlerts: (alerts || []).length,
      },
    });
  } catch (error) {
    logger.error('Security monitoring error:', error);
    res.status(500).json({ success: false, message: 'Error fetching security data', error: error.message });
  }
});

// @route GET /api/monitoring/activity
router.get('/activity', async (req, res) => {
  try {
    const { period = 'week', limit = 20 } = req.query;
    const userId = req.user.userId;
    const startDate = getPeriodStart(period).toISOString();

    const [
      { data: recentPasswords },
      { data: recentDocs },
      { data: recentQR },
      { data: recentBackups },
      { data: recentSyncs },
    ] = await Promise.all([
      supabaseAdmin.from('passwords').select('id, title, created_at, updated_at').eq('user_id', userId).gte('created_at', startDate).order('updated_at', { ascending: false }).limit(5),
      supabaseAdmin.from('secure_documents').select('id, original_name, created_at, updated_at').eq('user_id', userId).gte('created_at', startDate).order('updated_at', { ascending: false }).limit(5),
      supabaseAdmin.from('qr_codes').select('id, title, created_at, scan_count').eq('user_id', userId).gte('created_at', startDate).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('backups').select('id, backup_type, backup_status, started_at').eq('user_id', userId).gte('started_at', startDate).order('started_at', { ascending: false }).limit(5),
      supabaseAdmin.from('sync_logs').select('id, sync_type, sync_status, started_at').eq('user_id', userId).gte('started_at', startDate).order('started_at', { ascending: false }).limit(5),
    ]);

    const activity = [
      ...(recentPasswords || []).map(p => ({ type: 'password', action: 'updated', title: p.title, id: p.id, at: p.updated_at })),
      ...(recentDocs || []).map(d => ({ type: 'document', action: 'uploaded', title: d.original_name, id: d.id, at: d.updated_at })),
      ...(recentQR || []).map(q => ({ type: 'qrcode', action: 'created', title: q.title, id: q.id, at: q.created_at })),
      ...(recentBackups || []).map(b => ({ type: 'backup', action: b.backup_status, title: `${b.backup_type} backup`, id: b.id, at: b.started_at })),
      ...(recentSyncs || []).map(s => ({ type: 'sync', action: s.sync_status, title: `${s.sync_type} sync`, id: s.id, at: s.started_at })),
    ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, parseInt(limit, 10));

    res.json({ success: true, activity });
  } catch (error) {
    logger.error('Activity monitoring error:', error);
    res.status(500).json({ success: false, message: 'Error fetching activity', error: error.message });
  }
});

// @route GET /api/monitoring/storage
router.get('/storage', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [{ data: docs }, { count: pwCount }, { count: qrCount }] = await Promise.all([
      supabaseAdmin.from('secure_documents').select('file_size, category, mime_type').eq('user_id', userId),
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const totalDocSize = (docs || []).reduce((s, d) => s + (d.file_size || 0), 0);
    const estimatedVaultSize = ((pwCount || 0) + (qrCount || 0)) * 2048;
    const usedBytes = totalDocSize + estimatedVaultSize;
    const totalBytes = 104857600; // 100MB

    const categoryBreakdown = (docs || []).reduce((acc, d) => {
      if (!acc[d.category]) acc[d.category] = { category: d.category, size: 0, count: 0 };
      acc[d.category].size += d.file_size || 0;
      acc[d.category].count++;
      return acc;
    }, {});

    res.json({
      success: true,
      storage: {
        used: usedBytes, total: totalBytes, available: totalBytes - usedBytes,
        usagePercent: parseFloat(((usedBytes / totalBytes) * 100).toFixed(2)),
        breakdown: { documents: totalDocSize, vault: estimatedVaultSize },
        categoryBreakdown: Object.values(categoryBreakdown),
      },
    });
  } catch (error) {
    logger.error('Storage monitoring error:', error);
    res.status(500).json({ success: false, message: 'Error fetching storage data', error: error.message });
  }
});

// @route GET /api/monitoring/health
router.get('/health', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [{ count: weakPw }, { count: comprPw }, { data: expBackup }, { count: unresolvedAlerts }] = await Promise.all([
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('strength', 'weak'),
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_compromised', true),
      supabaseAdmin.from('backups').select('completed_at').eq('user_id', userId).eq('backup_status', 'completed').order('completed_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('alerts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_resolved', false).eq('action_required', true),
    ]);

    const daysSinceBackup = expBackup?.completed_at
      ? Math.floor((Date.now() - new Date(expBackup.completed_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const issues = [];
    if ((weakPw || 0) > 0) issues.push({ severity: 'warning', message: `${weakPw} weak password${weakPw === 1 ? '' : 's'} detected` });
    if ((comprPw || 0) > 0) issues.push({ severity: 'critical', message: `${comprPw} compromised password${comprPw === 1 ? '' : 's'} detected` });
    if (daysSinceBackup === null || daysSinceBackup > 7) issues.push({ severity: 'warning', message: daysSinceBackup === null ? 'No backup found' : `Last backup was ${daysSinceBackup} days ago` });
    if ((unresolvedAlerts || 0) > 0) issues.push({ severity: 'warning', message: `${unresolvedAlerts} unresolved alert${unresolvedAlerts === 1 ? '' : 's'} require action` });

    const score = Math.max(0, 100 - (weakPw || 0) * 5 - (comprPw || 0) * 20 - (daysSinceBackup > 7 ? 10 : 0) - (unresolvedAlerts || 0) * 5);

    res.json({
      success: true,
      health: { score, status: score >= 80 ? 'good' : score >= 60 ? 'fair' : 'poor', issues, lastBackupDaysAgo: daysSinceBackup },
    });
  } catch (error) {
    logger.error('Health monitoring error:', error);
    res.status(500).json({ success: false, message: 'Error fetching health data', error: error.message });
  }
});

export default router;
