require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const { testConnection, one } = require('./lib/db');
const { seedDatabase }        = require('./seed');

const authRouter           = require('./routes/auth');
const passwordResetRouter  = require('./routes/password-reset');
const loadsRouter          = require('./routes/loads');
const carriersRouter       = require('./routes/carriers');
const carrierDetailsRouter = require('./routes/carrier-details');
const shippersRouter       = require('./routes/shippers');
const settingsRouter       = require('./routes/settings');
const marketsRouter        = require('./routes/markets');
const bidsRouter           = require('./routes/bids');
const usersRouter          = require('./routes/users');
const analyticsRouter      = require('./routes/analytics');
const billingRouter        = require('./routes/billing');
const ticketsRouter        = require('./routes/tickets');
const rolesRouter          = require('./routes/roles');
const carrierPortalRouter  = require('./routes/carrier-portal');
const companiesRouter      = require('./routes/companies');

const app  = express();
const PORT = process.env.API_PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// Stripe webhooks need raw body — must come before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/auth',            authRouter);
app.use('/api/auth',            passwordResetRouter);
app.use('/api/loads',           loadsRouter);
app.use('/api/carriers',        carriersRouter);
app.use('/api/carrier-details', carrierDetailsRouter);
app.use('/api/shippers',        shippersRouter);
app.use('/api/settings',        settingsRouter);
app.use('/api/markets',         marketsRouter);
app.use('/api/bids',            bidsRouter);
app.use('/api/users',           usersRouter);
app.use('/api/analytics',       analyticsRouter);
app.use('/api/billing',         billingRouter);
app.use('/api/tickets',         ticketsRouter);
app.use('/api/roles',           rolesRouter);
app.use('/api/carrier-portal',  carrierPortalRouter);
app.use('/api/companies',       companiesRouter);
app.get('/api/health',          (_, res) => res.json({ status: 'ok', version: '4.0.0', db: 'supabase' }));

// ── Start ──────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await testConnection();

    // Seed if no companies exist yet
    const existing = await one('SELECT COUNT(*) as c FROM companies');
    if (parseInt(existing.c) === 0) {
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`🚚 FreightLink API  →  http://localhost:${PORT}`);
      console.log('   Demo logins:');
      console.log('   🔐 it@freightlink.io          /  super123   (super_admin)');
      console.log('   🇰🇪 admin@freightlink.co.ke   /  admin123');
      console.log('   🇮🇳 admin@freightlink.in      /  admin123');
      console.log('   🇨🇦 admin@freightlink.ca      /  admin123');
      console.log('   🇺🇸 admin@freightlink.us      /  admin123');
    });
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  }
}

start();
