import logger from '../../utils/logger.js';

// Cache pour le cooldown XP (1 minute par utilisateur)
const xpCooldowns = new Map();

export default {
    name: 'messageCreate',
    category: 'message',

    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const db = message.client.db;
        const userId = message.author.id;
        const guildId = message.guild.id;
        const cooldownKey = `${guildId}-${userId}`;

        // 1. Vérification du cooldown en RAM (beaucoup plus rapide que SQL)
        const now = Date.now();
        if (xpCooldowns.has(cooldownKey)) {
            const expirationTime = xpCooldowns.get(cooldownKey) + 60000; // 60s
            if (now < expirationTime) return; // L'utilisateur gagne de l'XP trop vite
        }

        try {
            // 2. S'assurer que l'user existe
            let userData = db.getUser(userId, guildId);
            if (!userData) {
                db.createUser(userId, guildId);
                userData = { xp: 0, level: 0 };
            }

            // 3. Calcul du gain
            const xpGain = Math.floor(Math.random() * 11) + 15; // 15-25 XP
            const newXp = (userData.xp || 0) + xpGain;
            const currentLevel = userData.level || 0;
            const newLevel = Math.floor(newXp / 100);

            // 4. Mise à jour Database
            db.updateUserXP(userId, guildId, newLevel, newXp);

            // Mettre à jour le cooldown dans la Map
            xpCooldowns.set(cooldownKey, now);

            // 5. Notification de Level Up
            if (newLevel > currentLevel) {
                await message.channel.send(`🎊 Bravo ${message.author}, tu passes au **niveau ${newLevel}** !`);
            }

        } catch (error) {
            logger.error('XP System Error:', error.message);
        }
    }
};