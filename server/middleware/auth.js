import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';

/**
 * Verifies the bearer token against Supabase Auth and attaches the user
 * (plus their profile row) to req.user. This replaces jwt.verify(token,
 * JWT_SECRET) — Supabase issues and rotates its own tokens, so there's no
 * JWT_SECRET to manage here anymore.
 *
 * Trade-off worth knowing: supabaseAdmin.auth.getUser(token) makes a network
 * call to Supabase per request, rather than verifying a signature locally.
 * It's the simplest correct option to start with. If auth checks become a
 * latency bottleneck later, Supabase also issues JWTs you can verify locally
 * with the project's JWT signing key — that's a drop-in optimization for
 * this same function, not a redesign.
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token not provided',
        code: 'NO_TOKEN',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_FORMAT',
      });
    }

    const token = authHeader.substring(7);

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
        code: 'INVALID_TOKEN',
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        success: false,
        message: 'User profile not found',
        code: 'PROFILE_NOT_FOUND',
      });
    }

    // Shape matches the old req.user.userId usage throughout the routes,
    // so most route bodies don't need to change at all.
    req.user = {
      userId: data.user.id,
      email: data.user.email,
      name: profile.name,
      profile,
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
};

// Optional authentication — doesn't reject the request if no/invalid token
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      req.user = null;
      return next();
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    req.user = profile
      ? { userId: data.user.id, email: data.user.email, name: profile.name, profile }
      : null;

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Admin role middleware — unchanged behavior, still env-driven
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim());

  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }

  next();
};

// Resource ownership is now enforced primarily by RLS (every table's
// policies check user_id = auth.uid()) — but since Express queries with the
// service-role key, RLS doesn't apply to those queries. This middleware is
// kept as a marker; the actual `.eq('user_id', req.user.userId)` filter in
// each route is what does the real work. Keep that filter on every query.
export const checkResourceOwnership = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }
    next();
  };
};

export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required',
      code: 'API_KEY_REQUIRED',
    });
  }

  const validApiKeys = (process.env.VALID_API_KEYS || '').split(',').map((k) => k.trim());

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      code: 'INVALID_API_KEY',
    });
  }

  next();
};

// Unchanged from before — pure in-memory rate limiting, nothing Supabase-specific
export const sensitiveOpLimit = (windowMs = 5 * 60 * 1000, max = 3) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.user ? req.user.userId : '');
    const now = Date.now();

    if (!attempts.has(key)) {
      attempts.set(key, []);
    }

    const userAttempts = attempts.get(key);
    const validAttempts = userAttempts.filter((time) => now - time < windowMs);

    if (validAttempts.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts for sensitive operation',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    validAttempts.push(now);
    attempts.set(key, validAttempts);

    next();
  };
};
