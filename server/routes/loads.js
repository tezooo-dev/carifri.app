const router = require('express').Router();
const { one, all, run } = require('../lib/db');
const { requireAuth, companyId } = require('../middleware/auth');
const { sendLoadNotification } = require('../services/email');

async function notifyAdmins(cid, market, event, load, extra) {
  const admins = await all(
    "SELECT email, name FROM users WHERE company_id = $1 AND market = $2 AND role = 'admin'",
    [cid, market]
  );
  for (const a of admins) {
    sendLoadNotification({ recipientEmail: a.email, recipientName: a.name, event, load, extra }).catch(() => {});
  }
}

function parseLoad(row) {
  if (!row) return null;
  return {
    ...row,
    // timeline is JSONB — already a JS array, no JSON.parse needed
    // cargo_insurance and commission_received are BOOLEAN — no Boolean() needed
    cargoInsurance:      row.cargo_insurance,
    commissionReceived:  row.commission_received,
    freightAmount:       row.freight_amount,
    truckType:           row.truck_type,
    pickupDate:          row.pickup_date,
    deliveryDate:        row.delivery_date,
    shipperContact:      row.shipper_contact,
    shipperPhone:        row.shipper_phone,
    carrierId:           row.carrier_id || '',
    shipperId:           row.shipper_id || '',
    specialInstructions: row.special_instructions || '',
  };
}

// GET /api/loads?market=kenya
router.get('/', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const market = req.query.market || req.user.market;

    let rows;
    if (req.user.role === 'super_admin') {
      rows = await all(
        'SELECT * FROM loads WHERE market = $1 ORDER BY created_at DESC',
        [market]
      );
    } else {
      rows = await all(
        'SELECT * FROM loads WHERE company_id = $1 AND market = $2 ORDER BY created_at DESC',
        [cid, market]
      );
    }
    res.json(rows.map(parseLoad));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/loads
router.post('/', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const {
      market, origin, destination, commodity, weight,
      truckType, freightAmount, commission, advance,
      shipperId, shipperContact, shipperPhone,
      pickupDate, deliveryDate, specialInstructions, cargoInsurance,
    } = req.body;

    const settings = await one(
      'SELECT market FROM settings WHERE company_id = $1',
      [cid]
    );
    const mkt = market || settings?.market || req.user.market;

    const prefix = { kenya: 'FL', india: 'IN', canada: 'CA', us: 'US' }[mkt] || 'FL';
    const countRow = await one(
      'SELECT COUNT(*) AS c FROM loads WHERE company_id = $1 AND market = $2',
      [cid, mkt]
    );
    const count = parseInt(countRow.c, 10) + 1;
    const id = `${prefix}-${String(count).padStart(3, '0')}`;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const timeline = [
      { event: 'Load Posted',      time: now, done: true  },
      { event: 'Carrier Assigned', time: '',  done: false },
      { event: 'Picked Up',        time: '',  done: false },
      { event: 'In Transit',       time: '',  done: false },
      { event: 'Delivered',        time: '',  done: false },
    ];

    await run(
      `INSERT INTO loads
        (id, company_id, market, origin, destination, commodity, weight,
         truck_type, freight_amount, commission, advance, status,
         shipper_id, carrier_id, shipper_contact, shipper_phone,
         pickup_date, delivery_date, special_instructions,
         cargo_insurance, commission_received, timeline)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Available',
         $12, $13, $14, $15, $16, $17, $18, $19, false, $20)`,
      [
        id, cid, mkt, origin, destination, commodity, weight,
        truckType, freightAmount, commission, advance || 0,
        shipperId || '', '', shipperContact || '', shipperPhone || '',
        pickupDate || '', deliveryDate || '', specialInstructions || '',
        cargoInsurance ? true : false,
        timeline,
      ]
    );

    const created = await one('SELECT * FROM loads WHERE id = $1', [id]);
    res.status(201).json(parseLoad(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/loads/:id/assign
router.patch('/:id/assign', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const { carrierId } = req.body;

    const load = req.user.role === 'super_admin'
      ? await one('SELECT * FROM loads WHERE id = $1', [req.params.id])
      : await one('SELECT * FROM loads WHERE id = $1 AND company_id = $2', [req.params.id, cid]);
    if (!load) return res.status(404).json({ error: 'Load not found' });

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const timeline = load.timeline; // already a JS array (JSONB)
    const ev = timeline.find(t => t.event === 'Carrier Assigned');
    if (ev) { ev.done = true; ev.time = now; }

    await run(
      "UPDATE loads SET carrier_id = $1, status = 'Booked', timeline = $2 WHERE id = $3",
      [carrierId, timeline, req.params.id]
    );

    const updated = parseLoad(await one('SELECT * FROM loads WHERE id = $1', [req.params.id]));
    const carrier = await one('SELECT name FROM carriers WHERE id = $1', [carrierId]);
    await notifyAdmins(cid, load.market, 'load_booked', updated, { carrierName: carrier?.name });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/loads/:id/pickup
router.patch('/:id/pickup', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);

    const load = req.user.role === 'super_admin'
      ? await one('SELECT * FROM loads WHERE id = $1', [req.params.id])
      : await one('SELECT * FROM loads WHERE id = $1 AND company_id = $2', [req.params.id, cid]);
    if (!load) return res.status(404).json({ error: 'Load not found' });

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const timeline = load.timeline;
    ['Picked Up', 'In Transit'].forEach(name => {
      const ev = timeline.find(t => t.event === name);
      if (ev) { ev.done = true; ev.time = now; }
    });

    await run(
      "UPDATE loads SET status = 'In Transit', timeline = $1 WHERE id = $2",
      [timeline, req.params.id]
    );

    const updated = parseLoad(await one('SELECT * FROM loads WHERE id = $1', [req.params.id]));
    await notifyAdmins(cid, load.market, 'load_picked_up', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/loads/:id/deliver
router.patch('/:id/deliver', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);

    const load = req.user.role === 'super_admin'
      ? await one('SELECT * FROM loads WHERE id = $1', [req.params.id])
      : await one('SELECT * FROM loads WHERE id = $1 AND company_id = $2', [req.params.id, cid]);
    if (!load) return res.status(404).json({ error: 'Load not found' });

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const timeline = load.timeline;
    const ev = timeline.find(t => t.event === 'Delivered');
    if (ev) { ev.done = true; ev.time = now; }

    await run(
      "UPDATE loads SET status = 'Delivered', timeline = $1 WHERE id = $2",
      [timeline, req.params.id]
    );

    const updated = parseLoad(await one('SELECT * FROM loads WHERE id = $1', [req.params.id]));
    await notifyAdmins(cid, load.market, 'load_delivered', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/loads/:id/cancel
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  try {
    await run("UPDATE loads SET status = 'Cancelled' WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/loads/:id/commission
router.patch('/:id/commission', requireAuth, async (req, res) => {
  try {
    await run('UPDATE loads SET commission_received = true WHERE id = $1', [req.params.id]);
    const updated = await one('SELECT * FROM loads WHERE id = $1', [req.params.id]);
    res.json(parseLoad(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/loads/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await run('DELETE FROM loads WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
