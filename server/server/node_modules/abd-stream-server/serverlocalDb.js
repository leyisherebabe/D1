// server/localDb.js
const { SQLiteFS } = require('wa-sqlite/src/examples/SQLiteFS');
const { IDBBatchAtomicVFS } = require('wa-sqlite/src/examples/IDBBatchAtomicVFS');
const { default: SQLite } = require('wa-sqlite');

let sqlite3;
let db;

async function initDb() {
  if (db) return; // Already initialized

  sqlite3 = await SQLite();
  const sqliteFs = new SQLiteFS(sqlite3.oo1, new IDBBatchAtomicVFS('local.db'));
  sqlite3.initVFS(sqliteFs);

  db = await sqlite3.open_v2('local.db', { vfs: 'local.db' });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      role TEXT,
      isSystem INTEGER,
      color TEXT,
      ip TEXT
    );

    CREATE TABLE IF NOT EXISTS connected_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      ip TEXT NOT NULL,
      userAgent TEXT,
      os TEXT,
      deviceType TEXT,
      browser TEXT,
      deviceName TEXT,
      connectTime TEXT NOT NULL,
      lastActivity TEXT NOT NULL,
      page TEXT,
      fingerprint TEXT,
      isMuted INTEGER DEFAULT 0,
      muteEndTime TEXT,
      muteCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS moderation_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      targetUserId TEXT,
      targetUsername TEXT,
      moderatorUsername TEXT,
      timestamp TEXT NOT NULL,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      messageId TEXT NOT NULL,
      reportedUser TEXT NOT NULL,
      reportedMessage TEXT NOT NULL,
      reportReason TEXT NOT NULL,
      reporterUsername TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS popup_announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT,
      isActive INTEGER DEFAULT 0
    );
  `);

  console.log('Local SQLite database initialized and tables created.');
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

module.exports = { initDb, getDb };