const router = require('express').Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

function parseShipper(row) {
  if (!row) return null;
  return { ...row, totalLoads: row.total_loads, totalSpend: row.total_spend };
}

// GET /api/shippers?market=kenya
router.get('/', requireAuth, (req, res) => {
  const market = req.query.market || req.user.market;
  const rows = getDb().prepare('SELECT * FROM shippers WHERE market = ? ORDER BY name').all(market);
  res.json(rows.map(parseShipper));
});

// POST /api/shippers
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const { market, name, contact, phone, email, location, industry } = req.body;
  const mkt = market || req.user.market;
  const id  = `s${Date.now()}`;
  db.prepare('INSERT INTO shippers (id, market, name, contact, phone, email, location, total_loads, total_spend, industry) VALUES (?,?,?,?,?,?,?,0,0,?)')
    .run(id, mkt, name, contact||'', phone||'', email||'', location||'', industry||'');
  res.status(201).json(parseShipper(db.prepare('SELECT * FROM shippers WHERE id = ?').get(id)));
});

// DELETE /api/shippers/:id
router.delete('/:id', requireAuth, (req, res) => {
  getDb().prepare('DELETE FROM shippers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
