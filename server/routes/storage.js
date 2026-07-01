import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const router = express.Router();

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// @route GET /api/storage/metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [{ count: pwCount }, { count: qrCount }, { count: docCount }] = await Promise.all([
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('secure_documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const totalItems = (pwCount || 0) + (qrCount || 0) + (docCount || 0);
    const usedStorageBytes = totalItems * 2048;
    const totalStorageBytes = 104857600; // 100MB
    const availableStorageBytes = totalStorageBytes - usedStorageBytes;

    const { data: lastBackup } = await supabaseAdmin
      .from('backups').select('completed_at').eq('user_id', userId).eq('backup_status', 'completed')
      .order('completed_at', { ascending: false }).limit(1).single();

    res.json({
      success: true,
      metrics: {
        totalStorage: formatBytes(totalStorageBytes), totalStorageBytes,
        usedStorage: formatBytes(usedStorageBytes), usedStorageBytes,
        availableStorage: formatBytes(availableStorageBytes), availableStorageBytes,
        encryptedFiles: totalItems,
        lastBackup: lastBackup?.completed_at || null,
        usagePercentage: parseFloat(((usedStorageBytes / totalStorageBytes) * 100).toFixed(2)),
      },
    });
  } catch (error) {
    logger.error('Storage metrics error:', error);
    res.status(500).json({ success: false, message: 'Error fetching storage metrics', error: error.message });
  }
});

// @route GET /api/storage/security-status
router.get('/security-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      { count: totalPasswords },
      { count: weakPasswords },
      { count: compromisedPasswords },
      { count: expiredPasswords },
      { count: encryptedDocs },
    ] = await Promise.all([
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('strength', 'weak'),
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_compromised', true),
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId).lte('expires_at', new Date().toISOString()),
      supabaseAdmin.from('secure_documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const securePasswords = (totalPasswords || 0) - (weakPasswords || 0) - (compromisedPasswords || 0);
    const score = totalPasswords
      ? Math.round((securePasswords / totalPasswords) * 100)
      : 100;

    res.json({
      success: true,
      securityStatus: {
        overallScore: score,
        passwords: { total: totalPasswords || 0, weak: weakPasswords || 0, compromised: compromisedPasswords || 0, expired: expiredPasswords || 0, secure: securePasswords },
        documents: { total: encryptedDocs || 0, encrypted: encryptedDocs || 0 },
        encryption: { algorithm: 'AES-256-GCM', keySize: 256, status: 'active' },
      },
    });
  } catch (error) {
    logger.error('Security status error:', error);
    res.status(500).json({ success: false, message: 'Error fetching security status', error: error.message });
  }
});

// @route GET /api/storage/encryption-keys
router.get('/encryption-keys', authenticateToken, async (req, res) => {
  try {
    // Key metadata only — actual keys are never returned. Kept as a stub
    // for the UI panel that shows "your vault is encrypted".
    res.json({
      success: true,
      encryptionInfo: {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2-SHA512 (100k iterations)',
        status: 'active',
        note: 'Actual encryption keys are never exposed via the API.',
      },
    });
  } catch (error) {
    logger.error('Encryption keys error:', error);
    res.status(500).json({ success: false, message: 'Error fetching encryption info', error: error.message });
  }
});

// @route POST /api/storage/generate-key
router.post('/generate-key', authenticateToken, async (req, res) => {
  try {
    const { keyType = 'aes-256', purpose } = req.body;
    let key;
    if (keyType === 'aes-256') key = crypto.randomBytes(32).toString('hex');
    else if (keyType === 'aes-128') key = crypto.randomBytes(16).toString('hex');
    else return res.status(400).json({ success: false, message: 'Invalid key type' });

    res.json({ success: true, key, keyType, purpose: purpose || 'general', generatedAt: new Date().toISOString(), note: 'Store this key securely. It will not be saved by PassVault.' });
  } catch (error) {
    logger.error('Generate key error:', error);
    res.status(500).json({ success: false, message: 'Error generating key', error: error.message });
  }
});

// @route GET /api/storage/categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [{ data: passwords }, { data: documents }, { data: qrcodes }] = await Promise.all([
      supabaseAdmin.from('passwords').select('category').eq('user_id', userId),
      supabaseAdmin.from('secure_documents').select('category').eq('user_id', userId),
      supabaseAdmin.from('qr_codes').select('category').eq('user_id', userId),
    ]);

    const tally = (rows, prefix) => (rows || []).reduce((acc, r) => {
      const key = `${prefix}:${r.category}`;
      if (!acc[key]) acc[key] = { type: prefix, category: r.category, count: 0 };
      acc[key].count++;
      return acc;
    }, {});

    const all = { ...tally(passwords, 'password'), ...tally(documents, 'document'), ...tally(qrcodes, 'qrcode') };

    res.json({ success: true, categories: Object.values(all) });
  } catch (error) {
    logger.error('Storage categories error:', error);
    res.status(500).json({ success: false, message: 'Error fetching categories', error: error.message });
  }
});

// @route GET /api/storage/overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [{ count: pwCount }, { count: docCount }, { count: qrCount }, { count: devCount }, { count: backupCount }] = await Promise.all([
      supabaseAdmin.from('passwords').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('secure_documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('devices').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('backups').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('backup_status', 'completed'),
    ]);

    res.json({
      success: true,
      overview: {
        passwords: pwCount || 0,
        documents: docCount || 0,
        qrCodes: qrCount || 0,
        devices: devCount || 0,
        backups: backupCount || 0,
        totalItems: (pwCount || 0) + (docCount || 0) + (qrCount || 0),
      },
    });
  } catch (error) {
    logger.error('Storage overview error:', error);
    res.status(500).json({ success: false, message: 'Error fetching overview', error: error.message });
  }
});

export default router;
