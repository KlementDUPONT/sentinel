import dbConnection from '../connection.js';
import logger from '../../utils/logger.js';
import { LIMITS } from '../../config/constants.js';

/**
 * Modèle pour la gestion des utilisateurs
 */
class UserModel {
  constructor() {
    this.db = dbConnection.getDatabase();
  }

  /**
   * Récupère ou crée un utilisateur
   */
  async getOrCreate(userId, guildId) {
    try {
      let user = this.get(userId, guildId);
      
      if (!user) {
        this.create(userId, guildId);
        user = this.get(userId, guildId);
        logger.database('create', `New user: ${userId} in ${guildId}`);
      }
      
      return user;
    } catch (error) {
      logger.error(`Error in getOrCreate user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur
   */
  get(userId, guildId) {
    const stmt = this.db.prepare(`
      SELECT * FROM users 
      WHERE user_id = ? AND guild_id = ?
    `);
    return stmt.get(userId, guildId);
  }

  /**
   * Crée un nouvel utilisateur
   */
  create(userId, guildId) {
    const stmt = this.db.prepare(`
      INSERT INTO users (user_id, guild_id)
      VALUES (?, ?)
    `);
    return stmt.run(userId, guildId);
  }

  /**
   * Met à jour un utilisateur
   */
  update(userId, guildId, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND guild_id = ?
    `);
    
    return stmt.run([...values, userId, guildId]);
  }

  /**
   * Supprime un utilisateur
   */
  delete(userId, guildId) {
    const stmt = this.db.prepare(`
      DELETE FROM users 
      WHERE user_id = ? AND guild_id = ?
    `);
    return stmt.run(userId, guildId);
  }

  // ===== ÉCONOMIE =====

  /**
   * Récupère la balance d'un utilisateur
   */
  getBalance(userId, guildId) {
    const user = this.get(userId, guildId);
    return {
      balance: user?.balance || 0,
      bank: user?.bank || 0,
      total: (user?.balance || 0) + (user?.bank || 0)
    };
  }

  /**
   * Ajoute de l'argent
   */
  addMoney(userId, guildId, amount, location = 'balance') {
    const user = this.getOrCreate(userId, guildId);
    const field = location === 'bank' ? 'bank' : 'balance';
    const newAmount = (user[field] || 0) + amount;
    
    return this.update(userId, guildId, { 
      [field]: newAmount,
      total_earned: (user.total_earned || 0) + amount
    });
  }

  /**
   * Retire de l'argent
   */
  removeMoney(userId, guildId, amount, location = 'balance') {
    const user = this.getOrCreate(userId, guildId);
    const field = location === 'bank' ? 'bank' : 'balance';
    const newAmount = Math.max(0, (user[field] || 0) - amount);
    
    return this.update(userId, guildId, { 
      [field]: newAmount,
      total_spent: (user.total_spent || 0) + amount
    });
  }

  /**
   * Définit la balance
   */
  setBalance(userId, guildId, amount, location = 'balance') {
    const field = location === 'bank' ? 'bank' : 'balance';
    return this.update(userId, guildId, { [field]: amount });
  }

  /**
   * Transfère de l'argent entre utilisateurs
   */
  transfer(fromUserId, toUserId, guildId, amount) {
    const transfer = this.db.transaction(() => {
      this.removeMoney(fromUserId, guildId, amount, 'balance');
      this.addMoney(toUserId, guildId, amount, 'balance');
    });
    
    return transfer();
  }

  /**
   * Vérifie le cooldown daily
   */
  canDaily(userId, guildId) {
    const user = this.get(userId, guildId);
    if (!user || !user.last_daily) return true;
    
    const lastDaily = new Date(user.last_daily);
    const now = new Date();
    const diff = now - lastDaily;
    
    return diff >= LIMITS.DAILY_COOLDOWN;
  }

  /**
   * Enregistre le daily
   */
  setDaily(userId, guildId) {
    return this.update(userId, guildId, { 
      last_daily: new Date().toISOString() 
    });
  }

  /**
   * Vérifie le cooldown work
   */
  canWork(userId, guildId) {
    const user = this.get(userId, guildId);
    if (!user || !user.last_work) return true;
    
    const lastWork = new Date(user.last_work);
    const now = new Date();
    const diff = now - lastWork;
    
    return diff >= LIMITS.WORK_COOLDOWN;
  }

  /**
   * Enregistre le work
   */
  setWork(userId, guildId) {
    return this.update(userId, guildId, { 
      last_work: new Date().toISOString() 
    });
  }

  // ===== NIVEAUX & XP =====

  /**
   * Ajoute de l'XP
   */
  addXP(userId, guildId, amount) {
    const user = this.getOrCreate(userId, guildId);
    const newXP = (user.xp || 0) + amount;
    const newLevel = this.calculateLevel(newXP);
    
    const leveledUp = newLevel > (user.level || 0);
    
    this.update(userId, guildId, { 
      xp: newXP,
      level: newLevel,
      messages_count: (user.messages_count || 0) + 1,
      last_xp_gain: new Date().toISOString()
    });
    
    return { leveledUp, newLevel, newXP };
  }

  /**
   * Calcule le niveau basé sur l'XP
   */
  calculateLevel(xp) {
    return Math.floor(xp / 100);
  }

  /**
   * Calcule l'XP requis pour le prochain niveau
   */
  xpForNextLevel(level) {
    return (level + 1) * 100;
  }

  /**
   * Vérifie si l'utilisateur peut gagner de l'XP
   */
  canGainXP(userId, guildId) {
    const user = this.get(userId, guildId);
    if (!user || !user.last_xp_gain) return true;
    
    const lastGain = new Date(user.last_xp_gain);
    const now = new Date();
    const diff = now - lastGain;
    
    return diff >= LIMITS.XP_COOLDOWN;
  }

  /**
   * Leaderboard XP
   */
  getLeaderboard(guildId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT user_id, xp, level, messages_count
      FROM users
      WHERE guild_id = ?
      ORDER BY xp DESC
      LIMIT ?
    `);
    return stmt.all(guildId, limit);
  }

  /**
   * Leaderboard économie
   */
  getEconomyLeaderboard(guildId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT user_id, balance, bank, (balance + bank) as total
      FROM users
      WHERE guild_id = ?
      ORDER BY total DESC
      LIMIT ?
    `);
    return stmt.all(guildId, limit);
  }

  /**
   * Position dans le leaderboard
   */
  getRank(userId, guildId) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM users
      WHERE guild_id = ? AND xp > (
        SELECT xp FROM users WHERE user_id = ? AND guild_id = ?
      )
    `);
    return stmt.get(guildId, userId, guildId)?.rank || null;
  }

  /**
   * Statistiques globales
   */
  getStats(guildId) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(balance + bank) as total_economy,
        AVG(level) as avg_level,
        SUM(messages_count) as total_messages
      FROM users
      WHERE guild_id = ?
    `);
    return stmt.get(guildId);
  }
}

export default new UserModel();
