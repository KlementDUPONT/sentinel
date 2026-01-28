import { Events } from 'discord.js';
import Models from '../../database/models/index.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import { LIMITS } from '../../config/constants.js';
import logger from '../../utils/logger.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignorer les bots et les DMs
    if (message.author.bot || !message.guild) return;

    try {
      // Récupérer la config de la guilde
      const guildConfig = await Models.Guild.getOrCreate(message.guild.id);

      // Vérifier si le système de niveaux est activé
      if (!guildConfig.levels_enabled) return;

      // Vérifier le cooldown XP
      const canGainXP = Models.User.canGainXP(message.author.id, message.guild.id);
      if (!canGainXP) return;

      // Calculer l'XP à donner
      const xpAmount = Math.floor(
        Math.random() * (LIMITS.XP_PER_MESSAGE.max - LIMITS.XP_PER_MESSAGE.min + 1)
      ) + LIMITS.XP_PER_MESSAGE.min;

      // Ajouter l'XP
      const { leveledUp, newLevel } = Models.User.addXP(
        message.author.id,
        message.guild.id,
        xpAmount
      );

      // Si l'utilisateur a monté de niveau
      if (leveledUp && guildConfig.level_up_channel) {
        const levelUpChannel = message.guild.channels.cache.get(guildConfig.level_up_channel);
        
        if (levelUpChannel) {
          const levelMessage = guildConfig.level_up_message
            .replace('{user}', `<@${message.author.id}>`)
            .replace('{level}', newLevel)
            .replace('{server}', message.guild.name);

          const embed = CustomEmbedBuilder.success(
            '🎉 Level Up!',
            levelMessage
          );

          await levelUpChannel.send({ embeds: [embed] });
        }
      }

    } catch (error) {
      logger.error('Error in messageCreate event (XP system):');
      logger.error(error);
    }
  },
};
