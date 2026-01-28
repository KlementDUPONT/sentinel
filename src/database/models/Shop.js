import dbConnection from '../connection.js';
import logger from '../../utils/logger.js';
import { randomUUID } from 'crypto';

/**
 * Modèle pour la gestion de la boutique
 */
class ShopModel {
  constructor() {
    this.db = dbConnection.getDatabase();
  }

  /**
   * Crée un item dans la boutique
   */
  createItem(guildId, name, description, price, roleId = null, stock = -1) {
    const itemId = randomUUID();
    
    const stmt = this.db.prepare(`
      INSERT INTO shop_items (item_id, guild_id, name, description, price, role_id, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(itemId, guildId, name, description, price, roleId, stock);
    logger.database('create', `New shop item: ${name} (${itemId})`);
    
    return { itemId, id: result.lastInsertRowid };
  }

  /**
   * Récupère un item
   */
  getItem(itemId) {
    const stmt = this.db.prepare('SELECT * FROM shop_items WHERE item_id = ?');
    return stmt.get(itemId);
  }

  /**
   * Récupère tous les items d'une guilde
   */
  getGuildItems(guildId, buyableOnly = false) {
    let query = 'SELECT * FROM shop_items WHERE guild_id = ?';
    if (buyableOnly) {
      query += ' AND buyable = 1';
    }
    query += ' ORDER BY price ASC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(guildId);
  }

  /**
   * Met à jour un item
   */
  updateItem(itemId, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE shop_items 
      SET ${setClause}
      WHERE item_id = ?
    `);
    
    return stmt.run([...values, itemId]);
  }

  /**
   * Supprime un item
   */
  deleteItem(itemId) {
    const stmt = this.db.prepare('DELETE FROM shop_items WHERE item_id = ?');
    return stmt.run(itemId);
  }

  /**
   * Décrémente le stock
   */
  decrementStock(itemId, quantity = 1) {
    const stmt = this.db.prepare(`
      UPDATE shop_items 
      SET stock = stock - ? 
      WHERE item_id = ? AND stock > 0
    `);
    return stmt.run(quantity, itemId);
  }

  /**
   * Vérifie si un item est disponible
   */
  isAvailable(itemId) {
    const item = this.getItem(itemId);
    if (!item) return false;
    return item.buyable === 1 && (item.stock === -1 || item.stock > 0);
  }

  // ===== INVENTAIRE =====

  /**
   * Ajoute un item à l'inventaire
   */
  addToInventory(userId, guildId, itemId, quantity = 1) {
    const existing = this.getInventoryItem(userId, guildId, itemId);
    
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE inventory 
        SET quantity = quantity + ? 
        WHERE user_id = ? AND guild_id = ? AND item_id = ?
      `);
      return stmt.run(quantity, userId, guildId, itemId);
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO inventory (user_id, guild_id, item_id, quantity)
        VALUES (?, ?, ?, ?)
      `);
      return stmt.run(userId, guildId, itemId, quantity);
    }
  }

  /**
   * Retire un item de l'inventaire
   */
  removeFromInventory(userId, guildId, itemId, quantity = 1) {
    const existing = this.getInventoryItem(userId, guildId, itemId);
    
    if (!existing) return null;
    
    const newQuantity = existing.quantity - quantity;
    
    if (newQuantity <= 0) {
      const stmt = this.db.prepare(`
        DELETE FROM inventory 
        WHERE user_id = ? AND guild_id = ? AND item_id = ?
      `);
      return stmt.run(userId, guildId, itemId);
    } else {
      const stmt = this.db.prepare(`
        UPDATE inventory 
        SET quantity = ? 
        WHERE user_id = ? AND guild_id = ? AND item_id = ?
      `);
      return stmt.run(newQuantity, userId, guildId, itemId);
    }
  }

  /**
   * Récupère un item de l'inventaire
   */
  getInventoryItem(userId, guildId, itemId) {
    const stmt = this.db.prepare(`
      SELECT * FROM inventory 
      WHERE user_id = ? AND guild_id = ? AND item_id = ?
    `);
    return stmt.get(userId, guildId, itemId);
  }

  /**
   * Récupère l'inventaire complet d'un utilisateur
   */
  getInventory(userId, guildId) {
    const stmt = this.db.prepare(`
      SELECT i.*, s.name, s.description, s.price
      FROM inventory i
      JOIN shop_items s ON i.item_id = s.item_id
      WHERE i.user_id = ? AND i.guild_id = ?
      ORDER BY i.acquired_at DESC
    `);
    return stmt.all(userId, guildId);
  }

  /**
   * Compte les items dans l'inventaire
   */
  countInventory(userId, guildId) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory 
      WHERE user_id = ? AND guild_id = ?
    `);
    return stmt.get(userId, guildId).count;
  }

  /**
   * Vérifie si un utilisateur possède un item
   */
  hasItem(userId, guildId, itemId) {
    const item = this.getInventoryItem(userId, guildId, itemId);
    return item && item.quantity > 0;
  }
}

export default new ShopModel();
