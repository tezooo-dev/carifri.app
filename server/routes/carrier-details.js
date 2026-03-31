const router = require('express').Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

function parseCarrier(row) {
  if (!row) return null;
  return {
    ...row,
    truckTypes:    JSON.parse(row.truck_types || '[]'),
    verified:      Boolean(row.verified),
    truckCount:    row.truck_count,
    totalLoads:    row.total_loads,
    contracts:     JSON.parse(row.contracts  || '[]'),
    insurance:     JSON.parse(row.insurance  || '{}'),
    ediConfig:     JSON.parse(row.edi_config || '{}'),
    contacts:      JSON.parse(row.contacts   || '[]'),
    // US/Canada compliance
    mcNumber:      row.mc_number     || '',
    dotNumber:     row.dot_number    || '',
    authorityType: row.authority_type || '',
    w9OnFile:      Boolean(row.w9_on_file),
    coiOnFile:     Boolean(row.coi_on_file),
    cvorNumber:    row.cvor_number   || '',
    nscNumber:     row.nsc_number    || '',
    iftaNumber:    row.ifta_number   || '',
    cvorStatus:    row.cvor_status   || '',
  };
}

// GET /api/carrier-details/:id  — full detail view
router.get('/:id', requireAuth, (req, res) => {
  const row = getDb().prepare('SELECT * FROM carriers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Carrier not found' });
  res.json(parseCarrier(row));
});

// PUT /api/carrier-details/:id/contracts
router.put('/:id/contracts', requireAuth, (req, res) => {
  getDb().prepare('UPDATE carriers SET contracts = ? WHERE id = ?')
    .run(JSON.stringify(req.body.contracts || []), req.params.id);
  res.json({ ok: true });
});

// PUT /api/carrier-details/:id/insurance
router.put('/:id/insurance', requireAuth, (req, res) => {
  getDb().prepare('UPDATE carriers SET insurance = ? WHERE id = ?')
    .run(JSON.stringify(req.body.insurance || {}), req.params.id);
  res.json({ ok: true });
});

// PUT /api/carrier-details/:id/edi
router.put('/:id/edi', requireAuth, (req, res) => {
  getDb().prepare('UPDATE carriers SET edi_config = ? WHERE id = ?')
    .run(JSON.stringify(req.body.ediConfig || {}), req.params.id);
  res.json({ ok: true });
});

// PUT /api/carrier-details/:id/contacts
router.put('/:id/contacts', requireAuth, (req, res) => {
  getDb().prepare('UPDATE carriers SET contacts = ? WHERE id = ?')
    .run(JSON.stringify(req.body.contacts || []), req.params.id);
  res.json({ ok: true });
});

// PUT /api/carrier-details/:id/compliance  — US/Canada regulatory fields
router.put('/:id/compliance', requireAuth, (req, res) => {
  const { mcNumber, dotNumber, authorityType, w9OnFile, coiOnFile,
          cvorNumber, nscNumber, iftaNumber, cvorStatus } = req.body;
  getDb().prepare(`
    UPDATE carriers SET
      mc_number = ?, dot_number = ?, authority_type = ?,
      w9_on_file = ?, coi_on_file = ?,
      cvor_number = ?, nsc_number = ?, ifta_number = ?, cvor_status = ?
    WHERE id = ?
  `).run(
    mcNumber || '', dotNumber || '', authorityType || '',
    w9OnFile ? 1 : 0, coiOnFile ? 1 : 0,
    cvorNumber || '', nscNumber || '', iftaNumber || '', cvorStatus || '',
    req.params.id
  );
  res.json({ ok: true });
});

module.exports = router;
