const router = require('express').Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/analytics/event  — fire an event (fire-and-forget from client)
router.post('/event', requireAuth, (req, res) => {
  const { event, category = 'general', meta = {} } = req.body || {};
  if (!event) return res.status(400).json({ error: 'event required' });
  try {
    getDb().prepare(
      'INSERT INTO analytics_events (user_id, market, event, category, meta) VALUES (?,?,?,?,?)'
    ).run(req.user.sub, req.user.market || 'kenya', event, category, JSON.stringify(meta));
  } catch {}
  res.json({ ok: true });
});

// GET /api/analytics/summary?market=kenya&days=30
router.get('/summary', requireAuth, (req, res) => {
  const db     = getDb();
  const market = req.query.market || req.user.market || 'kenya';
  const days   = parseInt(req.query.days) || 30;
  const since  = new Date(Date.now() - days * 86400000).toISOString();

  // Events by category
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM analytics_events
    WHERE market = ? AND created_at >= ?
    GROUP BY category ORDER BY count DESC
  `).all(market, since);

  // Top events
  const topEvents = db.prepare(`
    SELECT event, COUNT(*) as count
    FROM analytics_events
    WHERE market = ? AND created_at >= ?
    GROUP BY event ORDER BY count DESC LIMIT 20
  `).all(market, since);

  // Daily active users (distinct users per day)
  const dauRows = db.prepare(`
    SELECT DATE(created_at) as day, COUNT(DISTINCT user_id) as users
    FROM analytics_events
    WHERE market = ? AND created_at >= ?
    GROUP BY day ORDER BY day DESC LIMIT 30
  `).all(market, since);

  // Page views per route
  const pageViews = db.prepare(`
    SELECT json_extract(meta, '$.page') as page, COUNT(*) as views
    FROM analytics_events
    WHERE market = ? AND category = 'navigation' AND created_at >= ?
    GROUP BY page ORDER BY views DESC
  `).all(market, since);

  // Total event count
  const { total } = db.prepare(
    `SELECT COUNT(*) as total FROM analytics_events WHERE market = ? AND created_at >= ?`
  ).get(market, since);

  // Active users (distinct users in period)
  const { activeUsers } = db.prepare(
    `SELECT COUNT(DISTINCT user_id) as activeUsers FROM analytics_events WHERE market = ? AND created_at >= ?`
  ).get(market, since);

  res.json({ byCategory, topEvents, dauRows, pageViews, total, activeUsers, days, market });
});

// GET /api/analytics/events?market=kenya&limit=100
router.get('/events', requireAuth, (req, res) => {
  const market = req.query.market || req.user.market || 'kenya';
  const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
  const rows = getDb().prepare(`
    SELECT ae.*, u.name as user_name
    FROM analytics_events ae
    LEFT JOIN users u ON u.id = ae.user_id
    WHERE ae.market = ? ORDER BY ae.created_at DESC LIMIT ?
  `).all(market, limit);
  res.json(rows.map(r => ({ ...r, meta: JSON.parse(r.meta || '{}') })));
});

module.exports = router;
