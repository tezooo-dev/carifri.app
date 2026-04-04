/**
 * PostgreSQL connection pool (Supabase / pg).
 *
 * All route files import { one, all, run, withTransaction } from here.
 * Query helpers map to the old better-sqlite3 patterns:
 *   one()  ← .get()    — returns first row or null
 *   all()  ← .all()    — returns array of rows
 *   run()  ← .run()    — INSERT/UPDATE/DELETE, returns pg result
 *
 * Placeholders use $1, $2, … (not ?)
 * JSONB columns come back as parsed JS objects automatically.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false'
    ? false
    : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected pg client error:', err.message);
});

/** Return first row, or null */
async function one(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows[0] ?? null;
}

/** Return all rows */
async function all(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows;
}

/** Execute INSERT/UPDATE/DELETE — returns { rowCount, rows } */
async function run(text, params = []) {
  return pool.query(text, params);
}

/** Run multiple queries inside a single transaction */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verify the connection on startup.
 * Call from server/index.js — throws if DATABASE_URL is wrong.
 */
async function testConnection() {
  const { rows } = await pool.query('SELECT NOW() AS ts');
  console.log('✅ PostgreSQL connected —', rows[0].ts);
}

module.exports = { pool, one, all, run, withTransaction, testConnection };
