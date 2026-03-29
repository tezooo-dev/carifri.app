const router = require('express').Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

function parseCarrier(row) {
  if (!row) return null;
  return { ...row, truckTypes: JSON.parse(row.truck_types || '[]'),
    verified: Boolean(row.verified), truckCount: row.truck_count, totalLoads: row.total_loads };
}

// GET /api/carriers?market=kenya
router.get('/', requireAuth, (req, res) => {
  const market = req.query.market || req.user.market;
  const rows = getDb().prepare('SELECT * FROM carriers WHERE market = ? ORDER BY name').all(market);
  res.json(rows.map(parseCarrier));
});

// POST /api/carriers
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const { market, name, contact, phone, email, location, truckTypes, truckCount, rating } = req.body;
  const mkt = market || req.user.market;
  const id  = `c${Date.now()}`;
  db.prepare(`INSERT INTO carriers (id, market, name, contact, phone, email, location, truck_types, truck_count, rating, verified, total_loads)
    VALUES (?,?,?,?,?,?,?,?,?,?,0,0)`)
    .run(id, mkt, name, contact||'', phone||'', email||'', location||'',
      JSON.stringify(truckTypes||[]), truckCount||1, rating||4.0);
  res.status(201).json(parseCarrier(db.prepare('SELECT * FROM carriers WHERE id = ?').get(id)));
});

// PATCH /api/carriers/:id/verify
router.patch('/:id/verify', requireAuth, (req, res) => {
  getDb().prepare('UPDATE carriers SET verified = 1 - verified WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/carriers/:id
router.delete('/:id', requireAuth, (req, res) => {
  getDb().prepare('DELETE FROM carriers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
