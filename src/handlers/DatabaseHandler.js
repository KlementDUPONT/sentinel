import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
        // Colonnes obligatoires pour le bon fonctionnement de la v2.0.2-beta.1
        this.supportedColumns = [
            'guild_id', 
            'name', 
            'prefix', 
            'verification_channel', 
            'verification_role'
        ];
    }

    async initialize() {
        try {
            this.db = dbConnection.connect();

            // 1. Création de la table de base si inexistante
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS guilds (
                    guild_id TEXT PRIMARY KEY,
                    name TEXT,
                    prefix TEXT DEFAULT '!'
                );
            `);

            // 2. Vérification et ajout automatique des colonnes manquantes (Migration Auto)
            this.syncSchema();
            
            logger.info('✅ DatabaseHandler : Schéma synchronisé et prêt pour la vérification.');
            return this.db;
        } catch (error) {
            logger.error('❌ DatabaseHandler Error during initialization:', error);
            throw error;
        }
    }

    /**
     * Vérifie si les colonnes de vérification existent, sinon les ajoute.
     * Cela évite les erreurs "no such column" lors de la synchronisation.
     */
    syncSchema() {
        const columns = this.db.prepare("PRAGMA table_info(guilds)").all().map(c => c.name);
        
        const missingColumns = [
            { name: 'verification_channel', type: 'TEXT' },
            { name: 'verification_role', type: 'TEXT' }
        ];

        for (const col of missingColumns) {
            if (!columns.includes(col.name)) {
                this.db.exec(`ALTER TABLE guilds ADD COLUMN ${col.name} ${col.type};`);
                logger.info(`🛠️ Migration : Colonne ajoutée -> ${col.name}`);
            }
        }
    }

    /**
     * Enregistre ou met à jour un serveur (utilisé lors du clientReady)
     */
    createGuild(guildId, guildName) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO guilds (guild_id, name) 
                VALUES (?, ?) 
                ON CONFLICT(guild_id) DO UPDATE SET name = excluded.name
            `);
            return stmt.run(guildId, guildName);
        } catch (err) {
            logger.error(`❌ Erreur SQL pour le serveur ${guildName} (${guildId}):`, err.message);
            throw err; 
        }
    }

    /**
     * Met à jour la configuration de vérification
     */
    updateVerification(guildId, channelId, roleId) {
        return this.db.prepare(`
            UPDATE guilds SET verification_channel = ?, verification_role = ? WHERE guild_id = ?
        `).run(channelId, roleId, guildId);
    }

    /**
     * Récupère les données d'un serveur
     */
    getGuild(guildId) {
        return this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(guildId);
    }

    /**
     * Statistiques pour le Dashboard
     */
    getStats() {
        try {
            const row = this.db.prepare('SELECT COUNT(*) as count FROM guilds').get();
            return { guilds: row?.count || 0, users: "Beta", warns: 0 };
        } catch (e) {
            return { guilds: 0, users: 0, warns: 0 };
        }
    }
}

export default new DatabaseHandler();