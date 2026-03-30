/**
 * Stripe billing routes
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY       sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET   whsec_... (from Stripe dashboard → Webhooks)
 *   STRIPE_PRICE_STARTER    price_... (Starter plan price ID)
 *   STRIPE_PRICE_PRO        price_... (Professional plan price ID)
 *   APP_URL                 https://app.yourcompany.com
 */

const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { getDb } = require('../db');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

function getStripe() {
  if (!STRIPE_KEY) {
    throw new Error('STRIPE_SECRET_KEY not set in environment');
  }
  return require('stripe')(STRIPE_KEY);
}

const APP_URL = () => process.env.APP_URL || 'http://localhost:5173';

const PLANS = {
  starter:      { name: 'Starter',      price: process.env.STRIPE_PRICE_STARTER || null },
  professional: { name: 'Professional', price: process.env.STRIPE_PRICE_PRO     || null },
};

// GET /api/billing/status  — current subscription status
router.get('/status', requireAuth, (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(req.user.sub);
  if (!row) {
    // Check if still in trial (users created within 14 days are on trial)
    const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(req.user.sub);
    const trialEnd = user ? new Date(new Date(user.created_at).getTime() + 14 * 86400000) : null;
    const inTrial  = trialEnd && trialEnd > new Date();
    return res.json({
      plan:     'trial',
      status:   inTrial ? 'trialing' : 'expired',
      trialEnd: trialEnd?.toISOString() || null,
    });
  }
  res.json(row);
});

// POST /api/billing/checkout  — create Stripe checkout session
router.post('/checkout', requireAuth, requireRole('admin'), async (req, res) => {
  const { plan } = req.body || {};
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan. Use starter or professional.' });
  if (!PLANS[plan].price) return res.status(400).json({ error: `STRIPE_PRICE_${plan.toUpperCase()} not configured` });

  try {
    const stripe  = getStripe();
    const db      = getDb();
    const user    = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub);
    const session = await stripe.checkout.sessions.create({
      mode:               'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].price, quantity: 1 }],
      customer_email: user.email,
      metadata:       { user_id: req.user.sub, plan },
      success_url:    `${APP_URL()}/billing?success=1`,
      cancel_url:     `${APP_URL()}/billing?cancelled=1`,
      subscription_data: { trial_period_days: 14 },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/portal  — customer portal (manage/cancel subscription)
router.post('/portal', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const stripe  = getStripe();
    const db      = getDb();
    const row     = db.prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?').get(req.user.sub);
    if (!row?.stripe_customer_id) return res.status(400).json({ error: 'No active subscription found' });
    const session = await stripe.billingPortal.sessions.create({
      customer:   row.stripe_customer_id,
      return_url: `${APP_URL()}/billing`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/webhook  — Stripe webhook handler (raw body required)
router.post('/webhook', async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set — skipping webhook verification');
    return res.json({ received: true });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  const db = getDb();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { user_id, plan } = session.metadata || {};
    if (user_id) {
      db.prepare(`
        INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end)
        VALUES (?,?,?,?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET
          plan=excluded.plan, status=excluded.status,
          stripe_customer_id=excluded.stripe_customer_id,
          stripe_subscription_id=excluded.stripe_subscription_id,
          current_period_end=excluded.current_period_end
      `).run(user_id, plan || 'starter', 'active', session.customer, session.subscription,
          new Date(Date.now() + 30 * 86400000).toISOString());
      console.log(`✅ Subscription activated for user ${user_id} (${plan})`);
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const row = db.prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = ?').get(sub.id);
    if (row) {
      const status = sub.status === 'active' ? 'active' : sub.status === 'canceled' ? 'canceled' : sub.status;
      db.prepare('UPDATE subscriptions SET status = ?, current_period_end = ? WHERE stripe_subscription_id = ?')
        .run(status, new Date(sub.current_period_end * 1000).toISOString(), sub.id);
      console.log(`🔄 Subscription ${sub.id} → ${status}`);
    }
  }

  res.json({ received: true });
});

module.exports = router;
