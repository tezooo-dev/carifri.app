-- ============================================================
-- FreightLink TMS — Supabase / PostgreSQL schema
-- Multi-tenant: every tenant-scoped table has company_id
-- Run once against a fresh Supabase project database
-- ============================================================

-- ── Enable UUID extension ─────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Companies (tenants) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'trial',    -- trial | starter | professional
  status      TEXT NOT NULL DEFAULT 'active',   -- active | suspended
  market      TEXT NOT NULL DEFAULT 'kenya',    -- default market for company
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  company_id    TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'operations',  -- super_admin | admin | operations
  custom_role   TEXT DEFAULT '',
  custom_perms  JSONB DEFAULT '[]',
  avatar        TEXT DEFAULT '',
  market        TEXT NOT NULL DEFAULT 'kenya',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_company  ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_market   ON users(market);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);

-- ── Settings (one row per company) ────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  company_id      TEXT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL DEFAULT 'FreightLink Brokerage',
  company_phone   TEXT DEFAULT '',
  company_email   TEXT DEFAULT '',
  commission_rate REAL DEFAULT 8.0,
  currency        TEXT DEFAULT 'KES',
  country         TEXT DEFAULT 'Kenya',
  market          TEXT DEFAULT 'kenya'
);

-- ── Carriers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carriers (
  id             TEXT PRIMARY KEY,
  company_id     TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  market         TEXT NOT NULL DEFAULT 'kenya',
  name           TEXT NOT NULL,
  contact        TEXT DEFAULT '',
  phone          TEXT DEFAULT '',
  email          TEXT DEFAULT '',
  location       TEXT DEFAULT '',
  truck_types    JSONB DEFAULT '[]',
  truck_count    INT DEFAULT 1,
  rating         REAL DEFAULT 4.0,
  verified       BOOLEAN DEFAULT FALSE,
  total_loads    INT DEFAULT 0,
  -- Extended profile
  contracts      JSONB DEFAULT '[]',
  insurance      JSONB DEFAULT '{}',
  edi_config     JSONB DEFAULT '{}',
  contacts       JSONB DEFAULT '[]',
  -- US compliance
  mc_number      TEXT DEFAULT '',
  dot_number     TEXT DEFAULT '',
  authority_type TEXT DEFAULT '',
  w9_on_file     BOOLEAN DEFAULT FALSE,
  coi_on_file    BOOLEAN DEFAULT FALSE,
  -- Canada compliance
  cvor_number    TEXT DEFAULT '',
  nsc_number     TEXT DEFAULT '',
  ifta_number    TEXT DEFAULT '',
  cvor_status    TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_carriers_company ON carriers(company_id);
CREATE INDEX IF NOT EXISTS idx_carriers_market  ON carriers(market);

-- ── Shippers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shippers (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  market      TEXT NOT NULL DEFAULT 'kenya',
  name        TEXT NOT NULL,
  contact     TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  location    TEXT DEFAULT '',
  total_loads INT DEFAULT 0,
  total_spend REAL DEFAULT 0,
  industry    TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shippers_company ON shippers(company_id);
CREATE INDEX IF NOT EXISTS idx_shippers_market  ON shippers(market);

-- ── Loads ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loads (
  id                   TEXT PRIMARY KEY,
  company_id           TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  market               TEXT NOT NULL DEFAULT 'kenya',
  origin               TEXT NOT NULL,
  destination          TEXT NOT NULL,
  commodity            TEXT NOT NULL,
  weight               REAL NOT NULL DEFAULT 0,
  truck_type           TEXT NOT NULL DEFAULT 'Dry Van',
  freight_amount       REAL NOT NULL DEFAULT 0,
  commission           REAL NOT NULL DEFAULT 0,
  advance              REAL DEFAULT 0,
  status               TEXT DEFAULT 'Available',
  shipper_id           TEXT DEFAULT '',
  carrier_id           TEXT DEFAULT '',
  shipper_contact      TEXT DEFAULT '',
  shipper_phone        TEXT DEFAULT '',
  pickup_date          TEXT DEFAULT '',
  delivery_date        TEXT DEFAULT '',
  special_instructions TEXT DEFAULT '',
  cargo_insurance      BOOLEAN DEFAULT FALSE,
  commission_received  BOOLEAN DEFAULT FALSE,
  timeline             JSONB DEFAULT '[]',
  -- Extended fields
  cross_border         BOOLEAN DEFAULT FALSE,
  customs_ref          TEXT DEFAULT '',
  fuel_surcharge_pct   REAL DEFAULT 0,
  accessorials         JSONB DEFAULT '[]',
  load_type            TEXT DEFAULT 'FTL',
  hazmat               BOOLEAN DEFAULT FALSE,
  temp_controlled      BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loads_company ON loads(company_id);
CREATE INDEX IF NOT EXISTS idx_loads_market  ON loads(market);
CREATE INDEX IF NOT EXISTS idx_loads_status  ON loads(status);

-- ── Refresh Tokens ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_user  ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_rt_token ON refresh_tokens(token);

-- ── Load Bids ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS load_bids (
  id           BIGSERIAL PRIMARY KEY,
  load_id      TEXT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  carrier_id   TEXT NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  amount       REAL NOT NULL,
  eta_hours    REAL,
  notes        TEXT DEFAULT '',
  status       TEXT DEFAULT 'pending',   -- pending | accepted | rejected | withdrawn
  service_type TEXT DEFAULT 'FTL',
  service_days REAL DEFAULT 0,
  accessorials JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bids_load    ON load_bids(load_id);
CREATE INDEX IF NOT EXISTS idx_bids_carrier ON load_bids(carrier_id);

-- ── Analytics Events ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id         BIGSERIAL PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL DEFAULT '',
  market     TEXT NOT NULL DEFAULT 'kenya',
  event      TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'general',
  meta       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_company ON analytics_events(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event   ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_ts      ON analytics_events(created_at);

-- ── Onboarding ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  step       INT DEFAULT 0,
  completed  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Password Reset Tokens ─────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscriptions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  company_id             TEXT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  plan                   TEXT NOT NULL DEFAULT 'trial',
  status                 TEXT NOT NULL DEFAULT 'trialing',
  stripe_customer_id     TEXT DEFAULT '',
  stripe_subscription_id TEXT DEFAULT '',
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tickets ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id              TEXT PRIMARY KEY,
  company_id      TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  market          TEXT NOT NULL DEFAULT 'kenya',
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'Support',
  priority        TEXT NOT NULL DEFAULT 'Medium',
  status          TEXT NOT NULL DEFAULT 'Open',
  submitter_name  TEXT NOT NULL DEFAULT '',
  submitter_email TEXT NOT NULL DEFAULT '',
  submitter_type  TEXT NOT NULL DEFAULT 'carrier',
  submitter_ref   TEXT DEFAULT '',
  assigned_to     TEXT DEFAULT '',
  load_ref        TEXT DEFAULT '',
  attachments     JSONB DEFAULT '[]',
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_company  ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status   ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);

-- ── Ticket Comments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_comments (
  id          BIGSERIAL PRIMARY KEY,
  ticket_id   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  author_role TEXT NOT NULL DEFAULT 'operations',
  body        TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tc_ticket ON ticket_comments(ticket_id);

-- ── Custom Roles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_roles (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  market      TEXT NOT NULL DEFAULT 'kenya',
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '[]',
  created_by  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custom_roles_company ON custom_roles(company_id);

-- ── Tracking Codes (global reference — no company_id) ─────
CREATE TABLE IF NOT EXISTS tracking_codes (
  code        TEXT PRIMARY KEY,
  category    TEXT NOT NULL DEFAULT 'Status',
  message     TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_terminal BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tc_category ON tracking_codes(category);

-- ── Load Documents ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS load_documents (
  id          BIGSERIAL PRIMARY KEY,
  load_id     TEXT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  carrier_id  TEXT NOT NULL DEFAULT '',
  doc_type    TEXT NOT NULL DEFAULT 'Other',
  name        TEXT NOT NULL,
  url         TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  uploaded_by TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ld_load ON load_documents(load_id);

-- ── Carrier Tracking Events ───────────────────────────────
CREATE TABLE IF NOT EXISTS carrier_tracking (
  id         BIGSERIAL PRIMARY KEY,
  load_id    TEXT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  carrier_id TEXT NOT NULL,
  code       TEXT NOT NULL,
  message    TEXT NOT NULL,
  location   TEXT DEFAULT '',
  notes      TEXT DEFAULT '',
  latitude   REAL,
  longitude  REAL,
  event_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ct_load ON carrier_tracking(load_id);

-- ── Carrier Disputes ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS carrier_disputes (
  id           TEXT PRIMARY KEY,
  load_id      TEXT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  carrier_id   TEXT NOT NULL,
  subject      TEXT NOT NULL,
  description  TEXT DEFAULT '',
  dispute_type TEXT DEFAULT 'General',
  status       TEXT DEFAULT 'Open',
  resolution   TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cd_carrier ON carrier_disputes(carrier_id);
CREATE INDEX IF NOT EXISTS idx_cd_load    ON carrier_disputes(load_id);
