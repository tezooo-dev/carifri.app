const router = require('express').Router();
const { one, run } = require('../lib/db');
const { requireAuth } = require('../middleware/auth');

function parseCarrier(row) {
  if (!row) return null;
  return {
    ...row,
    // All JSONB columns come back as JS objects — no JSON.parse needed
    // BOOLEAN columns come back as true/false — no Boolean() needed
    truckTypes:    row.truck_types,
    verified:      row.verified,
    truckCount:    row.truck_count,
    totalLoads:    row.total_loads,
    contracts:     row.contracts,
    insurance:     row.insurance,
    ediConfig:     row.edi_config,
    contacts:      row.contacts,
    // US/Canada compliance
    mcNumber:      row.mc_number      || '',
    dotNumber:     row.dot_number     || '',
    authorityType: row.authority_type || '',
    w9OnFile:      row.w9_on_file,
    coiOnFile:     row.coi_on_file,
    cvorNumber:    row.cvor_number    || '',
    nscNumber:     row.nsc_number     || '',
    iftaNumber:    row.ifta_number    || '',
    cvorStatus:    row.cvor_status    || '',
  };
}

// GET /api/carrier-details/:id  — full detail view
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const row = await one('SELECT * FROM carriers WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Carrier not found' });
    res.json(parseCarrier(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/carrier-details/:id/contracts
router.put('/:id/contracts', requireAuth, async (req, res) => {
  try {
    // JSONB column: pass JS object/array directly — no JSON.stringify needed
    await run(
      'UPDATE carriers SET contracts = $1 WHERE id = $2',
      [req.body.contracts || [], req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/carrier-details/:id/insurance
router.put('/:id/insurance', requireAuth, async (req, res) => {
  try {
    await run(
      'UPDATE carriers SET insurance = $1 WHERE id = $2',
      [req.body.insurance || {}, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/carrier-details/:id/edi
router.put('/:id/edi', requireAuth, async (req, res) => {
  try {
    await run(
      'UPDATE carriers SET edi_config = $1 WHERE id = $2',
      [req.body.ediConfig || {}, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/carrier-details/:id/contacts
router.put('/:id/contacts', requireAuth, async (req, res) => {
  try {
    await run(
      'UPDATE carriers SET contacts = $1 WHERE id = $2',
      [req.body.contacts || [], req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/carrier-details/:id/compliance  — US/Canada regulatory fields
router.put('/:id/compliance', requireAuth, async (req, res) => {
  try {
    const {
      mcNumber, dotNumber, authorityType,
      w9OnFile, coiOnFile,
      cvorNumber, nscNumber, iftaNumber, cvorStatus,
    } = req.body;

    await run(
      `UPDATE carriers SET
        mc_number = $1, dot_number = $2, authority_type = $3,
        w9_on_file = $4, coi_on_file = $5,
        cvor_number = $6, nsc_number = $7, ifta_number = $8, cvor_status = $9
       WHERE id = $10`,
      [
        mcNumber      || '',
        dotNumber     || '',
        authorityType || '',
        w9OnFile  ? true : false,  // BOOLEAN column — pass true/false directly
        coiOnFile ? true : false,
        cvorNumber || '',
        nscNumber  || '',
        iftaNumber || '',
        cvorStatus || '',
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
