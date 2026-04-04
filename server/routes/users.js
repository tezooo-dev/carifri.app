const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { one, all, run } = require('../lib/db');
const { requireAuth, requireRole, companyId } = require('../middleware/auth');
const { sendWelcome } = require('../services/email');

const VALID_BUILT_IN_ROLES = ['admin', 'operations', 'super_admin'];

function safeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  // custom_perms is JSONB — already a JS array, no JSON.parse needed
  return {
    ...rest,
    customPerms: Array.isArray(rest.custom_perms) ? rest.custom_perms : (rest.custom_perms || []),
  };
}

// GET /api/users?market=kenya  — admin or super_admin
router.get('/', requireAuth, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const market = req.query.market;
    const SELECT = 'SELECT id, name, email, role, custom_role, custom_perms, avatar, market, company_id, created_at FROM users';

    let rows;
    if (req.user.role === 'super_admin') {
      if (!market || market === 'all') {
        // super_admin with no filter or explicit 'all' — return every user
        rows = await all(`${SELECT} ORDER BY market, name`, []);
      } else {
        // super_admin filtering by a specific market
        rows = await all(`${SELECT} WHERE market = $1 ORDER BY name`, [market]);
      }
    } else {
      // admin / operations — always scoped to their company
      const cid = companyId(req);
      if (market) {
        rows = await all(`${SELECT} WHERE company_id = $1 AND market = $2 ORDER BY name`, [cid, market]);
      } else {
        rows = await all(`${SELECT} WHERE company_id = $1 ORDER BY name`, [cid]);
      }
    }

    res.json(rows.map(safeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users  — admin or super_admin
router.post('/', requireAuth, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, email, password, role, customRole, customPerms, market, avatar } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

    const finalRole = role || 'operations';
    if (!VALID_BUILT_IN_ROLES.includes(finalRole) && !customRole) {
      return res.status(400).json({ error: `role must be one of: ${VALID_BUILT_IN_ROLES.join(', ')}` });
    }
    if (finalRole === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create super admin accounts' });
    }

    const id   = `u${Date.now()}`;
    const hash = await bcrypt.hash(password, 10);
    const mkt  = market || req.user.market;
    const av   = avatar || name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const perms = JSON.stringify(customPerms || []);
    const cid  = companyId(req);

    const result = await run(
      `INSERT INTO users (id, name, email, password_hash, role, custom_role, custom_perms, avatar, market, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
       RETURNING *`,
      [id, name, email.toLowerCase().trim(), hash, finalRole, customRole || '', perms, av, mkt, cid]
    );

    const created = safeUser(result.rows[0]);
    sendWelcome({ name, email: email.toLowerCase().trim(), role: finalRole, market: mkt }).catch(() => {});
    res.status(201).json(created);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id  — admin or super_admin
router.put('/:id', requireAuth, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, email, role, customRole, customPerms, market, avatar, password } = req.body || {};

    const user = await one('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (role && !VALID_BUILT_IN_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_BUILT_IN_ROLES.join(', ')}` });
    }
    if ((role === 'super_admin' || user.role === 'super_admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can modify super admin accounts' });
    }

    const newHash  = password ? await bcrypt.hash(password, 10) : user.password_hash;
    // custom_perms is JSONB — if caller sends new perms use those, otherwise keep existing (already a JS value)
    const newPerms = customPerms !== undefined ? JSON.stringify(customPerms) : JSON.stringify(user.custom_perms || []);

    const result = await run(
      `UPDATE users
       SET name          = $1,
           email         = $2,
           password_hash = $3,
           role          = $4,
           custom_role   = $5,
           custom_perms  = $6::jsonb,
           avatar        = $7,
           market        = $8
       WHERE id = $9
       RETURNING *`,
      [
        name       || user.name,
        (email     || user.email).toLowerCase().trim(),
        newHash,
        role       || user.role,
        customRole !== undefined ? customRole : user.custom_role,
        newPerms,
        avatar     || user.avatar,
        market     || user.market,
        req.params.id,
      ]
    );

    res.json(safeUser(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id  — admin or super_admin, cannot delete self
router.delete('/:id', requireAuth, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.sub) return res.status(400).json({ error: 'Cannot delete your own account' });

    const user = await one('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can delete super admin accounts' });
    }

    await run('DELETE FROM refresh_tokens WHERE user_id = $1', [req.params.id]);
    await run('DELETE FROM users WHERE id = $1', [req.params.id]);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
