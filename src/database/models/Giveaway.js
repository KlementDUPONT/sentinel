import dbConnection from '../connection.js';
import logger from '../../utils/logger.js';

/**
 * Modèle pour la gestion des giveaways
 */
class GiveawayModel {
  constructor() {
    this.db = dbConnection.getDatabase();
  }

  /**
   * Crée un giveaway
   */
  create(messageId, guildId, channelId, hostId, prize, winnersCount, endsAt, description = null, requiredRole = null) {
    const stmt = this.db.prepare(`
      INSERT INTO giveaways (
        message_id, guild_id, channel_id, host_id, prize, 
        winners_count, ends_at, description, required_role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      messageId, guildId, channelId, hostId, prize, 
      winnersCount, endsAt, description, requiredRole
    );
    
    logger.database('create', `New giveaway: ${prize} (${messageId})`);
    return { messageId, id: result.lastInsertRowid };
  }

  /**
   * Récupère un giveaway
   */
  get(messageId) {
    const stmt = this.db.prepare('SELECT * FROM giveaways WHERE message_id = ?');
    return stmt.get(messageId);
  }

  /**
   * Récupère tous les giveaways actifs
   */
  getActive(guildId = null) {
    let query = 'SELECT * FROM giveaways WHERE ended = 0 AND ends_at > datetime("now")';
    const params = [];
    
    if (guildId) {
      query += ' AND guild_id = ?';
      params.push(guildId);
    }
    
    query += ' ORDER BY ends_at ASC';
    
    const stmt = this.db.prepare(query);
    return params.length > 0 ? stmt.all(...params) : stmt.all();
  }

  /**
   * Récupère les giveaways terminés
   */
  getEnded(guildId, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM giveaways 
      WHERE guild_id = ? AND ended = 1 
      ORDER BY ends_at DESC 
      LIMIT ?
    `);
    return stmt.all(guildId, limit);
  }

  /**
   * Récupère les giveaways qui doivent être terminés
   */
  getExpired() {
    const stmt = this.db.prepare(`
      SELECT * FROM giveaways 
      WHERE ended = 0 AND ends_at <= datetime("now")
      ORDER BY ends_at ASC
    `);
    return stmt.all();
  }

  /**
   * Marque un giveaway comme terminé
   */
  end(messageId, winners = null) {
    const stmt = this.db.prepare(`
      UPDATE giveaways 
      SET ended = 1, winners = ? 
      WHERE message_id = ?
    `);
    return stmt.run(winners, messageId);
  }

  /**
   * Supprime un giveaway
   */
  delete(messageId) {
    const stmt = this.db.prepare('DELETE FROM giveaways WHERE message_id = ?');
    return stmt.run(messageId);
  }

  /**
   * Met à jour un giveaway
   */
  update(messageId, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE giveaways 
      SET ${setClause}
      WHERE message_id = ?
    `);
    
    return stmt.run([...values, messageId]);
  }

  /**
   * Statistiques des giveaways
   */
  getStats(guildId) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN ended = 0 THEN 1 END) as active,
        COUNT(CASE WHEN ended = 1 THEN 1 END) as ended
      FROM giveaways
      WHERE guild_id = ?
    `);
    return stmt.get(guildId);
  }
}

export default new GiveawayModel();
