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
  `);

  // Safe migrations: add columns that may not exist yet
  const safeAlter = (sql) => { try { db.prepare(sql).run(); } catch {} };
  safeAlter("ALTER TABLE carriers ADD COLUMN contracts  TEXT DEFAULT '[]'");
  safeAlter("ALTER TABLE carriers ADD COLUMN insurance  TEXT DEFAULT '{}'");
  safeAlter("ALTER TABLE carriers ADD COLUMN edi_config TEXT DEFAULT '{}'");
  safeAlter("ALTER TABLE carriers ADD COLUMN contacts   TEXT DEFAULT '[]'");

  return db;
}

module.exports = { getDb, initDb };
