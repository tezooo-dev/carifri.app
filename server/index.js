require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const { initDb } = require('./db');
const { seedDatabase } = require('./seed');

const authRouter           = require('./routes/auth');
const loadsRouter          = require('./routes/loads');
const carriersRouter       = require('./routes/carriers');
const carrierDetailsRouter = require('./routes/carrier-details');
const shippersRouter       = require('./routes/shippers');
const settingsRouter       = require('./routes/settings');
const marketsRouter        = require('./routes/markets');
const bidsRouter           = require('./routes/bids');

const app  = express();
const PORT = process.env.API_PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',            authRouter);
app.use('/api/loads',           loadsRouter);
app.use('/api/carriers',        carriersRouter);
app.use('/api/carrier-details', carrierDetailsRouter);
app.use('/api/shippers',        shippersRouter);
app.use('/api/settings',        settingsRouter);
app.use('/api/markets',         marketsRouter);
app.use('/api/bids',            bidsRouter);
app.get('/api/health',          (_, res) => res.json({ status: 'ok', version: '2.0.0' }));

// ── Start ──────────────────────────────────────────────────────────────────────
const db = initDb();
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  seedDatabase(db);
  console.log('✅ Database seeded with Kenya / India / Canada / US data');
}

app.listen(PORT, () => {
  console.log(`🚚 FreightLink API  →  http://localhost:${PORT}`);
  console.log('   Demo logins:');
  console.log('   🇰🇪 admin@freightlink.co.ke  /  admin123');
  console.log('   🇮🇳 admin@freightlink.in     /  admin123');
  console.log('   🇨🇦 admin@freightlink.ca     /  admin123');
  console.log('   🇺🇸 admin@freightlink.us     /  admin123');
});
