/**
 * Carrier Portal API — migrated to PostgreSQL (pg)
 */
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { one, all, run } = require('../lib/db');
const { requireAuth } = require('../middleware/auth');

// ── Tracking code reference ────────────────────────────────────────────────────
router.get('/tracking-codes', requireAuth, async (req, res) => {
  try {
    const { category, q } = req.query;
    let sql = 'SELECT * FROM tracking_codes';
    const params = [];
    if (category) {
      sql += ' WHERE category = $1';
      params.push(category);
    } else if (q) {
      sql += ' WHERE code ILIKE $1 OR message ILIKE $1';
      params.push(`%${q}%`);
    }
    sql += ' ORDER BY category, code';
    res.json(await all(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tracking-codes/:code', requireAuth, async (req, res) => {
  try {
    const row = await one('SELECT * FROM tracking_codes WHERE code = $1', [req.params.code.toUpperCase()]);
    if (!row) return res.status(404).json({ error: 'Tracking code not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/tracking-codes', requireAuth, async (req, res) => {
  try {
    const { code, category, message, description, isTerminal } = req.body;
    if (!code || !message) return res.status(400).json({ error: 'code and message required' });
    await run(
      'INSERT INTO tracking_codes (code, category, message, description, is_terminal) VALUES ($1,$2,$3,$4,$5) ON CONFLICT(code) DO NOTHING',
      [code.toUpperCase(), category || 'Status', message, description || '', isTerminal ? true : false]
    );
    res.status(201).json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Carrier loads ─────────────────────────────────────────────────────────────
router.get('/loads', requireAuth, async (req, res) => {
  try {
    const { carrierId, market } = req.query;
    if (!carrierId) return res.status(400).json({ error: 'carrierId required' });
    const mkt = market || req.user.market || 'kenya';
    const rows = await all(
      `SELECT l.*, c.name as carrier_name
       FROM loads l
       JOIN carriers c ON c.id = l.carrier_id
       WHERE l.carrier_id = $1 AND l.market = $2
       ORDER BY l.created_at DESC`,
      [carrierId, mkt]
    );
    // timeline and accessorials are JSONB — already parsed
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Carrier tracking events ───────────────────────────────────────────────────
router.get('/tracking/:loadId', requireAuth, async (req, res) => {
  try {
    const rows = await all(
      'SELECT * FROM carrier_tracking WHERE load_id = $1 ORDER BY event_time ASC',
      [req.params.loadId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/tracking/:loadId', requireAuth, async (req, res) => {
  try {
    const { carrierId, code, location, notes, latitude, longitude } = req.body;
    if (!carrierId || !code) return res.status(400).json({ error: 'carrierId and code required' });

    const codeRow = await one('SELECT * FROM tracking_codes WHERE code = $1', [code.toUpperCase()]);
    const message = codeRow ? codeRow.message : code;

    const result = await run(
      `INSERT INTO carrier_tracking
        (load_id, carrier_id, code, message, location, notes, latitude, longitude, event_time, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       RETURNING *`,
      [req.params.loadId, carrierId, code.toUpperCase(), message, location || '', notes || '', latitude ?? null, longitude ?? null]
    );
    const inserted = result.rows[0];

    // Mirror key status codes to load timeline
    if (codeRow) {
      const STATUS_MAP = { X1: 'Picked Up', X6: 'In Transit', D1: 'Delivered', X3: 'Delivered' };
      const tlEvent = STATUS_MAP[code.toUpperCase()];
      if (tlEvent) {
        const load = await one('SELECT * FROM loads WHERE id = $1', [req.params.loadId]);
        if (load) {
          const timeline = Array.isArray(load.timeline) ? load.timeline : [];
          const ev = timeline.find(t => t.event === tlEvent);
          const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
          if (ev && !ev.done) { ev.done = true; ev.time = nowStr; }
          const statusMap2 = { 'Picked Up': 'In Transit', 'In Transit': 'In Transit', 'Delivered': 'Delivered' };
          const newStatus = statusMap2[tlEvent];
          if (newStatus) {
            await run('UPDATE loads SET status = $1, timeline = $2 WHERE id = $3', [newStatus, JSON.stringify(timeline), req.params.loadId]);
          } else {
            await run('UPDATE loads SET timeline = $1 WHERE id = $2', [JSON.stringify(timeline), req.params.loadId]);
          }
        }
      }
    }

    res.status(201).json(inserted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Load documents ────────────────────────────────────────────────────────────
router.get('/documents/:loadId', requireAuth, async (req, res) => {
  try {
    const rows = await all(
      'SELECT * FROM load_documents WHERE load_id = $1 ORDER BY created_at DESC',
      [req.params.loadId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/documents/:loadId', requireAuth, async (req, res) => {
  try {
    const { carrierId, docType, name, url, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = await run(
      `INSERT INTO load_documents (load_id, carrier_id, doc_type, name, url, notes, uploaded_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [req.params.loadId, carrierId || '', docType || 'Other', name, url || '', notes || '', req.user.name || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/documents/:docId', requireAuth, async (req, res) => {
  try {
    await run('DELETE FROM load_documents WHERE id = $1', [req.params.docId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Disputes ──────────────────────────────────────────────────────────────────
router.get('/disputes', requireAuth, async (req, res) => {
  try {
    const { carrierId, loadId } = req.query;
    const conditions = [];
    const params = [];
    if (carrierId) { params.push(carrierId); conditions.push(`carrier_id = $${params.length}`); }
    if (loadId)    { params.push(loadId);    conditions.push(`load_id = $${params.length}`); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const rows = await all(`SELECT * FROM carrier_disputes ${where} ORDER BY created_at DESC`, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/disputes', requireAuth, async (req, res) => {
  try {
    const { loadId, carrierId, subject, description, disputeType } = req.body;
    if (!loadId || !carrierId || !subject) {
      return res.status(400).json({ error: 'loadId, carrierId, and subject required' });
    }
    const id = 'DSP-' + uuidv4().slice(0, 8).toUpperCase();
    const result = await run(
      `INSERT INTO carrier_disputes (id, load_id, carrier_id, subject, description, dispute_type, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
      [id, loadId, carrierId, subject, description || '', disputeType || 'General']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/disputes/:id', requireAuth, async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const result = await run(
      'UPDATE carrier_disputes SET status=$1, resolution=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [status || 'Open', resolution || '', req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Dispute not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
