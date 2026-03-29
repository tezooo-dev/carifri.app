const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'freightlink-dev-secret-change-in-prod';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ error: code });
  }
}

// requireRole('admin') or requireRole('admin','operations') — must come after requireAuth
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: insufficient role' });
    next();
  };
}

module.exports = { requireAuth, requireRole, SECRET };
