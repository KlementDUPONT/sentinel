import dbConnection from '../connection.js';
import logger from '../../utils/logger.js';
import { randomUUID } from 'crypto';

/**
 * Modèle pour la gestion des avertissements
 */
class WarnModel {
  constructor() {
    this.db = dbConnection.getDatabase();
  }

  /**
   * Crée un avertissement
   */
  create(guildId, userId, moderatorId, reason = 'Aucune raison fournie') {
    const warnId = randomUUID();
    
    const stmt = this.db.prepare(`
      INSERT INTO warns (warn_id, guild_id, user_id, moderator_id, reason)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(warnId, guildId, userId, moderatorId, reason);
    logger.database('create', `New warn: ${warnId} for user ${userId}`);
    
    return { warnId, id: result.lastInsertRowid };
  }

  /**
   * Récupère un avertissement par ID
   */
  get(warnId) {
    const stmt = this.db.prepare('SELECT * FROM warns WHERE warn_id = ?');
    return stmt.get(warnId);
  }

  /**
   * Récupère tous les avertissements d'un utilisateur
   */
  getUserWarns(userId, guildId, activeOnly = false) {
    let query = 'SELECT * FROM warns WHERE user_id = ? AND guild_id = ?';
    if (activeOnly) {
      query += ' AND active = 1';
    }
    query += ' ORDER BY created_at DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(userId, guildId);
  }

  /**
   * Compte les avertissements actifs d'un utilisateur
   */
  countUserWarns(userId, guildId, activeOnly = true) {
    let query = 'SELECT COUNT(*) as count FROM warns WHERE user_id = ? AND guild_id = ?';
    if (activeOnly) {
      query += ' AND active = 1';
    }
    
    const stmt = this.db.prepare(query);
    return stmt.get(userId, guildId).count;
  }

  /**
   * Supprime un avertissement
   */
  remove(warnId) {
    const stmt = this.db.prepare('UPDATE warns SET active = 0 WHERE warn_id = ?');
    const result = stmt.run(warnId);
    logger.database('remove', `Warn removed: ${warnId}`);
    return result;
  }

  /**
   * Supprime tous les avertissements d'un utilisateur
   */
  clearUserWarns(userId, guildId) {
    const stmt = this.db.prepare(`
      UPDATE warns 
      SET active = 0 
      WHERE user_id = ? AND guild_id = ?
    `);
    return stmt.run(userId, guildId);
  }

  /**
   * Récupère tous les avertissements d'une guilde
   */
  getGuildWarns(guildId, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM warns 
      WHERE guild_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(guildId, limit);
  }

  /**
   * Statistiques des avertissements
   */
  getStats(guildId) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN active = 1 THEN 1 END) as active,
        COUNT(DISTINCT user_id) as unique_users
      FROM warns
      WHERE guild_id = ?
    `);
    return stmt.get(guildId);
  }
}

export default new WarnModel();
