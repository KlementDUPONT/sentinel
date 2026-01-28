import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env (si en local)
dotenv.config();

const config = {
  // Discord
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  ownerId: process.env.OWNER_ID || '',
  
  // Bot config
  version: 'alpha.2',
  environment: process.env.NODE_ENV || 'production',
  prefix: '!',
  
  // Server
  port: parseInt(process.env.PORT) || 8000,
};

// Validation des variables obligatoires
if (!config.token && process.env.NODE_ENV === 'production') {
  console.error('❌ DISCORD_TOKEN is missing in environment variables!');
  console.error('📋 Available env vars:', Object.keys(process.env).filter(key => key.includes('DISCORD')));
}

export default config;
