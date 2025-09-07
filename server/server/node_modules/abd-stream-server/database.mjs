import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    const dbPath = process.env.DB_PATH || './data/database.sqlite';
    const dbDir = path.dirname(dbPath);
    
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('Erreur lors de l\'ouverture de la base de données:', err.message);
      } else {
        console.log('✅ Connexion à la base de données SQLite établie');
        this.createTables();
      }
    });
  }

  createTables() {
    const tables = [
      // Table des utilisateurs connectés
      `CREATE TABLE IF NOT EXISTS connected_users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        ip TEXT NOT NULL,
        user_agent TEXT,
        connect_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        page TEXT DEFAULT 'home',
        fingerprint TEXT,
        is_muted BOOLEAN DEFAULT 0,
        mute_end_time DATETIME,
        mute_count INTEGER DEFAULT 0,
        is_banned BOOLEAN DEFAULT 0,
        ban_end_time DATETIME
      )`,

      // Table des utilisateurs enregistrés
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'viewer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,

      // Table des messages de chat
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        role TEXT DEFAULT 'viewer',
        is_system BOOLEAN DEFAULT 0,
        color TEXT,
        ip TEXT,
        user_fingerprint TEXT
      )`,

      // Table des utilisateurs bannis
      `CREATE TABLE IF NOT EXISTS banned_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fingerprint TEXT,
        ip TEXT,
        username TEXT,
        banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ban_end_time DATETIME,
        reason TEXT,
        banned_by TEXT,
        is_permanent BOOLEAN DEFAULT 0
      )`,

      // Table des utilisateurs mutes
      `CREATE TABLE IF NOT EXISTS muted_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fingerprint TEXT NOT NULL,
        username TEXT,
        ip TEXT,
        muted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        mute_end_time DATETIME NOT NULL,
        reason TEXT,
        muted_by TEXT,
        mute_count INTEGER DEFAULT 1
      )`,

      // Table des logs système
      `CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        username TEXT,
        ip TEXT,
        user_agent TEXT,
        fingerprint TEXT
      )`
    ];

    tables.forEach((tableSQL, index) => {
      this.db.run(tableSQL, (err) => {
        if (err) {
          console.error(`Erreur lors de la création de la table ${index + 1}:`, err.message);
        } else {
          console.log(`✅ Table ${index + 1} créée/vérifiée`);
        }
      });
    });
  }

  // Méthodes utilitaires pour les requêtes
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Méthodes spécifiques pour l'application
  async addConnectedUser(userData) {
    const sql = `INSERT OR REPLACE INTO connected_users 
                 (id, username, ip, user_agent, connect_time, last_activity, page, fingerprint) 
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)`;
    
    return await this.run(sql, [
      userData.id,
      userData.username,
      userData.ip,
      userData.userAgent,
      userData.page,
      userData.fingerprint
    ]);
  }

  async updateUserActivity(userId, page = null) {
    const sql = page 
      ? `UPDATE connected_users SET last_activity = CURRENT_TIMESTAMP, page = ? WHERE id = ?`
      : `UPDATE connected_users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?`;
    
    const params = page ? [page, userId] : [userId];
    return await this.run(sql, params);
  }

  async removeConnectedUser(userId) {
    const sql = `DELETE FROM connected_users WHERE id = ?`;
    return await this.run(sql, [userId]);
  }

  async getConnectedUsers() {
    const sql = `SELECT * FROM connected_users ORDER BY connect_time DESC`;
    return await this.all(sql);
  }

  async addChatMessage(messageData) {
    const sql = `INSERT INTO chat_messages 
                 (id, username, message, timestamp, role, is_system, color, ip, user_fingerprint) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    return await this.run(sql, [
      messageData.id,
      messageData.username,
      messageData.message,
      messageData.timestamp,
      messageData.role || 'viewer',
      messageData.isSystem ? 1 : 0,
      messageData.color,
      messageData.ip,
      messageData.fingerprint
    ]);
  }

  async getChatMessages(limit = 50) {
    const sql = `SELECT * FROM chat_messages ORDER BY timestamp DESC LIMIT ?`;
    const messages = await this.all(sql, [limit]);
    return messages.reverse(); // Retourner dans l'ordre chronologique
  }

  async deleteChatMessage(messageId) {
    const sql = `DELETE FROM chat_messages WHERE id = ?`;
    return await this.run(sql, [messageId]);
  }

  async banUser(userData) {
    const sql = `INSERT INTO banned_users 
                 (fingerprint, ip, username, ban_end_time, reason, banned_by, is_permanent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    return await this.run(sql, [
      userData.fingerprint,
      userData.ip,
      userData.username,
      userData.banEndTime,
      userData.reason,
      userData.bannedBy,
      userData.isPermanent ? 1 : 0
    ]);
  }

  async muteUser(userData) {
    const sql = `INSERT INTO muted_users 
                 (fingerprint, username, ip, mute_end_time, reason, muted_by, mute_count) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    return await this.run(sql, [
      userData.fingerprint,
      userData.username,
      userData.ip,
      userData.muteEndTime,
      userData.reason,
      userData.mutedBy,
      userData.muteCount || 1
    ]);
  }

  async isUserBanned(fingerprint, ip) {
    const sql = `SELECT * FROM banned_users 
                 WHERE (fingerprint = ? OR ip = ?) 
                 AND (ban_end_time IS NULL OR ban_end_time > CURRENT_TIMESTAMP)
                 ORDER BY banned_at DESC LIMIT 1`;
    
    return await this.get(sql, [fingerprint, ip]);
  }

  async isUserMuted(fingerprint) {
    const sql = `SELECT * FROM muted_users 
                 WHERE fingerprint = ? 
                 AND mute_end_time > CURRENT_TIMESTAMP
                 ORDER BY muted_at DESC LIMIT 1`;
    
    return await this.get(sql, [fingerprint]);
  }

  async getBannedUsers() {
    const sql = `SELECT * FROM banned_users 
                 WHERE ban_end_time IS NULL OR ban_end_time > CURRENT_TIMESTAMP
                 ORDER BY banned_at DESC`;
    
    return await this.all(sql);
  }

  async getMutedUsers() {
    const sql = `SELECT * FROM muted_users 
                 WHERE mute_end_time > CURRENT_TIMESTAMP
                 ORDER BY muted_at DESC`;
    
    return await this.all(sql);
  }

  async unbanUser(fingerprint, ip) {
    const sql = `UPDATE banned_users 
                 SET ban_end_time = CURRENT_TIMESTAMP 
                 WHERE (fingerprint = ? OR ip = ?) 
                 AND (ban_end_time IS NULL OR ban_end_time > CURRENT_TIMESTAMP)`;
    
    return await this.run(sql, [fingerprint, ip]);
  }

  async unmuteUser(fingerprint) {
    const sql = `UPDATE muted_users 
                 SET mute_end_time = CURRENT_TIMESTAMP 
                 WHERE fingerprint = ? 
                 AND mute_end_time > CURRENT_TIMESTAMP`;
    
    return await this.run(sql, [fingerprint]);
  }

  async clearExpiredMutes() {
    const sql = `DELETE FROM muted_users WHERE mute_end_time <= CURRENT_TIMESTAMP`;
    return await this.run(sql);
  }

  // Méthodes pour la gestion des utilisateurs authentifiés
  async createUser(userData) {
    const sql = `INSERT INTO users 
                 (id, username, password_hash, role) 
                 VALUES (?, ?, ?, ?)`;
    
    return await this.run(sql, [
      userData.id,
      userData.username,
      userData.passwordHash,
      userData.role || 'viewer'
    ]);
  }

  async findUserByUsername(username) {
    const sql = `SELECT * FROM users WHERE username = ? AND is_active = 1`;
    return await this.get(sql, [username]);
  }

  async findUserById(userId) {
    const sql = `SELECT * FROM users WHERE id = ? AND is_active = 1`;
    return await this.get(sql, [userId]);
  }

  async updateUserLastLogin(userId) {
    const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
    return await this.run(sql, [userId]);
  }

  async getAllUsers() {
    const sql = `SELECT id, username, role, created_at, last_login FROM users WHERE is_active = 1 ORDER BY created_at DESC`;
    return await this.all(sql);
  }

  async updateUserRole(userId, newRole) {
    const sql = `UPDATE users SET role = ? WHERE id = ?`;
    return await this.run(sql, [newRole, userId]);
  }

  async deactivateUser(userId) {
    const sql = `UPDATE users SET is_active = 0 WHERE id = ?`;
    return await this.run(sql, [userId]);
  }

  async addSystemLog(logData) {
    const sql = `INSERT INTO system_logs 
                 (action, details, username, ip, user_agent, fingerprint) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    return await this.run(sql, [
      logData.action,
      logData.details,
      logData.username,
      logData.ip,
      logData.userAgent,
      logData.fingerprint
    ]);
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Erreur lors de la fermeture de la base de données:', err.message);
        } else {
          console.log('✅ Connexion à la base de données fermée');
        }
      });
    }
  }
}

export default Database;