/**
 * /api/companies  — super_admin tenant management
 *
 * All endpoints require requireAuth + requireRole('super_admin').
 * These routes manage the top-level company (tenant) records for the
 * FreightLink multi-tenant deployment.
 */

const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { one, all, run, withTransaction } = require('../lib/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const superAdminOnly = [requireAuth, requireRole('super_admin')];

// Market-specific defaults used when bootstrapping a new company's settings
const MARKET_DEFAULTS = {
  kenya:  { currency: 'KES', country: 'Kenya' },
  india:  { currency: 'INR', country: 'India' },
  canada: { currency: 'CAD', country: 'Canada' },
  us:     { currency: 'USD', country: 'United States' },
};

// ---------------------------------------------------------------------------
// GET /  — list all companies with user count and subscription status
// ---------------------------------------------------------------------------
router.get('/', ...superAdminOnly, async (req, res) => {
  try {
    const rows = await all(
      `SELECT
         c.id,
         c.name,
         c.slug,
         c.market,
         c.status,
         c.created_at,
         s.plan,
         s.status AS sub_status,
         COUNT(u.id)::int AS user_count
       FROM companies c
       LEFT JOIN subscriptions s ON s.company_id = c.id
       LEFT JOIN users u ON u.company_id = c.id
       GROUP BY c.id, c.name, c.slug, c.market, c.status, c.created_at,
                s.plan, s.status
       ORDER BY c.created_at DESC`
    );

    res.json(
      rows.map((r) => ({
        id:         r.id,
        name:       r.name,
        slug:       r.slug,
        market:     r.market,
        status:     r.status,
        created_at: r.created_at,
        plan:       r.plan || 'trial',
        subStatus:  r.sub_status || null,
        userCount:  r.user_count,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /  — create a new company + first admin user (transactional)
// ---------------------------------------------------------------------------
router.post('/', ...superAdminOnly, async (req, res) => {
  try {
    const { name, slug, market, adminName, adminEmail, adminPassword } = req.body;

    if (!name?.trim())          return res.status(400).json({ error: 'name is required' });
    if (!slug?.trim())          return res.status(400).json({ error: 'slug is required' });
    if (!adminEmail?.trim())    return res.status(400).json({ error: 'adminEmail is required' });
    if (!adminPassword?.trim()) return res.status(400).json({ error: 'adminPassword is required' });

    const mkt = (market || 'kenya').toLowerCase();
    const marketDefaults = MARKET_DEFAULTS[mkt] || MARKET_DEFAULTS.kenya;

    const result = await withTransaction(async (client) => {
      // 1. Create company
      const companyId = `co${Date.now()}`;
      const { rows: companyRows } = await client.query(
        `INSERT INTO companies (id, name, slug, market, status, created_at)
         VALUES ($1, $2, $3, $4, 'active', NOW())
         RETURNING *`,
        [companyId, name.trim(), slug.trim().toLowerCase(), mkt]
      );
      const company = companyRows[0];

      // 2. Bootstrap settings record
      await client.query(
        `INSERT INTO settings (company_id, company_name, market, currency, country)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (company_id) DO NOTHING`,
        [
          companyId,
          name.trim(),
          mkt,
          marketDefaults.currency,
          marketDefaults.country,
        ]
      );

      // 3. Create the initial admin user
      const userId = `u${Date.now()}`;
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const { rows: userRows } = await client.query(
        `INSERT INTO users
           (id, company_id, name, email, password_hash, role, market, created_at)
         VALUES ($1, $2, $3, $4, $5, 'admin', $6, NOW())
         RETURNING id, company_id, name, email, role, market, created_at`,
        [
          userId,
          companyId,
          (adminName || adminEmail).trim(),
          adminEmail.trim().toLowerCase(),
          passwordHash,
          mkt,
        ]
      );
      const adminUser = userRows[0];

      return { company, adminUser };
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A company with that slug or email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /:id  — company detail with users list and subscription
// ---------------------------------------------------------------------------
router.get('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const company = await one(
      'SELECT * FROM companies WHERE id = $1',
      [req.params.id]
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const [users, subscription] = await Promise.all([
      all(
        `SELECT id, company_id, name, email, role, market, created_at
           FROM users
          WHERE company_id = $1
          ORDER BY created_at ASC`,
        [req.params.id]
      ),
      one(
        'SELECT * FROM subscriptions WHERE company_id = $1',
        [req.params.id]
      ),
    ]);

    res.json({ ...company, users, subscription: subscription || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /:id  — update company name, plan override, or status
// ---------------------------------------------------------------------------
router.patch('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const company = await one(
      'SELECT * FROM companies WHERE id = $1',
      [req.params.id]
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const { name, status } = req.body;
    const newName   = name   ?? company.name;
    const newStatus = status ?? company.status;

    const updated = await one(
      `UPDATE companies
          SET name = $1, status = $2
        WHERE id = $3
        RETURNING *`,
      [newName, newStatus, req.params.id]
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id  — delete company and all its data (relies on DB CASCADE)
// ---------------------------------------------------------------------------
router.delete('/:id', ...superAdminOnly, async (req, res) => {
  try {
    const result = await run(
      'DELETE FROM companies WHERE id = $1',
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Company not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
