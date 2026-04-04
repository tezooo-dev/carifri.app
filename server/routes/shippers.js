const router = require('express').Router();
const { one, all, run } = require('../lib/db');
const { requireAuth, companyId } = require('../middleware/auth');

function parseShipper(row) {
  if (!row) return null;
  return {
    ...row,
    totalLoads: row.total_loads,
    totalSpend: row.total_spend,
  };
}

// GET /api/shippers?market=kenya
router.get('/', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const market = req.query.market || req.user.market;

    let rows;
    if (req.user.role === 'super_admin') {
      rows = await all(
        'SELECT * FROM shippers WHERE market = $1 ORDER BY name',
        [market]
      );
    } else {
      rows = await all(
        'SELECT * FROM shippers WHERE company_id = $1 AND market = $2 ORDER BY name',
        [cid, market]
      );
    }
    res.json(rows.map(parseShipper));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shippers
router.post('/', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const { market, name, contact, phone, email, location, industry } = req.body;
    const mkt = market || req.user.market;
    const id = `s${Date.now()}`;

    await run(
      `INSERT INTO shippers
        (id, company_id, market, name, contact, phone, email, location,
         total_loads, total_spend, industry)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, $9)`,
      [id, cid, mkt, name, contact || '', phone || '', email || '', location || '', industry || '']
    );

    const created = await one('SELECT * FROM shippers WHERE id = $1', [id]);
    res.status(201).json(parseShipper(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/shippers/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await run('DELETE FROM shippers WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
