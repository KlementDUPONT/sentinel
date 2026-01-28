import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from './utils/logger.js';
import config from './config/config.js';
import databaseHandler from './handlers/DatabaseHandler.js';
import EventHandler from './handlers/EventHandler.js';
import CommandHandler from './handlers/CommandHandler.js';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SentinelBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
      ],
    });

    this.config = config;
    this.client.config = config;
    this.client.commands = new Collection();
    this.client.cooldowns = new Map();
    this.client.db = databaseHandler;

    this.eventHandler = new EventHandler(this.client);
    this.commandHandler = new CommandHandler(this.client);
  }

  setupHealthCheck() {
    const app = express();
    const port = process.env.PORT || 8000;

    logger.info('🔧 Configuring health check on port ' + port);

    // Health check - répond TOUJOURS
    app.get('/health', (req, res) => {
      logger.info('🏥 Health check request received');
      res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: Date.now(),
        port: port
      });
    });

    app.get('/', (req, res) => {
      logger.info('📡 Root endpoint request received');
      res.status(200).json({
        name: 'Sentinel Bot',
        version: config.version,
        status: this.client.isReady() ? 'online' : 'starting',
        uptime: process.uptime()
      });
    });

    // Démarrer le serveur
    const server = app.listen(port, '0.0.0.0', () => {
      logger.info('✅ Express server listening on 0.0.0.0:' + port);
      logger.info('🔗 Health check available at http://0.0.0.0:' + port + '/health');
    });

    server.on('error', (error) => {
      logger.error('❌ Express server error:', error);
      if (error.code === 'EADDRINUSE') {
        logger.error('⚠️ Port ' + port + ' is already in use!');
        process.exit(1);
      }
    });

    return server;
  }

  async initialize() {
    try {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('🚀 Starting Sentinel Bot...');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('📌 Version: ' + config.version);
      logger.info('🌍 Environment: ' + config.environment);
      logger.info('🔧 Prefix: ' + config.prefix);
      logger.info('🔑 Token: ' + (config.token ? '✅ Found' : '❌ Missing'));
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (!config.token) {
        throw new Error('DISCORD_TOKEN is not defined in environment variables!');
      }

      // Step 1: Initialize database
      logger.info('📦 Step 1/4: Database initialization');
      const dbPath = join(process.cwd(), 'data', 'sentinel.db');
      await databaseHandler.initialize(dbPath);
      logger.info('✅ Database ready');

      // Step 2: Load events
      logger.info('📦 Step 2/4: Loading events');
      const eventsPath = join(__dirname, 'events');
      await this.eventHandler.loadEvents(eventsPath);
      logger.info('✅ Events loaded');

      // Step 3: Load commands
      logger.info('📦 Step 3/4: Loading commands');
      const commandsPath = join(__dirname, 'commands');
      await this.commandHandler.loadCommands(commandsPath);
      logger.info('✅ Commands loaded');

      // Step 4: Connect to Discord
      logger.info('📦 Step 4/4: Connecting to Discord...');
      await this.client.login(config.token);
      logger.info('✅ Discord connection established');

      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('✅ Bot initialization completed successfully');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
      logger.error('❌ Failed to initialize bot:');
      logger.error('Error message: ' + error.message);
      logger.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }
}

// Error handlers
process.on('unhandledRejection', (error) => {
  logger.error('❌ Unhandled Promise Rejection:');
  logger.error(error);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:');
  logger.error(error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

// 🔥 DÉMARRAGE
logger.info('🌟 Starting Sentinel Bot Service...');

const bot = new SentinelBot();

// 1. Démarrer Express EN PREMIER
logger.info('🌐 Step 1: Starting health check server...');
bot.setupHealthCheck();

// 2. Attendre 1 seconde puis initialiser Discord
logger.info('⏳ Step 2: Waiting 1 second before Discord connection...');
setTimeout(async () => {
  logger.info('🤖 Step 3: Initializing Discord bot...');
  await bot.initialize();
}, 1000);

export default bot;
