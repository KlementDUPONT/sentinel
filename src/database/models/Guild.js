import dbConnection from '../connection.js';
import logger from '../../utils/logger.js';

/**
 * Modèle pour gérer les serveurs Discord (guilds)
 */
class GuildModel {
  constructor() {
    // Lazy loading de la DB
    this.db = null;
  }

  /**
   * S'assure que la DB est connectée (lazy loading)
   */
  _getDb() {
    if (!this.db) {
      this.db = dbConnection.getDatabase();
    }
    return this.db;
  }

  /**
   * Crée un nouveau serveur dans la base de données
   */
  create(guildData) {
    const db = this._getDb();

    const stmt = db.prepare(`
      INSERT INTO guilds (guild_id, name, prefix, language, timezone, joined_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        guildData.guild_id,
        guildData.name,
        guildData.prefix || '+',
        guildData.language || 'fr',
        guildData.timezone || 'Europe/Paris',
        guildData.joined_at || Math.floor(Date.now() / 1000)
      );

      logger.info(`✅ Guild created: ${guildData.guild_id} (${guildData.name})`);
      return this.findById(guildData.guild_id);
    } catch (error) {
      logger.error(`❌ Failed to create guild ${guildData.guild_id}:`, error);
      throw error;
    }
  }

  /**
   * Trouve un serveur par son ID
   */
  findById(guildId) {
    const db = this._getDb();

    const stmt = db.prepare('SELECT * FROM guilds WHERE guild_id = ? AND left_at IS NULL');
    return stmt.get(guildId);
  }

  /**
   * Trouve ou crée un serveur
   */
  findOrCreate(guildData) {
    let guild = this.findById(guildData.guild_id);

    if (!guild) {
      guild = this.create(guildData);
    }

    return guild;
  }

  /**
   * Met à jour un serveur
   */
  update(guildId, updates) {
    const db = this._getDb();

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    fields.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    values.push(guildId);

    const stmt = db.prepare(`
      UPDATE guilds 
      SET ${fields.join(', ')}
      WHERE guild_id = ?
    `);

    try {
      stmt.run(...values);
      logger.info(`✅ Guild updated: ${guildId}`);
      return this.findById(guildId);
    } catch (error) {
      logger.error(`❌ Failed to update guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Marque un serveur comme quitté
   */
  markAsLeft(guildId) {
    const db = this._getDb();

    const stmt = db.prepare(`
      UPDATE guilds 
      SET left_at = ?, updated_at = ?
      WHERE guild_id = ?
    `);

    const now = Math.floor(Date.now() / 1000);

    try {
      stmt.run(now, now, guildId);
      logger.info(`👋 Guild marked as left: ${guildId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to mark guild as left ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère tous les serveurs actifs
   */
  findAll() {
    const db = this._getDb();

    const stmt = db.prepare('SELECT * FROM guilds WHERE left_at IS NULL ORDER BY joined_at DESC');
    return stmt.all();
  }

  /**
   * Compte le nombre de serveurs actifs
   */
  count() {
    const db = this._getDb();

    const stmt = db.prepare('SELECT COUNT(*) as count FROM guilds WHERE left_at IS NULL');
    const result = stmt.get();
    return result.count;
  }

  /**
   * Récupère le préfixe d'un serveur
   */
  getPrefix(guildId) {
    const guild = this.findById(guildId);
    return guild ? guild.prefix : '+';
  }

  /**
   * Change le préfixe d'un serveur
   */
  setPrefix(guildId, newPrefix) {
    return this.update(guildId, { prefix: newPrefix });
  }

  /**
   * Récupère les paramètres d'un serveur
   */
  getSettings(guildId) {
    const guild = this.findById(guildId);
    
    if (!guild) {
      return {};
    }

    try {
      return JSON.parse(guild.settings || '{}');
    } catch (error) {
      logger.error(`Failed to parse settings for guild ${guildId}:`, error);
      return {};
    }
  }

  /**
   * Met à jour les paramètres d'un serveur
   */
  setSettings(guildId, settings) {
    return this.update(guildId, { 
      settings: JSON.stringify(settings) 
    });
  }

  /**
   * Supprime définitivement un serveur
   */
  delete(guildId) {
    const db = this._getDb();

    const stmt = db.prepare('DELETE FROM guilds WHERE guild_id = ?');

    try {
      stmt.run(guildId);
      logger.info(`🗑️ Guild deleted: ${guildId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to delete guild ${guildId}:`, error);
      throw error;
    }
  }
}

// Export d'une instance unique (singleton)
export default new GuildModel();
