import dbConnection from '../connection.js';
import logger from '../../utils/logger.js';
import { randomUUID } from 'crypto';

/**
 * Modèle pour la gestion des tickets
 */
class TicketModel {
  constructor() {
    this.db = dbConnection.getDatabase();
  }

  /**
   * Crée un nouveau ticket
   */
  create(guildId, channelId, userId, category = 'support', subject = null) {
    const ticketId = randomUUID();
    
    const stmt = this.db.prepare(`
      INSERT INTO tickets (ticket_id, guild_id, channel_id, user_id, category, subject)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(ticketId, guildId, channelId, userId, category, subject);
    logger.database('create', `New ticket: ${ticketId} by ${userId}`);
    
    return { ticketId, id: result.lastInsertRowid };
  }

  /**
   * Récupère un ticket par ID
   */
  get(ticketId) {
    const stmt = this.db.prepare('SELECT * FROM tickets WHERE ticket_id = ?');
    return stmt.get(ticketId);
  }

  /**
   * Récupère un ticket par channel ID
   */
  getByChannel(channelId) {
    const stmt = this.db.prepare('SELECT * FROM tickets WHERE channel_id = ?');
    return stmt.get(channelId);
  }

  /**
   * Récupère tous les tickets d'un utilisateur
   */
  getUserTickets(userId, guildId, status = null) {
    let query = 'SELECT * FROM tickets WHERE user_id = ? AND guild_id = ?';
    const params = [userId, guildId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Compte les tickets ouverts d'un utilisateur
   */
  countUserOpenTickets(userId, guildId) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM tickets 
      WHERE user_id = ? AND guild_id = ? AND status = 'open'
    `);
    return stmt.get(userId, guildId).count;
  }

  /**
   * Récupère tous les tickets d'une guilde
   */
  getGuildTickets(guildId, status = null, limit = 50) {
    let query = 'SELECT * FROM tickets WHERE guild_id = ?';
    const params = [guildId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Met à jour un ticket
   */
  update(ticketId, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE tickets 
      SET ${setClause}
      WHERE ticket_id = ?
    `);
    
    return stmt.run([...values, ticketId]);
  }

  /**
   * Claim un ticket
   */
  claim(ticketId, claimedBy) {
    return this.update(ticketId, { claimed_by: claimedBy });
  }

  /**
   * Ferme un ticket
   */
  close(ticketId, closedBy, reason = null) {
    return this.update(ticketId, {
      status: 'closed',
      closed_by: closedBy,
      closed_reason: reason,
      closed_at: new Date().toISOString()
    });
  }

  /**
   * Rouvre un ticket
   */
  reopen(ticketId) {
    return this.update(ticketId, {
      status: 'open',
      closed_by: null,
      closed_reason: null,
      closed_at: null
    });
  }

  /**
   * Supprime un ticket
   */
  delete(ticketId) {
    const stmt = this.db.prepare('DELETE FROM tickets WHERE ticket_id = ?');
    return stmt.run(ticketId);
  }

  /**
   * Ajoute un message au ticket
   */
  addMessage(ticketId, messageId, userId, content) {
    const stmt = this.db.prepare(`
      INSERT INTO ticket_messages (ticket_id, message_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(ticketId, messageId, userId, content);
  }

  /**
   * Récupère les messages d'un ticket
   */
  getMessages(ticketId) {
    const stmt = this.db.prepare(`
      SELECT * FROM ticket_messages 
      WHERE ticket_id = ? 
      ORDER BY created_at ASC
    `);
    return stmt.all(ticketId);
  }

  /**
   * Statistiques des tickets
   */
  getStats(guildId) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(DISTINCT user_id) as unique_users
      FROM tickets
      WHERE guild_id = ?
    `);
    return stmt.get(guildId);
  }

  /**
   * Statistiques par catégorie
   */
  getStatsByCategory(guildId) {
    const stmt = this.db.prepare(`
      SELECT 
        category,
        COUNT(*) as count
      FROM tickets
      WHERE guild_id = ?
      GROUP BY category
    `);
    return stmt.all(guildId);
  }
}

export default new TicketModel();
