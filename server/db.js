const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH  = path.join(DATA_DIR, 'freightlink.db');

let db;

function getDb() {
  if (!db) throw new Error('DB not initialized. Call initDb() first.');
  return db;
}

function initDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role         TEXT NOT NULL DEFAULT 'Dispatcher',
      avatar       TEXT DEFAULT '',
      market       TEXT NOT NULL DEFAULT 'kenya',
      created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id              INTEGER PRIMARY KEY DEFAULT 1,
      company_name    TEXT NOT NULL DEFAULT 'FreightLink Brokerage',
      company_phone   TEXT DEFAULT '',
      company_email   TEXT DEFAULT '',
      commission_rate REAL DEFAULT 8.0,
      currency        TEXT DEFAULT 'KES',
      country         TEXT DEFAULT 'Kenya',
      market          TEXT DEFAULT 'kenya'
    );

    CREATE TABLE IF NOT EXISTS carriers (
      id          TEXT PRIMARY KEY,
      market      TEXT NOT NULL DEFAULT 'kenya',
      name        TEXT NOT NULL,
      contact     TEXT DEFAULT '',
      phone       TEXT DEFAULT '',
      email       TEXT DEFAULT '',
      location    TEXT DEFAULT '',
      truck_types TEXT DEFAULT '[]',
      truck_count INTEGER DEFAULT 1,
      rating      REAL DEFAULT 4.0,
      verified    INTEGER DEFAULT 0,
      total_loads INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shippers (
      id          TEXT PRIMARY KEY,
      market      TEXT NOT NULL DEFAULT 'kenya',
      name        TEXT NOT NULL,
      contact     TEXT DEFAULT '',
      phone       TEXT DEFAULT '',
      email       TEXT DEFAULT '',
      location    TEXT DEFAULT '',
      total_loads INTEGER DEFAULT 0,
      total_spend REAL DEFAULT 0,
      industry    TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loads (
      id                   TEXT PRIMARY KEY,
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
      cargo_insurance      INTEGER DEFAULT 0,
      commission_received  INTEGER DEFAULT 0,
      timeline             TEXT DEFAULT '[]',
      created_at           TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL,
      token      TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );


    CREATE TABLE IF NOT EXISTS load_bids (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      load_id     TEXT NOT NULL,
      carrier_id  TEXT NOT NULL,
      amount      REAL NOT NULL,
      eta_hours   REAL,
      notes       TEXT DEFAULT '',
      status      TEXT DEFAULT 'pending',
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (load_id)    REFERENCES loads(id)    ON DELETE CASCADE,
      FOREIGN KEY (carrier_id) REFERENCES carriers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bids_load    ON load_bids(load_id);
    CREATE INDEX IF NOT EXISTS idx_bids_carrier ON load_bids(carrier_id);
    CREATE INDEX IF NOT EXISTS idx_loads_market  ON loads(market);
    CREATE INDEX IF NOT EXISTS idx_loads_status  ON loads(status);
    CREATE INDEX IF NOT EXISTS idx_carriers_market ON carriers(market);
    CREATE INDEX IF NOT EXISTS idx_shippers_market ON shippers(market);

    CREATE TABLE IF NOT EXISTS analytics_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL DEFAULT '',
      market     TEXT NOT NULL DEFAULT 'kenya',
      event      TEXT NOT NULL,
      category   TEXT NOT NULL DEFAULT 'general',
      meta       TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_event  ON analytics_events(event);
    CREATE INDEX IF NOT EXISTS idx_analytics_market ON analytics_events(market);
    CREATE INDEX IF NOT EXISTS idx_analytics_ts     ON analytics_events(created_at);

    CREATE TABLE IF NOT EXISTS onboarding (
      user_id    TEXT PRIMARY KEY,
      step       INTEGER DEFAULT 0,
      completed  INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL,
      token      TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      user_id                TEXT PRIMARY KEY,
      plan                   TEXT NOT NULL DEFAULT 'trial',
      status                 TEXT NOT NULL DEFAULT 'trialing',
      stripe_customer_id     TEXT DEFAULT '',
      stripe_subscription_id TEXT DEFAULT '',
      current_period_end     TEXT DEFAULT '',
      created_at             TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe migrations: add columns that may not exist yet
  const safeAlter = (sql) => { try { db.prepare(sql).run(); } catch {} };
  safeAlter("ALTER TABLE carriers ADD COLUMN contracts    TEXT DEFAULT '[]'");
  safeAlter("ALTER TABLE carriers ADD COLUMN insurance    TEXT DEFAULT '{}'");
  safeAlter("ALTER TABLE carriers ADD COLUMN edi_config   TEXT DEFAULT '{}'");
  safeAlter("ALTER TABLE carriers ADD COLUMN contacts     TEXT DEFAULT '[]'");
  // Bid enhancements: service type, transit days, accessorial charges
  safeAlter("ALTER TABLE load_bids ADD COLUMN service_type  TEXT DEFAULT 'FTL'");
  safeAlter("ALTER TABLE load_bids ADD COLUMN service_days  REAL DEFAULT 0");
  safeAlter("ALTER TABLE load_bids ADD COLUMN accessorials  TEXT DEFAULT '[]'");
  // US compliance fields
  safeAlter("ALTER TABLE carriers ADD COLUMN mc_number      TEXT DEFAULT ''");
  safeAlter("ALTER TABLE carriers ADD COLUMN dot_number     TEXT DEFAULT ''");
  safeAlter("ALTER TABLE carriers ADD COLUMN authority_type TEXT DEFAULT ''");
  safeAlter("ALTER TABLE carriers ADD COLUMN w9_on_file     INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE carriers ADD COLUMN coi_on_file    INTEGER DEFAULT 0");
  // Canada compliance fields
  safeAlter("ALTER TABLE carriers ADD COLUMN cvor_number    TEXT DEFAULT ''");
  safeAlter("ALTER TABLE carriers ADD COLUMN nsc_number     TEXT DEFAULT ''");
  safeAlter("ALTER TABLE carriers ADD COLUMN ifta_number    TEXT DEFAULT ''");
  safeAlter("ALTER TABLE carriers ADD COLUMN cvor_status    TEXT DEFAULT ''");
  // US+Canada load fields
  safeAlter("ALTER TABLE loads ADD COLUMN cross_border       INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE loads ADD COLUMN customs_ref        TEXT DEFAULT ''");
  safeAlter("ALTER TABLE loads ADD COLUMN fuel_surcharge_pct REAL DEFAULT 0");
  safeAlter("ALTER TABLE loads ADD COLUMN accessorials       TEXT DEFAULT '[]'");
  safeAlter("ALTER TABLE loads ADD COLUMN load_type          TEXT DEFAULT 'FTL'");
  safeAlter("ALTER TABLE loads ADD COLUMN hazmat             INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE loads ADD COLUMN temp_controlled    INTEGER DEFAULT 0");

  // Ticket management tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id           TEXT PRIMARY KEY,
      market       TEXT NOT NULL DEFAULT 'kenya',
      title        TEXT NOT NULL,
      description  TEXT NOT NULL DEFAULT '',
      category     TEXT NOT NULL DEFAULT 'Support',
      priority     TEXT NOT NULL DEFAULT 'Medium',
      status       TEXT NOT NULL DEFAULT 'Open',
      submitter_name  TEXT NOT NULL DEFAULT '',
      submitter_email TEXT NOT NULL DEFAULT '',
      submitter_type  TEXT NOT NULL DEFAULT 'carrier',
      submitter_ref   TEXT DEFAULT '',
      assigned_to  TEXT DEFAULT '',
      load_ref     TEXT DEFAULT '',
      attachments  TEXT DEFAULT '[]',
      resolved_at  TEXT DEFAULT '',
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id  TEXT NOT NULL,
      author_id  TEXT NOT NULL DEFAULT '',
      author_name TEXT NOT NULL DEFAULT '',
      author_role TEXT NOT NULL DEFAULT 'operations',
      body       TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_market   ON tickets(market);
    CREATE INDEX IF NOT EXISTS idx_tickets_status   ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
    CREATE INDEX IF NOT EXISTS idx_tc_ticket        ON ticket_comments(ticket_id);
  `);

  // Custom roles table — per-market, defined by admins
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_roles (
      id          TEXT PRIMARY KEY,
      market      TEXT NOT NULL DEFAULT 'kenya',
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      permissions TEXT NOT NULL DEFAULT '[]',
      created_by  TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_custom_roles_market ON custom_roles(market);
  `);

  // Add custom_role and custom_perms columns to users
  safeAlter("ALTER TABLE users ADD COLUMN custom_role  TEXT DEFAULT ''");
  safeAlter("ALTER TABLE users ADD COLUMN custom_perms TEXT DEFAULT '[]'");

  // Tracking code reference table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracking_codes (
      code        TEXT PRIMARY KEY,
      category    TEXT NOT NULL DEFAULT 'Status',
      message     TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_terminal INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tc_category ON tracking_codes(category);

    -- Carrier load documents (BOL, POD, invoice uploads)
    CREATE TABLE IF NOT EXISTS load_documents (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      load_id     TEXT NOT NULL,
      carrier_id  TEXT NOT NULL DEFAULT '',
      doc_type    TEXT NOT NULL DEFAULT 'Other',
      name        TEXT NOT NULL,
      url         TEXT DEFAULT '',
      notes       TEXT DEFAULT '',
      uploaded_by TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ld_load ON load_documents(load_id);

    -- Carrier tracking events (manual code entry)
    CREATE TABLE IF NOT EXISTS carrier_tracking (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      load_id     TEXT NOT NULL,
      carrier_id  TEXT NOT NULL,
      code        TEXT NOT NULL,
      message     TEXT NOT NULL,
      location    TEXT DEFAULT '',
      notes       TEXT DEFAULT '',
      latitude    REAL,
      longitude   REAL,
      event_time  TEXT DEFAULT (datetime('now')),
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ct_load ON carrier_tracking(load_id);

    -- Carrier disputes
    CREATE TABLE IF NOT EXISTS carrier_disputes (
      id           TEXT PRIMARY KEY,
      load_id      TEXT NOT NULL,
      carrier_id   TEXT NOT NULL,
      subject      TEXT NOT NULL,
      description  TEXT DEFAULT '',
      dispute_type TEXT DEFAULT 'General',
      status       TEXT DEFAULT 'Open',
      resolution   TEXT DEFAULT '',
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_cd_carrier ON carrier_disputes(carrier_id);
    CREATE INDEX IF NOT EXISTS idx_cd_load    ON carrier_disputes(load_id);
  `);

  // Role migration: normalize legacy role values to admin / operations
  try {
    db.prepare("UPDATE users SET role = 'admin'      WHERE role = 'Admin'").run();
    db.prepare("UPDATE users SET role = 'operations' WHERE role IN ('Dispatcher','Finance','Manager','Viewer')").run();
  } catch {}

  return db;
}

module.exports = { getDb, initDb };
