const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { one, run } = require('../lib/db');
const { SECRET, requireAuth } = require('../middleware/auth');

const ACCESS_TTL  = '8h';
const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

function signAccess(user) {
  const customPerms = Array.isArray(user.custom_perms) ? user.custom_perms : (user.custom_perms || []);
  return jwt.sign(
    {
      sub:        user.id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      avatar:     user.avatar,
      market:     user.market,
      companyId:  user.company_id || null,
      customRole: user.custom_role || '',
      customPerms: customPerms.length ? customPerms : undefined,
    },
    SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await one('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const accessToken  = signAccess(user);
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt    = new Date(Date.now() + REFRESH_TTL * 1000).toISOString();

    await run(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    const { password_hash, ...safeUser } = user;
    res.json({ accessToken, refreshToken, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const row = await one('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
    if (!row || new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await one('SELECT * FROM users WHERE id = $1', [row.user_id]);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken = signAccess(user);
    const { password_hash, ...safeUser } = user;
    res.json({ accessToken, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      await run('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await one(
      'SELECT id, name, email, role, avatar, market, company_id FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
