/**
 * Carrier Portal API
 * Endpoints used by the carrier-facing portal:
 *   - View loads assigned to a carrier
 *   - Submit tracking updates (by code or free text)
 *   - Upload / list load documents
 *   - Submit and view disputes
 *   - Browse the tracking code reference table
 */
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

function nowStr() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// ── Tracking code reference ────────────────────────────────────────────────────
// GET /api/carrier-portal/tracking-codes
router.get('/tracking-codes', requireAuth, (req, res) => {
  const { category, q } = req.query;
  let sql = 'SELECT * FROM tracking_codes';
  const args = [];
  if (category) { sql += ' WHERE category = ?'; args.push(category); }
  else if (q) {
    sql += ' WHERE code LIKE ? OR message LIKE ?';
    args.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY category, code';
  res.json(getDb().prepare(sql).all(...args));
});

// GET /api/carrier-portal/tracking-codes/:code — resolve a single code
router.get('/tracking-codes/:code', requireAuth, (req, res) => {
  const row = getDb()
    .prepare('SELECT * FROM tracking_codes WHERE code = ?')
    .get(req.params.code.toUpperCase());
  if (!row) return res.status(404).json({ error: 'Tracking code not found' });
  res.json(row);
});

// POST /api/carrier-portal/tracking-codes — admin: add custom code
router.post('/tracking-codes', requireAuth, (req, res) => {
  const { code, category, message, description, isTerminal } = req.body;
  if (!code || !message) return res.status(400).json({ error: 'code and message required' });
  try {
    getDb().prepare(`
      INSERT INTO tracking_codes (code, category, message, description, is_terminal)
      VALUES (?, ?, ?, ?, ?)
    `).run(code.toUpperCase(), category || 'Status', message, description || '', isTerminal ? 1 : 0);
    res.status(201).json({ ok: true });
  } catch {
    res.status(409).json({ error: 'Code already exists' });
  }
});

// ── Carrier loads ─────────────────────────────────────────────────────────────
// GET /api/carrier-portal/loads?carrierId=xxx&market=kenya
router.get('/loads', requireAuth, (req, res) => {
  const { carrierId, market } = req.query;
  if (!carrierId) return res.status(400).json({ error: 'carrierId required' });
  const mkt = market || req.user.market || 'kenya';
  const rows = getDb().prepare(`
    SELECT l.*, c.name as carrier_name
    FROM loads l
    JOIN carriers c ON c.id = l.carrier_id
    WHERE l.carrier_id = ? AND l.market = ?
    ORDER BY l.created_at DESC
  `).all(carrierId, mkt);
  res.json(rows.map(r => ({
    ...r,
    timeline:     JSON.parse(r.timeline || '[]'),
    accessorials: JSON.parse(r.accessorials || '[]'),
  })));
});

// ── Carrier tracking events ───────────────────────────────────────────────────
// GET /api/carrier-portal/tracking/:loadId
router.get('/tracking/:loadId', requireAuth, (req, res) => {
  const rows = getDb()
    .prepare('SELECT * FROM carrier_tracking WHERE load_id = ? ORDER BY event_time ASC')
    .all(req.params.loadId);
  res.json(rows);
});

// POST /api/carrier-portal/tracking/:loadId — submit tracking event
router.post('/tracking/:loadId', requireAuth, (req, res) => {
  const { carrierId, code, location, notes, latitude, longitude } = req.body;
  if (!carrierId || !code) return res.status(400).json({ error: 'carrierId and code required' });

  const db = getDb();
  // Resolve code → message (supports both standard codes and free-text)
  const codeRow  = db.prepare('SELECT * FROM tracking_codes WHERE code = ?').get(code.toUpperCase());
  const message  = codeRow ? codeRow.message : code; // fallback: use raw code as message

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO carrier_tracking
      (load_id, carrier_id, code, message, location, notes, latitude, longitude, event_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.loadId,
    carrierId,
    code.toUpperCase(),
    message,
    location || '',
    notes    || '',
    latitude  ?? null,
    longitude ?? null,
    nowStr(), nowStr(),
  );

  // Mirror to the load's timeline if it's a key status
  if (codeRow) {
    const STATUS_MAP = {
      X1: 'Picked Up', X6: 'In Transit', D1: 'Delivered', X3: 'Delivered',
    };
    const tlEvent = STATUS_MAP[code.toUpperCase()];
    if (tlEvent) {
      const load = db.prepare('SELECT * FROM loads WHERE id = ?').get(req.params.loadId);
      if (load) {
        const timeline = JSON.parse(load.timeline || '[]');
        const ev = timeline.find(t => t.event === tlEvent);
        if (ev && !ev.done) { ev.done = true; ev.time = nowStr(); }
        // Update load status
        const statusMap2 = { 'Picked Up': 'In Transit', 'In Transit': 'In Transit', 'Delivered': 'Delivered' };
        const newStatus = statusMap2[tlEvent];
        if (newStatus) {
          db.prepare('UPDATE loads SET status = ?, timeline = ? WHERE id = ?')
            .run(newStatus, JSON.stringify(timeline), req.params.loadId);
        } else {
          db.prepare('UPDATE loads SET timeline = ? WHERE id = ?')
            .run(JSON.stringify(timeline), req.params.loadId);
        }
      }
    }
  }

  res.status(201).json(db.prepare('SELECT * FROM carrier_tracking WHERE id = ?').get(lastInsertRowid));
});

// ── Load documents ────────────────────────────────────────────────────────────
// GET /api/carrier-portal/documents/:loadId
router.get('/documents/:loadId', requireAuth, (req, res) => {
  const rows = getDb()
    .prepare('SELECT * FROM load_documents WHERE load_id = ? ORDER BY created_at DESC')
    .all(req.params.loadId);
  res.json(rows);
});

// POST /api/carrier-portal/documents/:loadId — record a document (URL / name)
router.post('/documents/:loadId', requireAuth, (req, res) => {
  const { carrierId, docType, name, url, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const { lastInsertRowid } = getDb().prepare(`
    INSERT INTO load_documents (load_id, carrier_id, doc_type, name, url, notes, uploaded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.loadId,
    carrierId || '',
    docType   || 'Other',
    name,
    url       || '',
    notes     || '',
    req.user.name || '',
    nowStr(),
  );
  res.status(201).json(getDb().prepare('SELECT * FROM load_documents WHERE id = ?').get(lastInsertRowid));
});

// DELETE /api/carrier-portal/documents/:docId
router.delete('/documents/:docId', requireAuth, (req, res) => {
  getDb().prepare('DELETE FROM load_documents WHERE id = ?').run(req.params.docId);
  res.json({ ok: true });
});

// ── Disputes ──────────────────────────────────────────────────────────────────
// GET /api/carrier-portal/disputes?carrierId=xxx
router.get('/disputes', requireAuth, (req, res) => {
  const { carrierId, loadId } = req.query;
  let sql = 'SELECT * FROM carrier_disputes WHERE 1=1';
  const args = [];
  if (carrierId) { sql += ' AND carrier_id = ?'; args.push(carrierId); }
  if (loadId)    { sql += ' AND load_id = ?';    args.push(loadId); }
  sql += ' ORDER BY created_at DESC';
  res.json(getDb().prepare(sql).all(...args));
});

// POST /api/carrier-portal/disputes — submit dispute
router.post('/disputes', requireAuth, (req, res) => {
  const { loadId, carrierId, subject, description, disputeType } = req.body;
  if (!loadId || !carrierId || !subject) {
    return res.status(400).json({ error: 'loadId, carrierId, and subject required' });
  }
  const id = 'DSP-' + uuidv4().slice(0, 8).toUpperCase();
  getDb().prepare(`
    INSERT INTO carrier_disputes (id, load_id, carrier_id, subject, description, dispute_type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, loadId, carrierId, subject, description || '', disputeType || 'General', nowStr(), nowStr());
  res.status(201).json(getDb().prepare('SELECT * FROM carrier_disputes WHERE id = ?').get(id));
});

// PATCH /api/carrier-portal/disputes/:id — resolve dispute (admin)
router.patch('/disputes/:id', requireAuth, (req, res) => {
  const { status, resolution } = req.body;
  getDb().prepare('UPDATE carrier_disputes SET status = ?, resolution = ?, updated_at = ? WHERE id = ?')
    .run(status || 'Open', resolution || '', nowStr(), req.params.id);
  res.json(getDb().prepare('SELECT * FROM carrier_disputes WHERE id = ?').get(req.params.id));
});

module.exports = router;
