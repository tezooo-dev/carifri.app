const router  = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// ── helpers ───────────────────────────────────────────────────────────────────
function parseTicket(row) {
  if (!row) return null;
  return {
    ...row,
    attachments: JSON.parse(row.attachments || '[]'),
  };
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// ── GET /api/tickets  — list (auth required, filtered by market) ──────────────
router.get('/', requireAuth, (req, res) => {
  const { market, status, category, priority, q } = req.query;
  const mkt  = market || req.user.market || 'kenya';
  let   sql  = 'SELECT * FROM tickets WHERE market = ?';
  const args = [mkt];

  if (status)   { sql += ' AND status = ?';   args.push(status);   }
  if (category) { sql += ' AND category = ?'; args.push(category); }
  if (priority) { sql += ' AND priority = ?'; args.push(priority); }
  if (q) {
    sql += ' AND (title LIKE ? OR submitter_name LIKE ? OR submitter_email LIKE ?)';
    const like = `%${q}%`;
    args.push(like, like, like);
  }
  sql += ' ORDER BY created_at DESC';
  res.json(getDb().prepare(sql).all(...args).map(parseTicket));
});

// ── GET /api/tickets/stats  — summary counts ─────────────────────────────────
router.get('/stats', requireAuth, (req, res) => {
  const mkt = req.query.market || req.user.market || 'kenya';
  const db  = getDb();
  const byStatus   = db.prepare("SELECT status, COUNT(*) as count FROM tickets WHERE market = ? GROUP BY status").all(mkt);
  const byCategory = db.prepare("SELECT category, COUNT(*) as count FROM tickets WHERE market = ? GROUP BY category").all(mkt);
  const byPriority = db.prepare("SELECT priority, COUNT(*) as count FROM tickets WHERE market = ? GROUP BY priority").all(mkt);
  const total      = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE market = ?").get(mkt).c;
  const openCritical = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE market = ? AND status IN ('Open','In Progress') AND priority = 'Critical'").get(mkt).c;
  res.json({ total, openCritical, byStatus, byCategory, byPriority });
});

// ── GET /api/tickets/:id  — detail + comments ────────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
  const ticket = getDb().prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const comments = getDb().prepare('SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ ...parseTicket(ticket), comments });
});

// ── POST /api/tickets  — create (auth required — ops or admin) ────────────────
router.post('/', requireAuth, (req, res) => {
  const {
    title, description, category, priority,
    submitterName, submitterEmail, submitterType, submitterRef,
    loadRef, market,
  } = req.body;

  if (!title?.trim() || !submitterName?.trim()) {
    return res.status(400).json({ error: 'title and submitter name are required' });
  }

  const mkt = market || req.user.market || 'kenya';
  const id  = 'TKT-' + uuidv4().slice(0, 8).toUpperCase();

  getDb().prepare(`
    INSERT INTO tickets (id, market, title, description, category, priority,
      submitter_name, submitter_email, submitter_type, submitter_ref, load_ref, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, mkt,
    title.trim(), (description || '').trim(),
    category     || 'Support',
    priority     || 'Medium',
    submitterName.trim(),
    (submitterEmail || '').trim(),
    submitterType || 'carrier',
    submitterRef  || '',
    loadRef       || '',
    now(), now()
  );

  res.status(201).json(parseTicket(getDb().prepare('SELECT * FROM tickets WHERE id = ?').get(id)));
});

// ── PATCH /api/tickets/:id  — update status / assignment / priority ───────────
router.patch('/:id', requireAuth, (req, res) => {
  const { status, assignedTo, priority } = req.body;
  const ticket = getDb().prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const newStatus    = status     ?? ticket.status;
  const newAssigned  = assignedTo !== undefined ? assignedTo : ticket.assigned_to;
  const newPriority  = priority   ?? ticket.priority;
  const resolvedAt   = newStatus === 'Resolved' || newStatus === 'Closed' ? now() : ticket.resolved_at;

  getDb().prepare(`
    UPDATE tickets SET status = ?, assigned_to = ?, priority = ?, resolved_at = ?, updated_at = ? WHERE id = ?
  `).run(newStatus, newAssigned, newPriority, resolvedAt || '', now(), req.params.id);

  res.json(parseTicket(getDb().prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id)));
});

// ── DELETE /api/tickets/:id  — admin only ─────────────────────────────────────
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const info = getDb().prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// ── POST /api/tickets/:id/comments  — add comment / reply ────────────────────
router.post('/:id/comments', requireAuth, (req, res) => {
  const { body, isInternal } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'body is required' });

  const ticket = getDb().prepare('SELECT id FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const result = getDb().prepare(`
    INSERT INTO ticket_comments (ticket_id, author_id, author_name, author_role, body, is_internal, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    req.user.id,
    req.user.name,
    req.user.role,
    body.trim(),
    isInternal ? 1 : 0,
    now()
  );

  // bump updated_at
  getDb().prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(now(), req.params.id);

  res.status(201).json(getDb().prepare('SELECT * FROM ticket_comments WHERE id = ?').get(result.lastInsertRowid));
});

// ── Public submit endpoint — no auth, for external portals ────────────────────
// POST /api/tickets/public  — carrier / vendor can submit without login
router.post('/public', (req, res) => {
  const {
    title, description, category, priority,
    submitterName, submitterEmail, submitterType, submitterRef,
    loadRef, market, accessKey,
  } = req.body;

  // Basic spam gate: require a known access key env var if set
  const GATE = process.env.PUBLIC_TICKET_KEY;
  if (GATE && accessKey !== GATE) {
    return res.status(403).json({ error: 'Invalid access key' });
  }

  if (!title?.trim() || !submitterName?.trim() || !submitterEmail?.trim()) {
    return res.status(400).json({ error: 'title, name and email are required' });
  }

  const mkt = market || 'kenya';
  const id  = 'TKT-' + uuidv4().slice(0, 8).toUpperCase();

  getDb().prepare(`
    INSERT INTO tickets (id, market, title, description, category, priority,
      submitter_name, submitter_email, submitter_type, submitter_ref, load_ref, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, mkt,
    title.trim(), (description || '').trim(),
    category     || 'Support',
    priority     || 'Medium',
    submitterName.trim(),
    submitterEmail.trim(),
    submitterType || 'carrier',
    submitterRef  || '',
    loadRef       || '',
    now(), now()
  );

  res.status(201).json({ id, message: 'Ticket submitted successfully. Our team will contact you shortly.' });
});

module.exports = router;
