import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

// @route GET /api/transactions
// Transactions live in profiles.billing (jsonb). They were stored as a
// sub-array on the Mongoose User model — here they're the same jsonb blob
// in the profiles table. No migration needed for the data shape; only the
// query changes.
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, startDate, endDate, sortBy = '-createdAt' } = req.query;
    const pg = parseInt(page, 10), lim = parseInt(limit, 10);

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('billing, subscription_plan, subscription_is_active')
      .eq('id', req.user.userId)
      .single();

    if (error || !profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    let transactions = profile.billing?.transactions || [];

    // Filters
    if (type) transactions = transactions.filter(t => t.type === type);
    if (status) transactions = transactions.filter(t => t.status === status);
    if (startDate) { const d = new Date(startDate); transactions = transactions.filter(t => new Date(t.createdAt) >= d); }
    if (endDate) { const d = new Date(endDate); transactions = transactions.filter(t => new Date(t.createdAt) <= d); }

    // Sort
    const field = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
    const asc = !sortBy.startsWith('-');
    transactions.sort((a, b) => {
      const valA = a[field], valB = b[field];
      if (typeof valA === 'string') return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return asc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    const total = transactions.length;
    const paginated = transactions.slice((pg - 1) * lim, pg * lim);

    const stats = transactions.reduce((acc, t) => {
      if (t.status === 'completed') acc.totalSpent += t.amount || 0;
      acc.byType[t.type] = (acc.byType[t.type] || 0) + 1;
      return acc;
    }, { totalSpent: 0, byType: {} });

    res.json({
      success: true,
      transactions: paginated,
      pagination: { current: pg, pages: Math.ceil(total / lim), total, limit: lim },
      stats,
      subscription: {
        plan: profile.subscription_plan,
        isActive: profile.subscription_is_active,
        paymentMethods: profile.billing?.paymentMethods || [],
      },
    });
  } catch (error) {
    logger.error('Transactions error:', error);
    res.status(500).json({ success: false, message: 'Error fetching transactions', error: error.message });
  }
});

// @route GET /api/transactions/summary
router.get('/summary', async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('billing, subscription_plan, subscription_is_active, subscription_start_date, subscription_end_date')
      .eq('id', req.user.userId)
      .single();

    if (error || !profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const txs = profile.billing?.transactions || [];
    const completed = txs.filter(t => t.status === 'completed');
    const totalSpent = completed.reduce((s, t) => s + (t.amount || 0), 0);
    const lastPayment = [...txs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

    res.json({
      success: true,
      summary: {
        totalTransactions: txs.length,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        currency: 'USD',
        lastPayment,
        subscription: {
          plan: profile.subscription_plan,
          isActive: profile.subscription_is_active,
          startDate: profile.subscription_start_date,
          endDate: profile.subscription_end_date,
        },
      },
    });
  } catch (error) {
    logger.error('Transaction summary error:', error);
    res.status(500).json({ success: false, message: 'Error fetching transaction summary', error: error.message });
  }
});

// @route GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles').select('billing').eq('id', req.user.userId).single();
    if (error || !profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const tx = (profile.billing?.transactions || []).find(t => t.id === req.params.id || t._id === req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    res.json({ success: true, transaction: tx });
  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({ success: false, message: 'Error fetching transaction', error: error.message });
  }
});

// @route GET /api/transactions/payment-methods
router.get('/payment-methods/list', async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles').select('billing').eq('id', req.user.userId).single();
    if (error || !profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    res.json({ success: true, paymentMethods: profile.billing?.paymentMethods || [] });
  } catch (error) {
    logger.error('Payment methods error:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment methods', error: error.message });
  }
});

// @route POST /api/transactions/payment-methods
router.post('/payment-methods', async (req, res) => {
  try {
    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('profiles').select('billing').eq('id', req.user.userId).single();
    if (fetchErr || !profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const methods = profile.billing?.paymentMethods || [];
    const newMethod = { id: `pm_${Date.now()}`, ...req.body, addedAt: new Date().toISOString() };
    methods.push(newMethod);

    const { error } = await supabaseAdmin.from('profiles').update({
      billing: { ...profile.billing, paymentMethods: methods },
    }).eq('id', req.user.userId);
    if (error) throw error;

    res.status(201).json({ success: true, message: 'Payment method added', paymentMethod: newMethod });
  } catch (error) {
    logger.error('Add payment method error:', error);
    res.status(500).json({ success: false, message: 'Error adding payment method', error: error.message });
  }
});

// @route DELETE /api/transactions/payment-methods/:methodId
router.delete('/payment-methods/:methodId', async (req, res) => {
  try {
    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('profiles').select('billing').eq('id', req.user.userId).single();
    if (fetchErr || !profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const methods = (profile.billing?.paymentMethods || []).filter(m => m.id !== req.params.methodId);
    const { error } = await supabaseAdmin.from('profiles').update({
      billing: { ...profile.billing, paymentMethods: methods },
    }).eq('id', req.user.userId);
    if (error) throw error;

    res.json({ success: true, message: 'Payment method removed' });
  } catch (error) {
    logger.error('Remove payment method error:', error);
    res.status(500).json({ success: false, message: 'Error removing payment method', error: error.message });
  }
});

export default router;
