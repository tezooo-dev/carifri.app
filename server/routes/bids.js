const router = require('express').Router();
const { one, all, run } = require('../lib/db');
const { requireAuth, companyId } = require('../middleware/auth');

function parseBid(row) {
  if (!row) return null;
  return {
    ...row,
    // accessorials is JSONB — already a JS array, no JSON.parse needed
    accessorials: row.accessorials,
    totalAmount: calcTotal(row),
  };
}

function calcTotal(row) {
  const base = row.amount || 0;
  // accessorials is already an array (JSONB), no JSON.parse needed
  const accessorials = row.accessorials || [];
  const extra = accessorials.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
  return base + extra;
}

// GET /api/bids?market=kenya
// Filter by load's company_id to scope results to the current tenant
router.get('/', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const market = req.query.market || req.user.market;

    let rows;
    if (req.user.role === 'super_admin') {
      rows = await all(
        `SELECT b.*, c.name AS carrier_name, c.rating AS carrier_rating
         FROM load_bids b
         JOIN carriers c ON c.id = b.carrier_id
         JOIN loads l ON l.id = b.load_id
         WHERE l.market = $1
         ORDER BY b.created_at DESC`,
        [market]
      );
    } else {
      rows = await all(
        `SELECT b.*, c.name AS carrier_name, c.rating AS carrier_rating
         FROM load_bids b
         JOIN carriers c ON c.id = b.carrier_id
         JOIN loads l ON l.id = b.load_id
         WHERE l.company_id = $1 AND l.market = $2
         ORDER BY b.created_at DESC`,
        [cid, market]
      );
    }
    res.json(rows.map(parseBid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bids/:loadId — bids for a specific load
router.get('/:loadId', requireAuth, async (req, res) => {
  try {
    const rows = await all(
      `SELECT b.*, c.name AS carrier_name, c.phone AS carrier_phone,
              c.rating AS carrier_rating, c.verified AS carrier_verified
       FROM load_bids b
       JOIN carriers c ON c.id = b.carrier_id
       WHERE b.load_id = $1 AND b.status != 'withdrawn'
       ORDER BY b.amount ASC`,
      [req.params.loadId]
    );
    res.json(rows.map(parseBid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bids/:loadId — submit a bid
router.post('/:loadId', requireAuth, async (req, res) => {
  try {
    const { carrierId, amount, etaHours, notes, serviceType, serviceDays, accessorials } = req.body;
    if (!carrierId || !amount) return res.status(400).json({ error: 'carrierId and amount required' });

    const load = await one('SELECT * FROM loads WHERE id = $1', [req.params.loadId]);
    if (!load) return res.status(404).json({ error: 'Load not found' });
    if (!['Available', 'Bidding'].includes(load.status)) {
      return res.status(400).json({ error: 'Load is not open for bids' });
    }

    await run(
      "UPDATE loads SET status = 'Bidding' WHERE id = $1 AND status = 'Available'",
      [req.params.loadId]
    );

    // Use RETURNING id to get the new row's PK
    const result = await run(
      `INSERT INTO load_bids
        (load_id, carrier_id, amount, eta_hours, notes, service_type, service_days, accessorials)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        req.params.loadId,
        carrierId,
        amount,
        etaHours    || null,
        notes       || '',
        serviceType || 'FTL',
        serviceDays || 0,
        accessorials || [],  // JSONB — pass array directly
      ]
    );
    const newId = result.rows[0].id;

    const newBid = await one(
      `SELECT b.*, c.name AS carrier_name, c.rating AS carrier_rating
       FROM load_bids b
       JOIN carriers c ON c.id = b.carrier_id
       WHERE b.id = $1`,
      [newId]
    );
    res.status(201).json(parseBid(newBid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bids/:loadId/accept/:bidId
router.post('/:loadId/accept/:bidId', requireAuth, async (req, res) => {
  try {
    const bid = await one(
      'SELECT * FROM load_bids WHERE id = $1 AND load_id = $2',
      [req.params.bidId, req.params.loadId]
    );
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    await run(
      "UPDATE load_bids SET status = 'rejected' WHERE load_id = $1 AND id != $2",
      [req.params.loadId, bid.id]
    );
    await run(
      "UPDATE load_bids SET status = 'accepted' WHERE id = $1",
      [bid.id]
    );

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const load = await one('SELECT * FROM loads WHERE id = $1', [req.params.loadId]);
    const timeline = load.timeline; // already a JS array (JSONB)
    const ev = timeline.find(t => t.event === 'Carrier Assigned');
    if (ev) { ev.done = true; ev.time = now; }

    // Use the bid's total (base + accessorials) as the accepted freight amount
    const total = calcTotal(bid);

    await run(
      "UPDATE loads SET carrier_id = $1, status = 'Booked', freight_amount = $2, timeline = $3 WHERE id = $4",
      [bid.carrier_id, total, timeline, req.params.loadId]
    );

    res.json({ ok: true, carrierId: bid.carrier_id, amount: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bids/:bidId — withdraw
router.delete('/:bidId', requireAuth, async (req, res) => {
  try {
    await run("UPDATE load_bids SET status = 'withdrawn' WHERE id = $1", [req.params.bidId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
