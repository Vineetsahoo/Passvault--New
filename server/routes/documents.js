import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { uploadFile, downloadFile, deleteFile } from '../lib/supabaseStorage.js';
import { encrypt as envelopeEncrypt, decrypt as envelopeDecrypt } from '../lib/cryptoUtils.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB, matches the old documents.js limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt|zip|mp4|mp3|avi/;
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    if (allowedTypes.test(ext) && allowedTypes.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images, documents, and videos are allowed.'));
  },
});

// File-content encryption — unchanged from the original (AES-256-CBC, random
// key + IV per file). What changed: the per-file key used to be stored in
// plaintext in the database (`encryptionKey: encryptionKey`, no wrapping at
// all). Here it's wrapped with envelopeEncrypt() — the same AES-256-GCM
// function that protects vault passwords — before it's stored. A leaked
// Postgres row no longer hands over a decryptable key on its own; you'd also
// need the server's ENCRYPTION_KEY.
const FILE_ALGORITHM = 'aes-256-cbc';

const encryptFileBuffer = (buffer, keyHex) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(FILE_ALGORITHM, Buffer.from(keyHex, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { iv: iv.toString('hex'), encrypted };
};

const decryptFileBuffer = (encryptedBuffer, keyHex, ivHex) => {
  const decipher = crypto.createDecipheriv(FILE_ALGORITHM, Buffer.from(keyHex, 'hex'), Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

// @route   POST /api/documents/upload
// @desc    Upload and encrypt a document
// @access  Private
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { category, tags, description, expiresIn } = req.body;
    const userId = req.user.userId;

    const fileKey = crypto.randomBytes(32).toString('hex');
    const { iv, encrypted } = encryptFileBuffer(req.file.buffer, fileKey);
    const wrappedKey = envelopeEncrypt(fileKey, userId);

    const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    const fileExt = (req.file.originalname.split('.').pop() || '').toLowerCase();
    const storagePath = `${userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.enc`;

    await uploadFile('documents', storagePath, encrypted, 'application/octet-stream');

    let expiresAt = null;
    if (expiresIn) {
      const days = parseInt(expiresIn, 10);
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiresAt = d.toISOString();
    }

    const { data: document, error } = await supabaseAdmin
      .from('secure_documents')
      .insert({
        user_id: userId,
        file_name: storagePath.split('/').pop(),
        original_name: req.file.originalname,
        file_size: req.file.size,
        file_type: fileExt,
        mime_type: req.file.mimetype,
        storage_path: storagePath,
        encryption_key: wrappedKey,
        encryption_type: 'AES-256',
        category: category || 'document',
        tags: tags ? JSON.parse(tags) : [],
        description: description || '',
        expires_at: expiresAt,
        metadata: { checksum, iv },
      })
      .select()
      .single();

    if (error) throw error;

    logger.info(`Document uploaded successfully by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Document uploaded and encrypted successfully',
      document: {
        id: document.id,
        fileName: document.original_name,
        fileSize: document.file_size,
        fileType: document.file_type,
        category: document.category,
        tags: document.tags,
        uploadedAt: document.created_at,
        expiresAt: document.expires_at,
      },
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
  }
});

// @route   GET /api/documents
// @desc    Get all documents for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    let q = supabaseAdmin
      .from('secure_documents')
      .select(
        'id, file_name, original_name, file_size, file_type, mime_type, category, tags, description, ' +
          'is_archived, is_favorite, expires_at, download_count, last_accessed_at, created_at, updated_at',
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    if (category && category !== 'all') {
      q = q.eq('category', category);
    }

    if (search) {
      q = q.or(`original_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: documents, count, error } = await q;
    if (error) throw error;

    // Stats computed in JS rather than a Postgres aggregate — simpler to
    // reason about and fast enough at the scale a personal vault operates
    // at. If this ever needs to scale to very large per-user document
    // counts, move this into a Postgres function (RPC) instead.
    const { data: allForStats } = await supabaseAdmin
      .from('secure_documents')
      .select('file_size, category')
      .eq('user_id', userId)
      .eq('is_archived', false);

    const stats = (allForStats || []).reduce(
      (acc, d) => {
        acc.totalSize += d.file_size || 0;
        acc.totalCount += 1;
        acc.categories.push(d.category);
        return acc;
      },
      { totalSize: 0, totalCount: 0, categories: [] },
    );

    res.json({
      success: true,
      documents,
      pagination: {
        current: pageNum,
        pages: Math.ceil((count || 0) / limitNum),
        total: count || 0,
      },
      stats,
    });
  } catch (error) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Error fetching documents', error: error.message });
  }
});

// @route   GET /api/documents/:id/download
// @desc    Download and decrypt a document
// @access  Private
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: document, error } = await supabaseAdmin
      .from('secure_documents')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (document.expires_at && new Date(document.expires_at) < new Date()) {
      return res.status(403).json({ success: false, message: 'Document has expired' });
    }

    const encryptedBuffer = await downloadFile('documents', document.storage_path);
    const fileKey = envelopeDecrypt(document.encryption_key, userId);
    const decryptedBuffer = decryptFileBuffer(encryptedBuffer, fileKey, document.metadata.iv);

    await supabaseAdmin
      .from('secure_documents')
      .update({
        download_count: document.download_count + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', document.id);

    res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Length', decryptedBuffer.length);
    res.send(decryptedBuffer);
  } catch (error) {
    logger.error('Error downloading document:', error);
    res.status(500).json({ success: false, message: 'Error downloading document', error: error.message });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: document, error } = await supabaseAdmin
      .from('secure_documents')
      .select('id, storage_path')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    try {
      await deleteFile('documents', document.storage_path);
    } catch (err) {
      logger.warn('File already deleted from storage:', err.message);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('secure_documents')
      .delete()
      .eq('id', document.id);

    if (deleteError) throw deleteError;

    logger.info(`Document deleted: ${document.id}`);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Error deleting document', error: error.message });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update document metadata
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { category, tags, description, isFavorite } = req.body;
    const userId = req.user.userId;

    const updates = {};
    if (category) updates.category = category;
    if (tags) updates.tags = tags;
    if (description !== undefined) updates.description = description;
    if (isFavorite !== undefined) updates.is_favorite = isFavorite;

    const { data: document, error } = await supabaseAdmin
      .from('secure_documents')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.json({ success: true, message: 'Document updated successfully', document });
  } catch (error) {
    logger.error('Error updating document:', error);
    res.status(500).json({ success: false, message: 'Error updating document', error: error.message });
  }
});

// @route   GET /api/documents/stats/overview
// @desc    Get storage statistics
// @access  Private
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: rows, error } = await supabaseAdmin
      .from('secure_documents')
      .select('original_name, file_size, category, download_count, created_at, expires_at')
      .eq('user_id', userId);

    if (error) throw error;

    const totalStats = (rows || []).reduce(
      (acc, d) => {
        acc.totalSize += d.file_size || 0;
        acc.totalDocuments += 1;
        acc.totalDownloads += d.download_count || 0;
        return acc;
      },
      { totalSize: 0, totalDocuments: 0, totalDownloads: 0 },
    );

    const categoryMap = {};
    for (const d of rows || []) {
      if (!categoryMap[d.category]) categoryMap[d.category] = { count: 0, size: 0 };
      categoryMap[d.category].count += 1;
      categoryMap[d.category].size += d.file_size || 0;
    }
    const categoryStats = Object.entries(categoryMap).map(([category, v]) => ({ _id: category, ...v }));

    const recentUploads = [...(rows || [])]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((d) => ({ originalName: d.original_name, fileSize: d.file_size, category: d.category, createdAt: d.created_at }));

    const now = new Date();
    const expiringDocuments = (rows || [])
      .filter((d) => d.expires_at && new Date(d.expires_at) > now)
      .sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at))
      .slice(0, 5)
      .map((d) => ({ originalName: d.original_name, expiresAt: d.expires_at }));

    res.json({
      success: true,
      stats: { totalStats: [totalStats], categoryStats, recentUploads, expiringDocuments },
    });
  } catch (error) {
    logger.error('Error fetching storage stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
  }
});

export default router;
