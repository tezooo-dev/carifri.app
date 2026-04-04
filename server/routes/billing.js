/**
 * Stripe billing routes
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY          sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET      whsec_...
 *   STRIPE_PRICE_STARTER       price_...
 *   STRIPE_PRICE_PRO           price_...
 *   APP_URL                    https://app.example.com
 *
 * Subscriptions are keyed by company_id (not user_id).
 * Trial eligibility is derived from companies.created_at.
 */

const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { one, run } = require('../lib/db');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
function getStripe() {
  if (!STRIPE_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return require('stripe')(STRIPE_KEY);
}

const APP_URL = () => process.env.APP_URL || 'http://localhost:5173';

const PLANS = {
  starter: { name: 'Starter', price: process.env.STRIPE_PRICE_STARTER || null },
  professional: { name: 'Professional', price: process.env.STRIPE_PRICE_PRO || null },
};

// ---------------------------------------------------------------------------
// GET /status  — current subscription / trial status for the caller's company
// ---------------------------------------------------------------------------
router.get('/status', requireAuth, async (req, res) => {
  try {
    const cid = req.user.companyId;

    const row = await one(
      'SELECT * FROM subscriptions WHERE company_id = $1',
      [cid]
    );

    if (!row) {
      const company = await one(
        'SELECT created_at FROM companies WHERE id = $1',
        [cid]
      );
      const trialEnd = company
        ? new Date(new Date(company.created_at).getTime() + 14 * 86_400_000)
        : null;
      const inTrial = trialEnd && trialEnd > new Date();
      return res.json({
        plan: 'trial',
        status: inTrial ? 'trialing' : 'expired',
        trialEnd: trialEnd?.toISOString() || null,
      });
    }

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /checkout  — create a Stripe Checkout session
// ---------------------------------------------------------------------------
router.post('/checkout', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { plan } = req.body || {};
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
    if (!PLANS[plan].price) {
      return res.status(400).json({
        error: `STRIPE_PRICE_${plan.toUpperCase()} not configured`,
      });
    }

    const stripe = getStripe();
    const user = await one('SELECT * FROM users WHERE id = $1', [req.user.sub]);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].price, quantity: 1 }],
      customer_email: user.email,
      metadata: { company_id: req.user.companyId, plan },
      success_url: `${APP_URL()}/billing?success=1`,
      cancel_url: `${APP_URL()}/billing?cancelled=1`,
      subscription_data: { trial_period_days: 14 },
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /portal  — create a Stripe Customer Portal session
// ---------------------------------------------------------------------------
router.post('/portal', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const stripe = getStripe();
    const row = await one(
      'SELECT stripe_customer_id FROM subscriptions WHERE company_id = $1',
      [req.user.companyId]
    );
    if (!row?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${APP_URL()}/billing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /webhook  — Stripe webhook handler (raw body required)
// ---------------------------------------------------------------------------
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) return res.json({ received: true });

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    // -----------------------------------------------------------------------
    // checkout.session.completed — new subscription created
    // -----------------------------------------------------------------------
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { company_id, plan } = session.metadata || {};

      if (company_id) {
        await run(
          `INSERT INTO subscriptions
             (company_id, plan, status, stripe_customer_id, stripe_subscription_id,
              current_period_end)
           VALUES ($1, $2, 'active', $3, $4, $5)
           ON CONFLICT (company_id) DO UPDATE
             SET plan                  = EXCLUDED.plan,
                 status                = EXCLUDED.status,
                 stripe_customer_id    = EXCLUDED.stripe_customer_id,
                 stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                 current_period_end    = EXCLUDED.current_period_end`,
          [
            company_id,
            plan || 'starter',
            session.customer,
            session.subscription,
            new Date(Date.now() + 30 * 86_400_000),
          ]
        );
      }
    }

    // -----------------------------------------------------------------------
    // customer.subscription.updated / deleted
    // -----------------------------------------------------------------------
    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object;
      const normalizedStatus =
        sub.status === 'active'
          ? 'active'
          : sub.status === 'canceled'
          ? 'canceled'
          : sub.status;

      await run(
        `UPDATE subscriptions
            SET status = $1, current_period_end = $2
          WHERE stripe_subscription_id = $3`,
        [normalizedStatus, new Date(sub.current_period_end * 1000), sub.id]
      );
    }
  } catch (err) {
    // Log but still return 200 so Stripe doesn't retry indefinitely
    console.error('Webhook processing error:', err.message);
  }

  res.json({ received: true });
});

module.exports = router;
