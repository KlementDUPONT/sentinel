import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';
import Validator from '../../utils/validator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Affiche ton niveau et ton XP')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à vérifier')
        .setRequired(false)),

  guildOnly: true,
  cooldown: 3,

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
    const isSelf = targetUser.id === interaction.user.id;

    try {
      // Récupérer la config de la guilde
      const guildConfig = await Models.Guild.getOrCreate(interaction.guildId);
      
      if (!guildConfig.levels_enabled) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error(
            'Niveaux désactivés',
            'Le système de niveaux est désactivé sur ce serveur.'
          )]
        });
      }

      // Récupérer ou créer l'utilisateur
      const userData = await Models.User.getOrCreate(targetUser.id, interaction.guildId);

      // Récupérer le rang
      const rank = Models.User.getRank(targetUser.id, interaction.guildId);

      // Calculer l'XP pour le prochain niveau
      const currentLevel = userData.level || 0;
      const currentXP = userData.xp || 0;
      const xpForNext = Models.User.xpForNextLevel(currentLevel);
      const xpProgress = currentXP - (currentLevel * 100);
      const percentage = Math.round((xpProgress / 100) * 100);

      // Créer l'embed
      const embed = CustomEmbedBuilder.create(
        `${isSelf ? '📊 Ton profil' : `📊 Profil de ${targetUser.tag}`}`,
        null,
        {
          color: guildConfig.level_color,
          thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 256 })
        }
      );

      embed.addFields(
        { name: '🏆 Rang', value: `#${rank || 'N/A'}`, inline: true },
        { name: '📊 Niveau', value: `${currentLevel}`, inline: true },
        { name: '⭐ XP', value: `${Validator.formatNumber(currentXP)}`, inline: true },
        { 
          name: '📈 Progression', 
          value: `${xpProgress}/${100} XP (${percentage}%)`, 
          inline: false 
        },
        { 
          name: '💬 Messages', 
          value: `${Validator.formatNumber(userData.messages_count || 0)}`, 
          inline: true 
        },
        { 
          name: '🎯 Prochain niveau', 
          value: `${100 - xpProgress} XP restants`, 
          inline: true 
        }
      );

      // Barre de progression visuelle
      const progressBarLength = 20;
      const filledLength = Math.round((percentage / 100) * progressBarLength);
      const emptyLength = progressBarLength - filledLength;
      const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

      embed.addFields({
        name: '\u200b',
        value: `\`${progressBar}\` ${percentage}%`,
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      throw error;
    }
  },
};
