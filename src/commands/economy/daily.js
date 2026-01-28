import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';
import Validator from '../../utils/validator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Récupère ta récompense quotidienne'),

  guildOnly: true,
  cooldown: 3,

  async execute(interaction) {
    await interaction.deferReply();

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
      await Models.User.getOrCreate(interaction.user.id, interaction.guildId);

      // Vérifier le cooldown
      const canClaim = Models.User.canDaily(interaction.user.id, interaction.guildId);

      if (!canClaim) {
        const userData = Models.User.get(interaction.user.id, interaction.guildId);
        const lastDaily = new Date(userData.last_daily);
        const nextDaily = new Date(lastDaily.getTime() + 24 * 60 * 60 * 1000);
        const timeLeft = nextDaily - Date.now();

        return interaction.editReply({
          embeds: [CustomEmbedBuilder.warning(
            'Déjà réclamé',
            `Tu as déjà réclamé ta récompense quotidienne !\n\nProchaine récompense : <t:${Math.floor(nextDaily.getTime() / 1000)}:R>`
          )]
        });
      }

      // Donner la récompense
      const amount = guildConfig.daily_amount || 100;
      Models.User.addMoney(interaction.user.id, interaction.guildId, amount, 'balance');
      Models.User.setDaily(interaction.user.id, interaction.guildId);

      const newBalance = Models.User.getBalance(interaction.user.id, interaction.guildId);

      // Embed de confirmation
      const embed = CustomEmbedBuilder.success(
        '🎁 Récompense quotidienne',
        `Tu as reçu **${amount} ${guildConfig.currency_symbol}** !\n\n**Nouveau solde :** ${Validator.formatNumber(newBalance.balance)} ${guildConfig.currency_symbol}`
      );

      embed.setFooter({ text: 'Reviens demain pour ta prochaine récompense !' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      throw error;
    }
  },
};
