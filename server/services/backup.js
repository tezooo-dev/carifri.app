/**
 * DB auto-backup — copies the SQLite database file on a schedule.
 *
 * Env vars:
 *   BACKUP_DIR    path to store backups (default: server/data/backups)
 *   BACKUP_KEEP   number of backups to retain (default: 7)
 *   BACKUP_CRON   cron schedule (default: '0 2 * * *' = 2am daily)
 */

const cron = require('node-cron');
const fs   = require('fs');
const path = require('path');

const DB_PATH    = path.join(__dirname, '../data/freightlink.db');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../data/backups');
const KEEP       = parseInt(process.env.BACKUP_KEEP || '7');
const SCHEDULE   = process.env.BACKUP_CRON || '0 2 * * *'; // 2am daily

function runBackup() {
  if (!fs.existsSync(DB_PATH)) {
    console.warn('⚠️  Backup skipped — DB file not found:', DB_PATH);
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dest = path.join(BACKUP_DIR, `freightlink-${ts}.db`);
  fs.copyFileSync(DB_PATH, dest);
  console.log(`💾 DB backup created: ${dest}`);

  // Prune old backups — keep only the N most recent
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('freightlink-') && f.endsWith('.db'))
    .sort()
    .reverse();

  for (const old of files.slice(KEEP)) {
    fs.unlinkSync(path.join(BACKUP_DIR, old));
    console.log(`🗑️  Old backup removed: ${old}`);
  }
}

function startBackupSchedule() {
  if (!cron.validate(SCHEDULE)) {
    console.warn('⚠️  Invalid BACKUP_CRON schedule, using default (2am daily)');
  }
  cron.schedule(SCHEDULE, runBackup);
  console.log(`💾 DB backup scheduled: "${SCHEDULE}" → ${BACKUP_DIR} (keep ${KEEP})`);
}

module.exports = { startBackupSchedule, runBackup };
