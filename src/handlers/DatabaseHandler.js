// src/handlers/DatabaseHandler.js
import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
        // Liste obligatoire pour que /db-setup ne renvoie plus d'erreur
        this.supportedColumns = ['guild_id', 'name', 'prefix', 'verification_channel', 'verification_role'];
    }

    async initialize() {
        try {
            this.db = dbConnection.connect();

            // Création propre et complète de la table guilds
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS guilds (
                    guild_id TEXT PRIMARY KEY,
                    name TEXT,
                    prefix TEXT DEFAULT '!',
                    verification_channel TEXT,
                    verification_role TEXT
                );
            `);

            logger.info('✅ DatabaseHandler : Système de vérification synchronisé.');
            return this.db;
        } catch (error) {
            logger.error('❌ Erreur critique DatabaseHandler :', error);
            throw error;
        }
    }

    // Utilisation de REPLACE pour éviter tout conflit d'ID
    updateVerification(guildId, channelId, roleId) {
        const stmt = this.db.prepare(`
            UPDATE guilds 
            SET verification_channel = ?, verification_role = ? 
            WHERE guild_id = ?
        `);
        return stmt.run(channelId, roleId, guildId);
    }

    createGuild(guildId, guildName) {
        const stmt = this.db.prepare(`
            INSERT INTO guilds (guild_id, name) VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET name = excluded.name
        `);
        return stmt.run(guildId, guildName);
    }

    getGuild(guildId) {
        return this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(guildId);
    }

    getStats() {
        const guilds = this.db.prepare('SELECT COUNT(*) as count FROM guilds').get()?.count || 0;
        return { guilds, users: "Beta", warns: 0 };
    }
}

export default new DatabaseHandler();