const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { getDb } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

function safeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

// GET /api/users?market=kenya  — admin only
router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  const market = req.query.market || req.user.market;
  const rows = getDb()
    .prepare('SELECT id, name, email, role, avatar, market, created_at FROM users WHERE market = ? ORDER BY name')
    .all(market);
  res.json(rows);
});

// POST /api/users  — admin only
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { name, email, password, role, market, avatar } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  if (!['admin', 'operations'].includes(role)) return res.status(400).json({ error: 'role must be admin or operations' });

  const id   = `u${Date.now()}`;
  const hash = bcrypt.hashSync(password, 10);
  const mkt  = market || req.user.market;
  const av   = avatar || name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  try {
    db.prepare(`INSERT INTO users (id, name, email, password_hash, role, avatar, market) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name, email.toLowerCase().trim(), hash, role, av, mkt);
    res.status(201).json(safeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id)));
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use' });
    throw err;
  }
});

// PUT /api/users/:id  — admin only
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { name, email, role, market, avatar, password } = req.body || {};
  if (role && !['admin', 'operations'].includes(role)) return res.status(400).json({ error: 'role must be admin or operations' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newHash = password ? bcrypt.hashSync(password, 10) : user.password_hash;
  try {
    db.prepare(`UPDATE users SET name=?, email=?, password_hash=?, role=?, avatar=?, market=? WHERE id=?`)
      .run(
        name  || user.name,
        (email || user.email).toLowerCase().trim(),
        newHash,
        role   || user.role,
        avatar || user.avatar,
        market || user.market,
        req.params.id,
      );
    res.json(safeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)));
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use' });
    throw err;
  }
});

// DELETE /api/users/:id  — admin only, cannot delete self
router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  if (req.params.id === req.user.sub) return res.status(400).json({ error: 'Cannot delete your own account' });
  getDb().prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  getDb().prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
