import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';
import Validator from '../../utils/validator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche le classement')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type de classement')
        .addChoices(
          { name: '💰 Économie', value: 'economy' },
          { name: '⭐ Niveaux', value: 'levels' }
        )
        .setRequired(false)),

  guildOnly: true,
  cooldown: 5,

  async execute(interaction) {
    await interaction.deferReply();

    const type = interaction.options.getString('type') || 'levels';

    try {
      const guildConfig = await Models.Guild.getOrCreate(interaction.guildId);

      if (type === 'economy') {
        if (!guildConfig.economy_enabled) {
          return interaction.editReply({
            embeds: [CustomEmbedBuilder.error(
              'Économie désactivée',
              'Le système d\'économie est désactivé sur ce serveur.'
            )]
          });
        }

        const leaderboard = Models.User.getEconomyLeaderboard(interaction.guildId, 10);

        if (leaderboard.length === 0) {
          return interaction.editReply({
            embeds: [CustomEmbedBuilder.info(
              'Classement vide',
              'Aucune donnée disponible pour le moment.'
            )]
          });
        }

        const embed = CustomEmbedBuilder.leaderboard(
          `Classement économie - ${interaction.guild.name}`,
          leaderboard,
          'economy'
        );

        await interaction.editReply({ embeds: [embed] });

      } else {
        if (!guildConfig.levels_enabled) {
          return interaction.editReply({
            embeds: [CustomEmbedBuilder.error(
              'Niveaux désactivés',
              'Le système de niveaux est désactivé sur ce serveur.'
            )]
          });
        }

        const leaderboard = Models.User.getLeaderboard(interaction.guildId, 10);

        if (leaderboard.length === 0) {
          return interaction.editReply({
            embeds: [CustomEmbedBuilder.info(
              'Classement vide',
              'Aucune donnée disponible pour le moment.'
            )]
          });
        }

        const embed = CustomEmbedBuilder.leaderboard(
          `Classement niveaux - ${interaction.guild.name}`,
          leaderboard,
          'xp'
        );

        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      throw error;
    }
  },
};
