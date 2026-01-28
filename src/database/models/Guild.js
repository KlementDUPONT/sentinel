import dbConnection from '../connection.js';
import logger from '../../utils/logger.js';

/**
 * Modèle pour la gestion des guildes/serveurs
 */
class GuildModel {
  constructor() {
    this.db = dbConnection.getDatabase();
  }

  /**
   * Récupère ou crée la configuration d'une guilde
   */
  async getOrCreate(guildId) {
    try {
      let guild = this.get(guildId);
      
      if (!guild) {
        this.create(guildId);
        guild = this.get(guildId);
        logger.database('create', `New guild: ${guildId}`);
      }
      
      return guild;
    } catch (error) {
      logger.error(`Error in getOrCreate guild: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère une guilde
   */
  get(guildId) {
    const stmt = this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?');
    return stmt.get(guildId);
  }

  /**
   * Crée une nouvelle guilde
   */
  create(guildId, data = {}) {
    const stmt = this.db.prepare(`
      INSERT INTO guilds (guild_id, prefix, language)
      VALUES (?, ?, ?)
    `);
    
    return stmt.run(
      guildId,
      data.prefix || '+',
      data.language || 'fr'
    );
  }

  /**
   * Met à jour une guilde
   */
  update(guildId, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE guilds 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE guild_id = ?
    `);
    
    return stmt.run([...values, guildId]);
  }

  /**
   * Supprime une guilde
   */
  delete(guildId) {
    const stmt = this.db.prepare('DELETE FROM guilds WHERE guild_id = ?');
    return stmt.run(guildId);
  }

  /**
   * Récupère le préfixe d'une guilde
   */
  getPrefix(guildId) {
    const guild = this.get(guildId);
    return guild?.prefix || '+';
  }

  /**
   * Définit le préfixe d'une guilde
   */
  setPrefix(guildId, prefix) {
    return this.update(guildId, { prefix });
  }

  /**
   * Active/désactive un module
   */
  setModule(guildId, module, enabled) {
    const field = `${module}_enabled`;
    return this.update(guildId, { [field]: enabled ? 1 : 0 });
  }

  /**
   * Définit un canal de logs
   */
  setLogChannel(guildId, channelId) {
    return this.update(guildId, { log_channel: channelId });
  }

  /**
   * Définit un canal de logs de modération
   */
  setModLogChannel(guildId, channelId) {
    return this.update(guildId, { mod_log_channel: channelId });
  }

  /**
   * Configuration des messages de bienvenue
   */
  setWelcome(guildId, enabled, channelId, message) {
    return this.update(guildId, {
      welcome_enabled: enabled ? 1 : 0,
      welcome_channel: channelId,
      welcome_message: message
    });
  }

  /**
   * Configuration des messages d'au revoir
   */
  setGoodbye(guildId, enabled, channelId, message) {
    return this.update(guildId, {
      goodbye_enabled: enabled ? 1 : 0,
      goodbye_channel: channelId,
      goodbye_message: message
    });
  }

  /**
   * Configuration de l'économie
   */
  setEconomy(guildId, config) {
    return this.update(guildId, {
      economy_enabled: config.enabled ? 1 : 0,
      currency_name: config.currencyName,
      currency_symbol: config.currencySymbol,
      daily_amount: config.dailyAmount,
      work_min: config.workMin,
      work_max: config.workMax
    });
  }

  /**
   * Récupère toutes les guildes
   */
  getAll() {
    const stmt = this.db.prepare('SELECT * FROM guilds');
    return stmt.all();
  }

  /**
   * Compte le nombre de guildes
   */
  count() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM guilds');
    return stmt.get().count;
  }
}

export default new GuildModel();
