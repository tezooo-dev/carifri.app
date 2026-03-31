const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { getDb } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendWelcome } = require('../services/email');

const VALID_BUILT_IN_ROLES = ['admin', 'operations', 'super_admin'];

function safeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return {
    ...rest,
    customPerms: JSON.parse(rest.custom_perms || '[]'),
  };
}

// GET /api/users?market=kenya  — admin or super_admin
router.get('/', requireAuth, requireRole('admin', 'super_admin'), (req, res) => {
  const market = req.query.market || req.user.market;
  // super_admin can see all markets by passing market=all
  let rows;
  if (req.user.role === 'super_admin' && market === 'all') {
    rows = getDb().prepare('SELECT id, name, email, role, custom_role, custom_perms, avatar, market, created_at FROM users ORDER BY market, name').all();
  } else {
    rows = getDb().prepare('SELECT id, name, email, role, custom_role, custom_perms, avatar, market, created_at FROM users WHERE market = ? ORDER BY name').all(market);
  }
  res.json(rows.map(safeUser));
});

// POST /api/users  — admin or super_admin
router.post('/', requireAuth, requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const { name, email, password, role, customRole, customPerms, market, avatar } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

  // Validate role
  const finalRole = role || 'operations';
  if (!VALID_BUILT_IN_ROLES.includes(finalRole) && !customRole) {
    return res.status(400).json({ error: `role must be one of: ${VALID_BUILT_IN_ROLES.join(', ')}` });
  }
  // Only super_admin can create other super_admin accounts
  if (finalRole === 'super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only super admins can create super admin accounts' });
  }

  const id   = `u${Date.now()}`;
  const hash = bcrypt.hashSync(password, 10);
  const mkt  = market || req.user.market;
  const av   = avatar || name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const perms = JSON.stringify(customPerms || []);

  try {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, custom_role, custom_perms, avatar, market)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, email.toLowerCase().trim(), hash, finalRole, customRole || '', perms, av, mkt);

    const created = safeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
    sendWelcome({ name, email: email.toLowerCase().trim(), role: finalRole, market: mkt }).catch(() => {});
    res.status(201).json(created);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use' });
    throw err;
  }
});

// PUT /api/users/:id  — admin or super_admin
router.put('/:id', requireAuth, requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const { name, email, role, customRole, customPerms, market, avatar, password } = req.body || {};

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (role && !VALID_BUILT_IN_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_BUILT_IN_ROLES.join(', ')}` });
  }
  if ((role === 'super_admin' || user.role === 'super_admin') && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only super admins can modify super admin accounts' });
  }

  const newHash = password ? bcrypt.hashSync(password, 10) : user.password_hash;
  const perms   = customPerms ? JSON.stringify(customPerms) : user.custom_perms;

  try {
    db.prepare(`
      UPDATE users SET name=?, email=?, password_hash=?, role=?, custom_role=?, custom_perms=?, avatar=?, market=?
      WHERE id=?
    `).run(
      name           || user.name,
      (email         || user.email).toLowerCase().trim(),
      newHash,
      role           || user.role,
      customRole     !== undefined ? customRole : user.custom_role,
      perms,
      avatar         || user.avatar,
      market         || user.market,
      req.params.id,
    );
    res.json(safeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)));
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use' });
    throw err;
  }
});

// DELETE /api/users/:id  — admin or super_admin, cannot delete self
router.delete('/:id', requireAuth, requireRole('admin', 'super_admin'), (req, res) => {
  if (req.params.id === req.user.sub) return res.status(400).json({ error: 'Cannot delete your own account' });
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only super admins can delete super admin accounts' });
  }
  getDb().prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  getDb().prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
