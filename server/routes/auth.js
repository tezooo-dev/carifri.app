const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDb } = require('../db');
const { SECRET } = require('../middleware/auth');

const ACCESS_TTL  = '8h';
const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

function signAccess(user) {
  const customPerms = JSON.parse(user.custom_perms || '[]');
  return jwt.sign(
    {
      sub: user.id, name: user.name, email: user.email,
      role: user.role, avatar: user.avatar, market: user.market,
      customRole: user.custom_role || '',
      customPerms: customPerms.length ? customPerms : undefined,
    },
    SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const accessToken  = signAccess(user);
  const refreshToken = require('crypto').randomBytes(40).toString('hex');
  const expiresAt    = new Date(Date.now() + REFRESH_TTL * 1000).toISOString();

  db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, refreshToken, expiresAt);

  const { password_hash, ...safeUser } = user;
  res.json({ accessToken, refreshToken, user: safeUser });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  const db  = getDb();
  const row = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(refreshToken);
  if (!row || new Date(row.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const accessToken = signAccess(user);
  const { password_hash, ...safeUser } = user;
  res.json({ accessToken, user: safeUser });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) {
    getDb().prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  }
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').requireAuth, (req, res) => {
  const user = getDb().prepare('SELECT id, name, email, role, avatar, market FROM users WHERE id = ?').get(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
