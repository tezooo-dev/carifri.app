const router = require('express').Router();
const { one, run } = require('../lib/db');
const { requireAuth, companyId } = require('../middleware/auth');

const SETTINGS_DEFAULTS = {
  company_name:    '',
  company_phone:   '',
  company_email:   '',
  commission_rate: 0,
  currency:        'USD',
  country:         '',
  market:          '',
};

// GET /api/settings
router.get('/', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const row = await one('SELECT * FROM settings WHERE company_id = $1', [cid]);
    res.json(row || { ...SETTINGS_DEFAULTS, company_id: cid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', requireAuth, async (req, res) => {
  try {
    const { companyName, companyPhone, companyEmail, commissionRate, currency, country, market } = req.body || {};
    const cid = companyId(req);

    // Upsert: insert a row for this company if none exists, then update provided fields
    await run(
      `INSERT INTO settings (company_id) VALUES ($1)
       ON CONFLICT (company_id) DO NOTHING`,
      [cid]
    );

    await run(
      `UPDATE settings SET
        company_name    = COALESCE($1, company_name),
        company_phone   = COALESCE($2, company_phone),
        company_email   = COALESCE($3, company_email),
        commission_rate = COALESCE($4, commission_rate),
        currency        = COALESCE($5, currency),
        country         = COALESCE($6, country),
        market          = COALESCE($7, market)
       WHERE company_id = $8`,
      [
        companyName    ?? null,
        companyPhone   ?? null,
        companyEmail   ?? null,
        commissionRate ?? null,
        currency       ?? null,
        country        ?? null,
        market         ?? null,
        cid,
      ]
    );

    // Also update the current user's default market when market changes
    if (market) {
      await run('UPDATE users SET market = $1 WHERE id = $2', [market, req.user.sub]);
    }

    const updated = await one('SELECT * FROM settings WHERE company_id = $1', [cid]);
    res.json(updated || { ...SETTINGS_DEFAULTS, company_id: cid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
