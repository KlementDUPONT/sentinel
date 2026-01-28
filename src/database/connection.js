import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Singleton pour gérer la connexion à la base de données SQLite
 */
class DatabaseConnection {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Initialise la connexion à la base de données
   */
  connect() {
    if (this.isConnected && this.db) {
      logger.warn('Database already connected');
      return this.db;
    }

    try {
      // Définir le chemin de la base de données
      const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../data/sentinel.db');
      const dbDir = dirname(dbPath);

      // Créer le dossier data s'il n'existe pas
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
        logger.info(`📁 Created database directory: ${dbDir}`);
      }

      // Créer la connexion
      this.db = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? logger.debug : null,
      });

      // Configuration de la base de données
      this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging
      this.db.pragma('foreign_keys = ON'); // Activer les clés étrangères

      this.isConnected = true;
      logger.info(`✅ Database connected: ${dbPath}`);

      // NE PLUS APPELER initializeTables() ici
      // Les tables seront créées par les migrations

      return this.db;
    } catch (error) {
      logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Récupère l'instance de la base de données (avec auto-connect)
   */
  getDatabase() {
    if (!this.db || !this.isConnected) {
      logger.warn('⚠️ Database not connected. Auto-connecting...');
      this.connect();
    }

    if (!this.db) {
      throw new Error('Failed to auto-connect to database.');
    }

    return this.db;
  }

  /**
   * Ferme la connexion à la base de données
   */
  close() {
    if (this.db && this.isConnected) {
      this.db.close();
      this.isConnected = false;
      this.db = null;
      logger.info('👋 Database connection closed');
    }
  }

  /**
   * Vérifie si la connexion est active
   */
  isConnectedToDatabase() {
    return this.isConnected && this.db !== null;
  }
}

// Export singleton
const dbConnection = new DatabaseConnection();
export default dbConnection;
