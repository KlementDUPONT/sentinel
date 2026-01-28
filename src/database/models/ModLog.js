import dbConnection from '../connection.js';
import logger from '../../utils/logger.js';

/**
 * Modèle pour les logs de modération
 */
class ModLogModel {
  constructor() {
    this.db = dbConnection.getDatabase();
  }

  /**
   * Crée un log de modération
   */
  create(guildId, action, userId, moderatorId, reason = null, duration = null) {
    // Récupère le prochain case_id pour cette guilde
    const caseId = this.getNextCaseId(guildId);
    
    const stmt = this.db.prepare(`
      INSERT INTO mod_logs (
        guild_id, case_id, action, user_id, moderator_id, reason, duration
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(guildId, caseId, action, userId, moderatorId, reason, duration);
    logger.database('create', `New mod log: Case #${caseId} - ${action}`);
    
    return { caseId, id: result.lastInsertRowid };
  }

  /**
   * Récupère le prochain case_id
   */
  getNextCaseId(guildId) {
    const stmt = this.db.prepare(`
      SELECT COALESCE(MAX(case_id), 0) + 1 as next_id 
      FROM mod_logs 
      WHERE guild_id = ?
    `);
    return stmt.get(guildId).next_id;
  }

  /**
   * Récupère un log par case_id
   */
  get(guildId, caseId) {
    const stmt = this.db.prepare(`
      SELECT * FROM mod_logs 
      WHERE guild_id = ? AND case_id = ?
    `);
    return stmt.get(guildId, caseId);
  }

  /**
   * Récupère tous les logs d'une guilde
   */
  getAll(guildId, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM mod_logs 
      WHERE guild_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(guildId, limit);
  }

  /**
   * Récupère les logs d'un utilisateur
   */
  getUserLogs(userId, guildId, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM mod_logs 
      WHERE user_id = ? AND guild_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, guildId, limit);
  }

  /**
   * Récupère les logs par action
   */
  getByAction(guildId, action, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM mod_logs 
      WHERE guild_id = ? AND action = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(guildId, action, limit);
  }

  /**
   * Récupère les logs d'un modérateur
   */
  getModeratorLogs(moderatorId, guildId, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM mod_logs 
      WHERE moderator_id = ? AND guild_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(moderatorId, guildId, limit);
  }

  /**
   * Met à jour un log
   */
  update(guildId, caseId, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE mod_logs 
      SET ${setClause}
      WHERE guild_id = ? AND case_id = ?
    `);
    
    return stmt.run([...values, guildId, caseId]);
  }

  /**
   * Supprime un log
   */
  delete(guildId, caseId) {
    const stmt = this.db.prepare(`
      DELETE FROM mod_logs 
      WHERE guild_id = ? AND case_id = ?
    `);
    return stmt.run(guildId, caseId);
  }

  /**
   * Statistiques de modération
   */
  getStats(guildId) {
    const stmt = this.db.prepare(`
      SELECT 
        action,
        COUNT(*) as count
      FROM mod_logs
      WHERE guild_id = ?
      GROUP BY action
    `);
    return stmt.all(guildId);
  }

  /**
   * Compte total des actions de modération
   */
  count(guildId) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM mod_logs 
      WHERE guild_id = ?
    `);
    return stmt.get(guildId).count;
  }
}

export default new ModLogModel();
