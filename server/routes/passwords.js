import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { encrypt, decrypt, calculatePasswordStrength } from '../lib/cryptoUtils.js';
import { logger } from '../utils/logger.js';

/**
 * This file is the template for migrating the rest of the route files
 * (devices.js, alerts.js, qrcodes.js, sync.js, backups.js, sharing.js, ...).
 * The pattern repeats everywhere:
 *   1. Mongoose `Model.find({ userId, ... })`  ->  `.from('table').select().eq('user_id', userId)`
 *   2. Mongoose document methods (instance methods that mutate + .save())
 *      -> a plain function + a Postgres `.update()` call
 *   3. Mongoose statics (aggregate, custom finders) -> either a Postgres
 *      query with .order()/.range()/.or(), or — for anything genuinely
 *      relational/aggregate-heavy — a small Postgres function called via
 *      `.rpc()`. Nothing here needed an RPC; sharing.js and monitoring.js
 *      probably will.
 *   4. Every query carries `.eq('user_id', req.user.userId)` explicitly —
 *      this client uses the service-role key, so RLS does not filter rows
 *      for you. The filter you write here IS the authorization check.
 */

const router = express.Router();

router.use(authenticateToken);

const VALID_CATEGORIES = ['social', 'email', 'finance', 'work', 'personal', 'shopping', 'entertainment', 'other'];

const validatePassword = [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
  body('website').optional().isLength({ max: 200 }).withMessage('Website URL cannot exceed 200 characters'),
  body('username').optional().isLength({ max: 100 }).withMessage('Username cannot exceed 100 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email address'),
  body('category').optional().isIn(VALID_CATEGORIES).withMessage('Invalid category'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().isLength({ max: 30 }).withMessage('Each tag cannot exceed 30 characters'),
];

// Strips encrypted_password before sending a row back to the client —
// equivalent to the old toJSON transform that deleted encryptedPassword.
const toPublicPassword = (row) => {
  if (!row) return row;
  const { encrypted_password, ...rest } = row;
  return rest;
};

// @route   GET /api/passwords
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isIn(VALID_CATEGORIES),
    query('search').optional().isLength({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['title', 'created_at', 'last_used', 'website']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const userId = req.user.userId;
      const {
        page = 1,
        limit = 20,
        category,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
        favorites = false,
      } = req.query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      let q = supabaseAdmin
        .from('passwords')
        .select('id, title, website, username, email, notes, category, tags, is_favorite, strength, ' +
          'last_used, expires_at, is_compromised, compromised_at, metadata, created_at, updated_at', { count: 'exact' })
        .eq('user_id', userId);

      if (category) q = q.eq('category', category);
      if (favorites === 'true') q = q.eq('is_favorite', true);

      if (search) {
        q = q.or(
          `title.ilike.%${search}%,website.ilike.%${search}%,username.ilike.%${search}%,` +
            `email.ilike.%${search}%,notes.ilike.%${search}%`,
        );
        // Note: this doesn't search inside the tags array — Postgres needs
        // `.contains()` (exact element match) or a trigram index for
        // partial tag search, neither of which is a drop-in equivalent of
        // Mongo's $in: [regex]. Fine to leave for now; revisit if tag
        // search turns out to matter.
      }

      q = q
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

      const { data: passwords, count, error } = await q;
      if (error) throw error;

      res.json({
        success: true,
        message: 'Passwords retrieved successfully',
        data: {
          passwords,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil((count || 0) / limitNum),
            totalItems: count || 0,
            itemsPerPage: limitNum,
          },
        },
      });
    } catch (error) {
      logger.error('Get passwords error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve passwords' });
    }
  },
);

// @route   GET /api/passwords/categories/stats
// (kept above '/:id' so Express doesn't treat "categories" as an :id param)
router.get('/categories/stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: rows, error } = await supabaseAdmin
      .from('passwords')
      .select('category, strength, is_compromised, is_favorite')
      .eq('user_id', userId);

    if (error) throw error;

    const byCategory = {};
    const overall = { total: 0, favorites: 0, weak: 0, medium: 0, strong: 0, veryStrong: 0, compromised: 0 };

    for (const p of rows || []) {
      if (!byCategory[p.category]) {
        byCategory[p.category] = { category: p.category, count: 0, weakCount: 0, compromisedCount: 0 };
      }
      byCategory[p.category].count += 1;
      if (p.strength === 'weak') byCategory[p.category].weakCount += 1;
      if (p.is_compromised) byCategory[p.category].compromisedCount += 1;

      overall.total += 1;
      if (p.is_favorite) overall.favorites += 1;
      if (p.is_compromised) overall.compromised += 1;
      if (p.strength === 'weak') overall.weak += 1;
      if (p.strength === 'medium') overall.medium += 1;
      if (p.strength === 'strong') overall.strong += 1;
      if (p.strength === 'very-strong') overall.veryStrong += 1;
    }

    res.json({
      success: true,
      message: 'Password statistics retrieved successfully',
      data: { byCategory: Object.values(byCategory).sort((a, b) => b.count - a.count), overall },
    });
  } catch (error) {
    logger.error('Get password stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve password statistics' });
  }
});

// @route   GET /api/passwords/expiring/soon
router.get('/expiring/soon', [query('days').optional().isInt({ min: 1, max: 365 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user.userId;
    const days = parseInt(req.query.days, 10) || 30;
    const future = new Date();
    future.setDate(future.getDate() + days);

    const { data: passwords, error } = await supabaseAdmin
      .from('passwords')
      .select('id, title, website, category, expires_at')
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .lte('expires_at', future.toISOString())
      .order('expires_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, message: 'Expiring passwords retrieved successfully', data: { passwords, expiringIn: days } });
  } catch (error) {
    logger.error('Get expiring passwords error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve expiring passwords' });
  }
});

// @route   GET /api/passwords/:id
// @desc    Get single password (with decrypted password)
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: password, error } = await supabaseAdmin
      .from('passwords')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !password) {
      return res.status(404).json({ success: false, message: 'Password not found' });
    }

    const decryptedPassword = decrypt(password.encrypted_password, userId);

    await supabaseAdmin
      .from('passwords')
      .update({ last_used: new Date().toISOString() })
      .eq('id', password.id);

    res.json({
      success: true,
      message: 'Password retrieved successfully',
      data: { password: { ...toPublicPassword(password), password: decryptedPassword } },
    });
  } catch (error) {
    logger.error('Get password error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve password' });
  }
});

// @route   POST /api/passwords
router.post('/', validatePassword, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user.userId;
    const {
      title,
      password,
      website,
      username,
      email,
      category = 'other',
      notes = '',
      tags = [],
      isFavorite = false,
      expiresAt,
    } = req.body;

    const encryptedPassword = encrypt(password, userId);
    const strength = calculatePasswordStrength(password);

    const { data: newPassword, error } = await supabaseAdmin
      .from('passwords')
      .insert({
        user_id: userId,
        title: title.trim(),
        website: website?.trim(),
        username: username?.trim(),
        email: email?.toLowerCase().trim(),
        notes: notes.trim(),
        category,
        tags: tags.map((t) => t.trim()).filter((t) => t.length > 0),
        is_favorite: isFavorite,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        encrypted_password: encryptedPassword,
        strength,
        metadata: { createdFrom: 'web', lastModifiedFrom: 'web', version: 1 },
      })
      .select()
      .single();

    if (error) throw error;

    logger.info(`New password created for user: ${userId}`);

    res.status(201).json({ success: true, message: 'Password created successfully', data: { password: toPublicPassword(newPassword) } });
  } catch (error) {
    logger.error('Create password error:', error);
    res.status(500).json({ success: false, message: 'Failed to create password' });
  }
});

// @route   PUT /api/passwords/:id
router.put('/:id', validatePassword, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user.userId;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('passwords')
      .select('metadata')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ success: false, message: 'Password not found' });
    }

    const { title, password: newPlainPassword, website, username, email, category, notes, tags, isFavorite, expiresAt } = req.body;

    const updates = {
      title: title.trim(),
      website: website?.trim(),
      username: username?.trim(),
      email: email?.toLowerCase().trim(),
      notes: notes?.trim() || '',
      category,
      tags: tags ? tags.map((t) => t.trim()).filter((t) => t.length > 0) : undefined,
      is_favorite: isFavorite,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      metadata: { ...existing.metadata, lastModifiedFrom: 'web', version: (existing.metadata?.version || 1) + 1 },
    };

    if (newPlainPassword) {
      updates.encrypted_password = encrypt(newPlainPassword, userId);
      updates.strength = calculatePasswordStrength(newPlainPassword);
    }

    // Remove undefined keys so we don't overwrite columns the caller didn't send
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const { data: updated, error } = await supabaseAdmin
      .from('passwords')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Password updated for user: ${userId}`);

    res.json({ success: true, message: 'Password updated successfully', data: { password: toPublicPassword(updated) } });
  } catch (error) {
    logger.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
});

// @route   DELETE /api/passwords/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: deleted, error } = await supabaseAdmin
      .from('passwords')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !deleted) {
      return res.status(404).json({ success: false, message: 'Password not found' });
    }

    logger.info(`Password deleted for user: ${userId}`);
    res.json({ success: true, message: 'Password deleted successfully' });
  } catch (error) {
    logger.error('Delete password error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete password' });
  }
});

// @route   POST /api/passwords/:id/favorite
router.post('/:id/favorite', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('passwords')
      .select('is_favorite')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ success: false, message: 'Password not found' });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('passwords')
      .update({ is_favorite: !existing.is_favorite })
      .eq('id', req.params.id)
      .select('is_favorite')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Password ${updated.is_favorite ? 'added to' : 'removed from'} favorites`,
      data: { isFavorite: updated.is_favorite },
    });
  } catch (error) {
    logger.error('Toggle favorite error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle favorite status' });
  }
});

// @route   POST /api/passwords/:id/compromised
router.post('/:id/compromised', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: updated, error } = await supabaseAdmin
      .from('passwords')
      .update({ is_compromised: true, compromised_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select('is_compromised, compromised_at')
      .single();

    if (error || !updated) {
      return res.status(404).json({ success: false, message: 'Password not found' });
    }

    res.json({
      success: true,
      message: 'Password marked as compromised',
      data: { isCompromised: updated.is_compromised, compromisedAt: updated.compromised_at },
    });
  } catch (error) {
    logger.error('Mark compromised error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark password as compromised' });
  }
});

// @route   POST /api/passwords/:id/request-access
// @desc    Request a verification code to view a password
router.post('/:id/request-access', async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: password, error: pwError } = await supabaseAdmin
      .from('passwords')
      .select('id, title')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (pwError || !password) {
      return res.status(404).json({ success: false, message: 'Password not found' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('profiles')
      .update({ access_verification_code: code, access_verification_expires: expires })
      .eq('id', userId);

    // `notifications` is its own table now (was profile.notifications[])
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title: 'Password Access Request',
      message: `A verification code was requested to access password "${password.title}". Please check your secure terminal/device. Valid for 5 minutes.`,
      type: 'security',
      category: 'security',
      priority: 'high',
    });

    console.log('\n======================================================');
    console.log(`🔒 SECURITY VERIFICATION CODE FOR: ${password.title}`);
    console.log(`🔑 CODE: ${code}`);
    console.log('======================================================\n');

    logger.info(`Access code generated for user: ${userId}`);
    res.json({ success: true, message: 'Verification code sent to your devices and notifications' });
  } catch (error) {
    logger.error('Request access error:', error);
    res.status(500).json({ success: false, message: 'Failed to request access' });
  }
});

// @route   POST /api/passwords/:id/verify-access
router.post('/:id/verify-access', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const userId = req.user.userId;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('access_verification_code, access_verification_expires')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.access_verification_code || profile.access_verification_code !== code) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }

    if (new Date(profile.access_verification_expires) < new Date()) {
      return res.status(401).json({ success: false, message: 'Verification code has expired' });
    }

    await supabaseAdmin
      .from('profiles')
      .update({ access_verification_code: null, access_verification_expires: null })
      .eq('id', userId);

    const { data: password, error: pwError } = await supabaseAdmin
      .from('passwords')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (pwError || !password) {
      return res.status(404).json({ success: false, message: 'Password not found' });
    }

    const decryptedPassword = decrypt(password.encrypted_password, userId);

    await supabaseAdmin.from('passwords').update({ last_used: new Date().toISOString() }).eq('id', password.id);

    res.json({
      success: true,
      message: 'Access granted',
      data: { password: { ...toPublicPassword(password), password: decryptedPassword } },
    });
  } catch (error) {
    logger.error('Verify access error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify access' });
  }
});

export default router;
