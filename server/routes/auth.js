import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

/**
 * Almost everything that used to live here — /register, /login, /refresh,
 * /logout, /logout-all, /verify-token — is gone. Supabase Auth owns that
 * lifecycle now: the client calls supabase.auth.signUp() /
 * signInWithPassword() / signOut() directly (see SignIn.tsx, SignUp.tsx,
 * supabaseClient.ts), Supabase issues and refreshes the JWTs, and
 * middleware/auth.js verifies them on every request to this server.
 *
 * (Checked: none of those removed routes were actually called from the
 * client outside of a dead `authAPI` wrapper in api.ts — safe to delete
 * rather than port.)
 *
 * /me is kept because authenticateToken already does the work of resolving
 * the token to a user + profile — this just exposes that as an endpoint for
 * anything that wants a server-side "who is this" check.
 */

const router = express.Router();

// @route   GET /api/auth/me
// @desc    Get the current authenticated user + profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { profile } = req.user;

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user: {
          id: req.user.userId,
          name: profile.name,
          email: req.user.email,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          securityScore: profile.security_score,
          subscriptionPlan: profile.subscription_plan,
          securitySettings: profile.security_settings,
          createdAt: profile.created_at,
        },
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve user information' });
  }
});

export default router;
