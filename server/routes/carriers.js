const router = require('express').Router();
const { one, all, run } = require('../lib/db');
const { requireAuth, requireRole, companyId } = require('../middleware/auth');

function parseCarrier(row) {
  if (!row) return null;
  return {
    ...row,
    // truck_types is JSONB — already a JS array, no JSON.parse needed
    // verified is BOOLEAN — no Boolean() needed
    truckTypes:  row.truck_types,
    verified:    row.verified,
    truckCount:  row.truck_count,
    totalLoads:  row.total_loads,
  };
}

// GET /api/carriers?market=kenya
router.get('/', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const market = req.query.market || req.user.market;

    let rows;
    if (req.user.role === 'super_admin') {
      rows = await all(
        'SELECT * FROM carriers WHERE market = $1 ORDER BY name',
        [market]
      );
    } else {
      rows = await all(
        'SELECT * FROM carriers WHERE company_id = $1 AND market = $2 ORDER BY name',
        [cid, market]
      );
    }
    res.json(rows.map(parseCarrier));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/carriers  — admin only
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const cid = companyId(req);
    const { market, name, contact, phone, email, location, truckTypes, truckCount, rating } = req.body;
    const mkt = market || req.user.market;
    const id = `c${Date.now()}`;

    await run(
      `INSERT INTO carriers
        (id, company_id, market, name, contact, phone, email, location,
         truck_types, truck_count, rating, verified, total_loads)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, 0)`,
      [
        id, cid, mkt, name, contact || '', phone || '', email || '',
        location || '', truckTypes || [], truckCount || 1, rating || 4.0,
      ]
    );

    const created = await one('SELECT * FROM carriers WHERE id = $1', [id]);
    res.status(201).json(parseCarrier(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/carriers/:id/verify  — admin only
router.patch('/:id/verify', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await run('UPDATE carriers SET verified = NOT verified WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/carriers/:id  — admin only
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await run('DELETE FROM carriers WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
