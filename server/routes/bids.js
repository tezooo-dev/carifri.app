const router = require('express').Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/bids?market=kenya
router.get('/', requireAuth, (req, res) => {
  const market = req.query.market || req.user.market;
  const rows = getDb().prepare(`
    SELECT b.*, c.name as carrier_name, c.rating as carrier_rating
    FROM load_bids b
    JOIN carriers c ON c.id = b.carrier_id
    JOIN loads l ON l.id = b.load_id
    WHERE l.market = ?
    ORDER BY b.created_at DESC
  `).all(market);
  res.json(rows.map(parseBid));
});

// GET /api/bids/:loadId — bids for a specific load
router.get('/:loadId', requireAuth, (req, res) => {
  const rows = getDb().prepare(`
    SELECT b.*, c.name as carrier_name, c.phone as carrier_phone,
           c.rating as carrier_rating, c.verified as carrier_verified
    FROM load_bids b
    JOIN carriers c ON c.id = b.carrier_id
    WHERE b.load_id = ? AND b.status != 'withdrawn'
    ORDER BY b.amount ASC
  `).all(req.params.loadId);
  res.json(rows.map(parseBid));
});

function parseBid(row) {
  return {
    ...row,
    accessorials: JSON.parse(row.accessorials || '[]'),
    totalAmount: calcTotal(row),
  };
}

function calcTotal(row) {
  const base  = row.amount || 0;
  const extra = JSON.parse(row.accessorials || '[]').reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
  return base + extra;
}

// POST /api/bids/:loadId — submit a bid
router.post('/:loadId', requireAuth, (req, res) => {
  const db = getDb();
  const { carrierId, amount, etaHours, notes, serviceType, serviceDays, accessorials } = req.body;
  if (!carrierId || !amount) return res.status(400).json({ error: 'carrierId and amount required' });

  const load = db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.loadId);
  if (!load) return res.status(404).json({ error: 'Load not found' });
  if (!['Available', 'Bidding'].includes(load.status)) {
    return res.status(400).json({ error: 'Load is not open for bids' });
  }

  db.prepare("UPDATE loads SET status = 'Bidding' WHERE id = ? AND status = 'Available'").run(req.params.loadId);

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO load_bids
      (load_id, carrier_id, amount, eta_hours, notes, service_type, service_days, accessorials)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.loadId,
    carrierId,
    amount,
    etaHours   || null,
    notes      || '',
    serviceType || 'FTL',
    serviceDays || 0,
    JSON.stringify(accessorials || []),
  );

  res.status(201).json(parseBid(db.prepare(`
    SELECT b.*, c.name as carrier_name, c.rating as carrier_rating
    FROM load_bids b JOIN carriers c ON c.id = b.carrier_id
    WHERE b.id = ?
  `).get(lastInsertRowid)));
});

// POST /api/bids/:loadId/accept/:bidId
router.post('/:loadId/accept/:bidId', requireAuth, (req, res) => {
  const db = getDb();
  const bid = db.prepare('SELECT * FROM load_bids WHERE id = ? AND load_id = ?').get(req.params.bidId, req.params.loadId);
  if (!bid) return res.status(404).json({ error: 'Bid not found' });

  db.prepare("UPDATE load_bids SET status = 'rejected' WHERE load_id = ? AND id != ?").run(req.params.loadId, bid.id);
  db.prepare("UPDATE load_bids SET status = 'accepted' WHERE id = ?").run(bid.id);

  const now      = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const load     = db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.loadId);
  const timeline = JSON.parse(load.timeline);
  const ev       = timeline.find(t => t.event === 'Carrier Assigned');
  if (ev) { ev.done = true; ev.time = now; }

  // Use the bid's total (base + accessorials) as the accepted freight amount
  const total = calcTotal(bid);

  db.prepare("UPDATE loads SET carrier_id = ?, status = 'Booked', freight_amount = ?, timeline = ? WHERE id = ?")
    .run(bid.carrier_id, total, JSON.stringify(timeline), req.params.loadId);

  res.json({ ok: true, carrierId: bid.carrier_id, amount: total });
});

// DELETE /api/bids/:bidId — withdraw
router.delete('/:bidId', requireAuth, (req, res) => {
  getDb().prepare("UPDATE load_bids SET status = 'withdrawn' WHERE id = ?").run(req.params.bidId);
  res.json({ ok: true });
});

module.exports = router;
