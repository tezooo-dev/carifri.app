const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'freightlink-dev-secret-change-in-prod';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, SECRET);
    // companyId comes from JWT claim set in auth.js signAccess()
    // super_admin has companyId = null (cross-tenant access)
    next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ error: code });
  }
}

/**
 * requireRole('admin') or requireRole('admin', 'super_admin')
 * super_admin always passes any role check.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role === 'super_admin') return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

/**
 * Returns the company_id to use for DB scoping.
 * super_admin gets null → no WHERE company_id filter (cross-tenant).
 */
function companyId(req) {
  if (req.user?.role === 'super_admin') return null;
  return req.user?.companyId ?? null;
}

/**
 * Injects a WHERE clause fragment for company scoping.
 * Usage:
 *   const { clause, params } = companyClause(req, 1);
 *   // clause = 'company_id = $1' (or '' for super_admin)
 *   const rows = await all(`SELECT * FROM loads ${clause ? 'WHERE ' + clause : ''}`, params);
 */
function companyClause(req, startIndex = 1) {
  const cid = companyId(req);
  if (!cid) return { clause: '', params: [] };
  return { clause: `company_id = $${startIndex}`, params: [cid] };
}

module.exports = { requireAuth, requireRole, companyId, companyClause, SECRET };
