const router  = require('express').Router();
const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const { getDb } = require('../db');
const { sendPasswordReset } = require('../services/email');

const APP_URL = () => process.env.APP_URL || 'http://localhost:5173';
const TTL_MS  = 60 * 60 * 1000; // 1 hour

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  // Always return OK to prevent email enumeration
  if (!user) return res.json({ ok: true });

  // Invalidate any existing reset tokens for this user
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?,?,?)')
    .run(user.id, token, expiresAt);

  const resetUrl = `${APP_URL()}/reset-password?token=${token}`;

  await sendPasswordReset({ name: user.name, email: user.email, resetUrl });

  console.log(`🔑 Password reset link for ${user.email}: ${resetUrl}`);
  res.json({ ok: true });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db  = getDb();
  const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token);

  if (!row) return res.status(400).json({ error: 'Invalid or expired reset link' });
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token);
    return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(row.user_id);
  // Invalidate all sessions
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(row.user_id);

  res.json({ ok: true, message: 'Password updated. Please sign in with your new password.' });
});

// GET /api/auth/verify-reset-token?token=xxx  — check if token is still valid
router.get('/verify-reset-token', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false });
  const row = getDb().prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token);
  if (!row || new Date(row.expires_at) < new Date()) return res.json({ valid: false });
  res.json({ valid: true });
});

module.exports = router;
