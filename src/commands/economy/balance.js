import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';
import Validator from '../../utils/validator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Affiche le solde d\'un utilisateur')
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
      
      if (!guildConfig.economy_enabled) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error(
            'Économie désactivée',
            'Le système d\'économie est désactivé sur ce serveur.'
          )]
        });
      }

      // Récupérer ou créer l'utilisateur
      const userData = await Models.User.getOrCreate(targetUser.id, interaction.guildId);
      const balance = Models.User.getBalance(targetUser.id, interaction.guildId);

      // Créer l'embed
      const embed = CustomEmbedBuilder.economy(
        `${isSelf ? 'Votre solde' : `Solde de ${targetUser.tag}`}`,
        targetUser,
        balance.balance,
        balance.bank,
        guildConfig.currency_symbol
      );

      // Ajouter des stats supplémentaires
      embed.addFields(
        { 
          name: '📊 Statistiques', 
          value: [
            `**Total gagné :** ${Validator.formatNumber(userData.total_earned || 0)} ${guildConfig.currency_symbol}`,
            `**Total dépensé :** ${Validator.formatNumber(userData.total_spent || 0)} ${guildConfig.currency_symbol}`,
          ].join('\n'),
          inline: false 
        }
      );

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      throw error;
    }
  },
};
