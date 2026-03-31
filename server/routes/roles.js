const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// All role endpoints require admin or super_admin
const adminOnly = [requireAuth, requireRole('admin', 'super_admin')];

// GET /api/roles  — list custom roles for market
router.get('/', requireAuth, (req, res) => {
  const mkt = req.query.market || req.user.market || 'kenya';
  const rows = getDb().prepare('SELECT * FROM custom_roles WHERE market = ? ORDER BY name').all(mkt);
  res.json(rows.map(r => ({ ...r, permissions: JSON.parse(r.permissions || '[]') })));
});

// POST /api/roles  — create custom role
router.post('/', ...adminOnly, (req, res) => {
  const { name, description, permissions, market } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const mkt = market || req.user.market || 'kenya';
  const id  = uuidv4();
  getDb().prepare(`
    INSERT INTO custom_roles (id, market, name, description, permissions, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, mkt, name.trim(), description || '', JSON.stringify(permissions || []), req.user.id);
  res.status(201).json(getDb().prepare('SELECT * FROM custom_roles WHERE id = ?').get(id));
});

// PUT /api/roles/:id  — update custom role
router.put('/:id', ...adminOnly, (req, res) => {
  const { name, description, permissions } = req.body;
  const role = getDb().prepare('SELECT * FROM custom_roles WHERE id = ?').get(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  getDb().prepare('UPDATE custom_roles SET name = ?, description = ?, permissions = ? WHERE id = ?')
    .run(name || role.name, description ?? role.description, JSON.stringify(permissions || []), req.params.id);
  res.json(getDb().prepare('SELECT * FROM custom_roles WHERE id = ?').get(req.params.id));
});

// DELETE /api/roles/:id  — delete custom role
router.delete('/:id', ...adminOnly, (req, res) => {
  const info = getDb().prepare('DELETE FROM custom_roles WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
