const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { one, all, run } = require('../lib/db');
const { requireAuth, requireRole, companyId } = require('../middleware/auth');

const adminOnly = [requireAuth, requireRole('admin', 'super_admin')];

// ---------------------------------------------------------------------------
// GET /  — list custom roles for the company / market
// ---------------------------------------------------------------------------
router.get('/', requireAuth, async (req, res) => {
  try {
    const mkt = req.query.market || req.user.market || 'kenya';
    const cid = companyId(req);

    let sql = 'SELECT * FROM custom_roles WHERE market = $1';
    const params = [mkt];

    if (cid) {
      sql += ' AND company_id = $2';
      params.push(cid);
    }

    sql += ' ORDER BY name';

    const rows = await all(sql, params);
    // permissions is JSONB — already a JS array, no JSON.parse needed
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /  — create a custom role
// ---------------------------------------------------------------------------
router.post('/', ...adminOnly, async (req, res) => {
  try {
    const { name, description, permissions, market } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    const mkt = market || req.user.market || 'kenya';
    const cid = companyId(req);
    const id = uuidv4();

    const row = await one(
      `INSERT INTO custom_roles (id, company_id, market, name, description, permissions, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        cid,
        mkt,
        name.trim(),
        description || '',
        permissions || [],   // JSONB — pass JS array directly
        req.user.sub,
      ]
    );

    res.status(201).json(row);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A role with that name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /:id  — replace a custom role
// ---------------------------------------------------------------------------
router.put('/:id', ...adminOnly, async (req, res) => {
  try {
    const cid = companyId(req);
    const cidFilter = cid ? ' AND company_id = $2' : '';
    const findParams = cid ? [req.params.id, cid] : [req.params.id];

    const role = await one(
      `SELECT * FROM custom_roles WHERE id = $1${cidFilter}`,
      findParams
    );
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const { name, description, permissions } = req.body;

    const updated = await one(
      `UPDATE custom_roles
          SET name = $1, description = $2, permissions = $3
        WHERE id = $4
        RETURNING *`,
      [
        name || role.name,
        description ?? role.description,
        permissions || [],   // JSONB — pass JS array directly
        req.params.id,
      ]
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id
// ---------------------------------------------------------------------------
router.delete('/:id', ...adminOnly, async (req, res) => {
  try {
    const cid = companyId(req);
    const cidFilter = cid ? ' AND company_id = $2' : '';
    const params = cid ? [req.params.id, cid] : [req.params.id];

    const result = await run(
      `DELETE FROM custom_roles WHERE id = $1${cidFilter}`,
      params
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
