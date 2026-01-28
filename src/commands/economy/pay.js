import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';
import Validator from '../../utils/validator.js';
import { RESPONSE_MESSAGES } from '../../config/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Envoie de l\'argent à un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à payer')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('montant')
        .setDescription('Le montant à envoyer')
        .setMinValue(1)
        .setRequired(true)),

  guildOnly: true,
  cooldown: 3,

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('utilisateur');
    const amount = interaction.options.getInteger('montant');

    try {
      // Vérifications de base
      if (targetUser.id === interaction.user.id) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.CANNOT_ACTION_SELF)]
        });
      }

      if (targetUser.bot) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.CANNOT_ACTION_BOT)]
        });
      }

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

      // Vérifier le montant
      if (!Validator.isValidAmount(amount)) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', 'Le montant est invalide.')]
        });
      }

      // Récupérer les utilisateurs
      await Models.User.getOrCreate(interaction.user.id, interaction.guildId);
      await Models.User.getOrCreate(targetUser.id, interaction.guildId);

      const senderBalance = Models.User.getBalance(interaction.user.id, interaction.guildId);

      // Vérifier si l'utilisateur a assez d'argent
      if (senderBalance.balance < amount) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error(
            'Solde insuffisant',
            `Tu n'as pas assez d'argent !\n\n**Ton solde :** ${Validator.formatNumber(senderBalance.balance)} ${guildConfig.currency_symbol}\n**Montant requis :** ${Validator.formatNumber(amount)} ${guildConfig.currency_symbol}`
          )]
        });
      }

      // Effectuer le transfert
      Models.User.transfer(interaction.user.id, targetUser.id, interaction.guildId, amount);

      const newSenderBalance = Models.User.getBalance(interaction.user.id, interaction.guildId);
      const newTargetBalance = Models.User.getBalance(targetUser.id, interaction.guildId);

      // Embed de confirmation
      const embed = CustomEmbedBuilder.success(
        '💸 Transfert effectué',
        `Tu as envoyé **${Validator.formatNumber(amount)} ${guildConfig.currency_symbol}** à ${targetUser}!`
      );

      embed.addFields(
        { 
          name: 'Ton nouveau solde', 
          value: `${Validator.formatNumber(newSenderBalance.balance)} ${guildConfig.currency_symbol}`, 
          inline: true 
        },
        { 
          name: `Solde de ${targetUser.username}`, 
          value: `${Validator.formatNumber(newTargetBalance.balance)} ${guildConfig.currency_symbol}`, 
          inline: true 
        }
      );

      await interaction.editReply({ embeds: [embed] });

      // Notifier le destinataire
      try {
        const dmEmbed = CustomEmbedBuilder.success(
          `💰 Argent reçu dans ${interaction.guild.name}`,
          `${interaction.user.tag} t'a envoyé **${Validator.formatNumber(amount)} ${guildConfig.currency_symbol}** !\n\n**Nouveau solde :** ${Validator.formatNumber(newTargetBalance.balance)} ${guildConfig.currency_symbol}`
        );
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (error) {
        // L'utilisateur a désactivé les DMs
      }

    } catch (error) {
      throw error;
    }
  },
};
