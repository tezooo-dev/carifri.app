const router = require('express').Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/settings
router.get('/', requireAuth, (req, res) => {
  const row = getDb().prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(row || {});
});

// PUT /api/settings
router.put('/', requireAuth, (req, res) => {
  const { companyName, companyPhone, companyEmail, commissionRate, currency, country, market } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE settings SET
      company_name    = COALESCE(?, company_name),
      company_phone   = COALESCE(?, company_phone),
      company_email   = COALESCE(?, company_email),
      commission_rate = COALESCE(?, commission_rate),
      currency        = COALESCE(?, currency),
      country         = COALESCE(?, country),
      market          = COALESCE(?, market)
    WHERE id = 1
  `).run(companyName, companyPhone, companyEmail, commissionRate, currency, country, market);

  // Also update the current user's default market
  if (market) {
    db.prepare('UPDATE users SET market = ? WHERE id = ?').run(market, req.user.sub);
  }

  res.json(db.prepare('SELECT * FROM settings WHERE id = 1').get());
});

module.exports = router;
