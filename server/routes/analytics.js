const router = require('express').Router();
const { one, all, run } = require('../lib/db');
const { requireAuth, companyId } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// POST /event  — fire-and-forget analytics event
// ---------------------------------------------------------------------------
router.post('/event', requireAuth, async (req, res) => {
  const { event, category = 'general', meta = {} } = req.body || {};
  if (!event) return res.status(400).json({ error: 'event required' });

  try {
    const cid = companyId(req);
    await run(
      `INSERT INTO analytics_events (company_id, user_id, market, event, category, meta)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [cid, req.user.sub, req.user.market || 'kenya', event, category, meta]
      // meta is JSONB — pass JS object directly
    );
  } catch {
    // intentionally swallow errors (fire-and-forget)
  }

  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GET /summary  — aggregated analytics for a market / time window
// ---------------------------------------------------------------------------
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const market = req.query.market || req.user.market || 'kenya';
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86_400_000);
    const cid = companyId(req);

    const companyFilter = cid ? ' AND company_id = $3' : '';
    const baseParams = cid ? [market, since, cid] : [market, since];

    const [byCategory, topEvents, dauRows, pageViews, totalRow, activeUsersRow] =
      await Promise.all([
        all(
          `SELECT category, COUNT(*) AS count
             FROM analytics_events
            WHERE market = $1 AND created_at >= $2${companyFilter}
            GROUP BY category
            ORDER BY count DESC`,
          baseParams
        ),
        all(
          `SELECT event, COUNT(*) AS count
             FROM analytics_events
            WHERE market = $1 AND created_at >= $2${companyFilter}
            GROUP BY event
            ORDER BY count DESC
            LIMIT 20`,
          baseParams
        ),
        all(
          `SELECT created_at::date AS day, COUNT(DISTINCT user_id) AS users
             FROM analytics_events
            WHERE market = $1 AND created_at >= $2${companyFilter}
            GROUP BY created_at::date
            ORDER BY day DESC
            LIMIT 30`,
          baseParams
        ),
        all(
          `SELECT meta->>'page' AS page, COUNT(*) AS views
             FROM analytics_events
            WHERE market = $1 AND created_at >= $2${companyFilter}
              AND category = 'navigation'
            GROUP BY meta->>'page'
            ORDER BY views DESC`,
          baseParams
        ),
        one(
          `SELECT COUNT(*) AS total
             FROM analytics_events
            WHERE market = $1 AND created_at >= $2${companyFilter}`,
          baseParams
        ),
        one(
          `SELECT COUNT(DISTINCT user_id) AS active_users
             FROM analytics_events
            WHERE market = $1 AND created_at >= $2${companyFilter}`,
          baseParams
        ),
      ]);

    res.json({
      byCategory,
      topEvents,
      dauRows,
      pageViews,
      total: Number(totalRow.total),
      activeUsers: Number(activeUsersRow.active_users),
      days,
      market,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /events  — raw recent events (for admin dashboards)
// ---------------------------------------------------------------------------
router.get('/events', requireAuth, async (req, res) => {
  try {
    const market = req.query.market || req.user.market || 'kenya';
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const cid = companyId(req);

    const companyFilter = cid ? ' AND ae.company_id = $3' : '';
    const params = cid ? [market, limit, cid] : [market, limit];

    const rows = await all(
      `SELECT ae.*, u.name AS user_name
         FROM analytics_events ae
         LEFT JOIN users u ON u.id = ae.user_id
        WHERE ae.market = $1${companyFilter}
        ORDER BY ae.created_at DESC
        LIMIT $2`,
      params
    );

    // meta is JSONB — comes back as a parsed JS object, no JSON.parse needed
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
