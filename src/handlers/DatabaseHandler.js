import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import { join, dirname } from 'path';

class DatabaseHandler {
    constructor() {
        this.db = null;
    }

    async initialize() {
        try {
            // Utilise le singleton centralisé
            this.db = dbConnection.connect();
            logger.info('✅ DatabaseHandler linked to central connection');
            return this.db;
        } catch (error) {
            logger.error('❌ Failed to initialize DatabaseHandler:', error);
            throw error;
        }
    }

    // --- Méthodes Guild ---
    getGuild(guildId) {
        return this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(guildId);
    }

    createGuild(guildId, guildName) {
        return this.db.prepare(`
            INSERT INTO guilds (guild_id, name) 
            VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET name = excluded.name
        `).run(guildId, guildName);
    }

    // --- Méthodes User (XP & Économie) ---
    getUser(userId, guildId) {
        return this.db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    }

    createUser(userId, guildId) {
        return this.db.prepare(`
            INSERT INTO users (user_id, guild_id) 
            VALUES (?, ?)
            ON CONFLICT(user_id, guild_id) DO NOTHING
        `).run(userId, guildId);
    }

    updateUserXP(userId, guildId, level, xp) {
        return this.db.prepare(`
            UPDATE users SET level = ?, xp = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = ? AND guild_id = ?
        `).run(level, xp, userId, guildId);
    }
}

export default new DatabaseHandler();