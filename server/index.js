require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const { initDb } = require('./db');
const { seedDatabase } = require('./seed');
const { startBackupSchedule } = require('./services/backup');

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

const app  = express();
const PORT = process.env.API_PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// Stripe webhooks need raw body — must come before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/auth',            authRouter);
app.use('/api/auth',            passwordResetRouter);   // forgot-password + reset-password
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
app.get('/api/health',          (_, res) => res.json({ status: 'ok', version: '3.0.0' }));

// ── Start ──────────────────────────────────────────────────────────────────────
const db = initDb();
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  seedDatabase(db);
  console.log('✅ Database seeded with Kenya / India / Canada / US data');
}

startBackupSchedule();

app.listen(PORT, () => {
  console.log(`🚚 FreightLink API  →  http://localhost:${PORT}`);
  console.log('   Demo logins:');
  console.log('   🇰🇪 admin@freightlink.co.ke  /  admin123');
  console.log('   🇮🇳 admin@freightlink.in     /  admin123');
  console.log('   🇨🇦 admin@freightlink.ca     /  admin123');
  console.log('   🇺🇸 admin@freightlink.us     /  admin123');
});
