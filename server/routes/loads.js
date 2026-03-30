const router = require('express').Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendLoadNotification } = require('../services/email');

function notifyAdmins(db, market, event, load, extra) {
  const admins = db.prepare("SELECT email, name FROM users WHERE market = ? AND role = 'admin'").all(market);
  for (const a of admins) {
    sendLoadNotification({ recipientEmail: a.email, recipientName: a.name, event, load, extra }).catch(() => {});
  }
}

function parseLoad(row) {
  if (!row) return null;
  return {
    ...row,
    timeline:       JSON.parse(row.timeline || '[]'),
    cargoInsurance: Boolean(row.cargo_insurance),
    commissionReceived: Boolean(row.commission_received),
    freightAmount:  row.freight_amount,
    truckType:      row.truck_type,
    pickupDate:     row.pickup_date,
    deliveryDate:   row.delivery_date,
    shipperContact: row.shipper_contact,
    shipperPhone:   row.shipper_phone,
    carrierId:      row.carrier_id || '',
    shipperId:      row.shipper_id || '',
    specialInstructions: row.special_instructions || '',
  };
}

// GET /api/loads?market=kenya
router.get('/', requireAuth, (req, res) => {
  const market = req.query.market || req.user.market;
  const rows = getDb().prepare('SELECT * FROM loads WHERE market = ? ORDER BY created_at DESC').all(market);
  res.json(rows.map(parseLoad));
});

// POST /api/loads
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const { market, origin, destination, commodity, weight, truckType, freightAmount,
    commission, advance, shipperId, shipperContact, shipperPhone,
    pickupDate, deliveryDate, specialInstructions, cargoInsurance } = req.body;

  const settings = db.prepare('SELECT market FROM settings WHERE id = 1').get();
  const mkt = market || settings?.market || req.user.market;

  // Generate ID
  const prefix = { kenya:'FL', india:'IN', canada:'CA', us:'US' }[mkt] || 'FL';
  const count  = db.prepare("SELECT COUNT(*) as c FROM loads WHERE market = ?").get(mkt).c + 1;
  const id     = `${prefix}-${String(count).padStart(3,'0')}`;

  const now = new Date().toISOString().replace('T',' ').slice(0,16);
  const timeline = JSON.stringify([
    { event: 'Load Posted',      time: now, done: true  },
    { event: 'Carrier Assigned', time: '',  done: false },
    { event: 'Picked Up',        time: '',  done: false },
    { event: 'In Transit',       time: '',  done: false },
    { event: 'Delivered',        time: '',  done: false },
  ]);

  db.prepare(`
    INSERT INTO loads (id, market, origin, destination, commodity, weight, truck_type,
      freight_amount, commission, advance, status, shipper_id, carrier_id, shipper_contact,
      shipper_phone, pickup_date, delivery_date, special_instructions, cargo_insurance,
      commission_received, timeline)
    VALUES (?,?,?,?,?,?,?,?,?,?,'Available',?,?,?,?,?,?,?,?,0,?)
  `).run(id, mkt, origin, destination, commodity, weight, truckType, freightAmount,
    commission, advance || 0, shipperId || '', '', shipperContact || '', shipperPhone || '',
    pickupDate || '', deliveryDate || '', specialInstructions || '', cargoInsurance ? 1 : 0, timeline);

  res.status(201).json(parseLoad(db.prepare('SELECT * FROM loads WHERE id = ?').get(id)));
});

// PATCH /api/loads/:id/assign
router.patch('/:id/assign', requireAuth, (req, res) => {
  const db = getDb();
  const { carrierId } = req.body;
  const load = db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id);
  if (!load) return res.status(404).json({ error: 'Load not found' });

  const now = new Date().toISOString().replace('T',' ').slice(0,16);
  const timeline = JSON.parse(load.timeline);
  const ev = timeline.find(t => t.event === 'Carrier Assigned');
  if (ev) { ev.done = true; ev.time = now; }

  db.prepare("UPDATE loads SET carrier_id = ?, status = 'Booked', timeline = ? WHERE id = ?")
    .run(carrierId, JSON.stringify(timeline), req.params.id);
  const updated = parseLoad(db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id));
  const carrier = db.prepare('SELECT name FROM carriers WHERE id = ?').get(carrierId);
  notifyAdmins(db, load.market, 'load_booked', updated, { carrierName: carrier?.name });
  res.json(updated);
});

// PATCH /api/loads/:id/pickup
router.patch('/:id/pickup', requireAuth, (req, res) => {
  const db = getDb();
  const load = db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id);
  if (!load) return res.status(404).json({ error: 'Load not found' });

  const now = new Date().toISOString().replace('T',' ').slice(0,16);
  const timeline = JSON.parse(load.timeline);
  ['Picked Up','In Transit'].forEach(name => {
    const ev = timeline.find(t => t.event === name);
    if (ev) { ev.done = true; ev.time = now; }
  });

  db.prepare("UPDATE loads SET status = 'In Transit', timeline = ? WHERE id = ?")
    .run(JSON.stringify(timeline), req.params.id);
  const updated = parseLoad(db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id));
  notifyAdmins(db, load.market, 'load_picked_up', updated);
  res.json(updated);
});

// PATCH /api/loads/:id/deliver
router.patch('/:id/deliver', requireAuth, (req, res) => {
  const db = getDb();
  const load = db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id);
  if (!load) return res.status(404).json({ error: 'Load not found' });

  const now = new Date().toISOString().replace('T',' ').slice(0,16);
  const timeline = JSON.parse(load.timeline);
  const ev = timeline.find(t => t.event === 'Delivered');
  if (ev) { ev.done = true; ev.time = now; }

  db.prepare("UPDATE loads SET status = 'Delivered', timeline = ? WHERE id = ?")
    .run(JSON.stringify(timeline), req.params.id);
  const updated = parseLoad(db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id));
  notifyAdmins(db, load.market, 'load_delivered', updated);
  res.json(updated);
});

// PATCH /api/loads/:id/cancel
router.patch('/:id/cancel', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare("UPDATE loads SET status = 'Cancelled' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// PATCH /api/loads/:id/commission
router.patch('/:id/commission', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare("UPDATE loads SET commission_received = 1 WHERE id = ?").run(req.params.id);
  res.json(parseLoad(db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.id)));
});

// DELETE /api/loads/:id
router.delete('/:id', requireAuth, (req, res) => {
  getDb().prepare('DELETE FROM loads WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
