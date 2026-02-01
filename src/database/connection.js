import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import config from '../config/config.js';

export default {
    connect() {
        const dbPath = config.databasePath || './data/sentinel.db';
        
        // Sécurité : Créer le dossier s'il n'existe pas
        try {
            mkdirSync(dirname(dbPath), { recursive: true });
        } catch (err) {
            // Dossier déjà existant ou erreur de permissions
        }

        return new Database(dbPath, { 
            verbose: console.log, // Pour voir les requêtes SQL dans tes logs Railway
            fileMustExist: false 
        });
    }
};