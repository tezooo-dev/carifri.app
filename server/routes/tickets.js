const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { one, all, run } = require('../lib/db');
const { requireAuth, requireRole, companyId } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// GET /  — list tickets with optional filters
// ---------------------------------------------------------------------------
router.get('/', requireAuth, async (req, res) => {
  try {
    const { market, status, category, priority, q } = req.query;
    const mkt = market || req.user.market || 'kenya';
    const cid = companyId(req);

    const conditions = ['market = $1'];
    const params = [mkt];
    let idx = 2;

    if (cid) {
      conditions.push(`company_id = $${idx++}`);
      params.push(cid);
    }
    if (status) {
      conditions.push(`status = $${idx++}`);
      params.push(status);
    }
    if (category) {
      conditions.push(`category = $${idx++}`);
      params.push(category);
    }
    if (priority) {
      conditions.push(`priority = $${idx++}`);
      params.push(priority);
    }
    if (q) {
      const like = `%${q}%`;
      conditions.push(
        `(title ILIKE $${idx} OR submitter_name ILIKE $${idx + 1} OR submitter_email ILIKE $${idx + 2})`
      );
      params.push(like, like, like);
      idx += 3;
    }

    const sql = `SELECT * FROM tickets WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
    const rows = await all(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /stats
// ---------------------------------------------------------------------------
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const mkt = req.query.market || req.user.market || 'kenya';
    const cid = companyId(req);

    const companyFilter = cid ? ' AND company_id = $2' : '';
    const baseParams = cid ? [mkt, cid] : [mkt];

    const [byStatus, byCategory, byPriority, totalRow, openCriticalRow] = await Promise.all([
      all(
        `SELECT status, COUNT(*) AS count FROM tickets WHERE market = $1${companyFilter} GROUP BY status`,
        baseParams
      ),
      all(
        `SELECT category, COUNT(*) AS count FROM tickets WHERE market = $1${companyFilter} GROUP BY category`,
        baseParams
      ),
      all(
        `SELECT priority, COUNT(*) AS count FROM tickets WHERE market = $1${companyFilter} GROUP BY priority`,
        baseParams
      ),
      one(
        `SELECT COUNT(*) AS c FROM tickets WHERE market = $1${companyFilter}`,
        baseParams
      ),
      one(
        `SELECT COUNT(*) AS c FROM tickets WHERE market = $1${companyFilter} AND status IN ('Open','In Progress') AND priority = 'Critical'`,
        baseParams
      ),
    ]);

    res.json({
      total: Number(totalRow.c),
      openCritical: Number(openCriticalRow.c),
      byStatus,
      byCategory,
      byPriority,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /:id  — single ticket with comments
// ---------------------------------------------------------------------------
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const cidFilter = cid ? ' AND company_id = $2' : '';
    const ticketParams = cid ? [req.params.id, cid] : [req.params.id];

    const ticket = await one(
      `SELECT * FROM tickets WHERE id = $1${cidFilter}`,
      ticketParams
    );
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const comments = await all(
      'SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ ...ticket, comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /public  — unauthenticated ticket submission (must be before POST /)
// ---------------------------------------------------------------------------
router.post('/public', async (req, res) => {
  try {
    const {
      title, description, category, priority,
      submitterName, submitterEmail, submitterType, submitterRef, loadRef,
      market, accessKey,
    } = req.body;

    const GATE = process.env.PUBLIC_TICKET_KEY;
    if (GATE && accessKey !== GATE) {
      return res.status(403).json({ error: 'Invalid access key' });
    }

    if (!title?.trim() || !submitterName?.trim() || !submitterEmail?.trim()) {
      return res.status(400).json({ error: 'title, name and email are required' });
    }

    const mkt = market || 'kenya';
    const id = 'TKT-' + uuidv4().slice(0, 8).toUpperCase();

    await run(
      `INSERT INTO tickets
         (id, company_id, market, title, description, category, priority,
          submitter_name, submitter_email, submitter_type, submitter_ref, load_ref,
          created_at, updated_at)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        id, mkt,
        title.trim(),
        (description || '').trim(),
        category || 'Support',
        priority || 'Medium',
        submitterName.trim(),
        submitterEmail.trim(),
        submitterType || 'carrier',
        submitterRef || '',
        loadRef || '',
      ]
    );

    res.status(201).json({
      id,
      message: 'Ticket submitted successfully. Our team will contact you shortly.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /  — create ticket (authenticated)
// ---------------------------------------------------------------------------
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, description, category, priority,
      submitterName, submitterEmail, submitterType, submitterRef, loadRef, market,
    } = req.body;

    if (!title?.trim() || !submitterName?.trim()) {
      return res.status(400).json({ error: 'title and submitter name are required' });
    }

    const mkt = market || req.user.market || 'kenya';
    const cid = companyId(req);
    const id = 'TKT-' + uuidv4().slice(0, 8).toUpperCase();

    const row = await one(
      `INSERT INTO tickets
         (id, company_id, market, title, description, category, priority,
          submitter_name, submitter_email, submitter_type, submitter_ref, load_ref,
          created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [
        id, cid, mkt,
        title.trim(),
        (description || '').trim(),
        category || 'Support',
        priority || 'Medium',
        submitterName.trim(),
        (submitterEmail || '').trim(),
        submitterType || 'carrier',
        submitterRef || '',
        loadRef || '',
      ]
    );

    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /:id  — update status / assignee / priority
// ---------------------------------------------------------------------------
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const cid = companyId(req);
    const cidFilter = cid ? ' AND company_id = $2' : '';
    const ticketParams = cid ? [req.params.id, cid] : [req.params.id];

    const ticket = await one(
      `SELECT * FROM tickets WHERE id = $1${cidFilter}`,
      ticketParams
    );
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const { status, assignedTo, priority } = req.body;
    const newStatus = status ?? ticket.status;
    const newAssigned = assignedTo !== undefined ? assignedTo : ticket.assigned_to;
    const newPriority = priority ?? ticket.priority;
    const resolvedAt =
      newStatus === 'Resolved' || newStatus === 'Closed'
        ? new Date()
        : ticket.resolved_at;

    const updated = await one(
      `UPDATE tickets
          SET status = $1, assigned_to = $2, priority = $3,
              resolved_at = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *`,
      [newStatus, newAssigned, newPriority, resolvedAt || null, req.params.id]
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id
// ---------------------------------------------------------------------------
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const cid = companyId(req);
    const cidFilter = cid ? ' AND company_id = $2' : '';
    const params = cid ? [req.params.id, cid] : [req.params.id];

    const result = await run(
      `DELETE FROM tickets WHERE id = $1${cidFilter}`,
      params
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /:id/comments
// ---------------------------------------------------------------------------
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { body, isInternal } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'body is required' });

    const cid = companyId(req);
    const cidFilter = cid ? ' AND company_id = $2' : '';
    const ticketParams = cid ? [req.params.id, cid] : [req.params.id];

    const ticket = await one(
      `SELECT id FROM tickets WHERE id = $1${cidFilter}`,
      ticketParams
    );
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const comment = await one(
      `INSERT INTO ticket_comments
         (ticket_id, author_id, author_name, author_role, body, is_internal, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        req.params.id,
        req.user.sub,
        req.user.name,
        req.user.role,
        body.trim(),
        isInternal ? true : false,
      ]
    );

    await run('UPDATE tickets SET updated_at = NOW() WHERE id = $1', [req.params.id]);

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
