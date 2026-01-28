import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';
import Validator from '../../utils/validator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Travaille pour gagner de l\'argent'),

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
      const canWork = Models.User.canWork(interaction.user.id, interaction.guildId);

      if (!canWork) {
        const userData = Models.User.get(interaction.user.id, interaction.guildId);
        const lastWork = new Date(userData.last_work);
        const nextWork = new Date(lastWork.getTime() + 60 * 60 * 1000); // 1 heure
        const timeLeft = nextWork - Date.now();

        return interaction.editReply({
          embeds: [CustomEmbedBuilder.warning(
            'Déjà travaillé',
            `Tu es fatigué ! Repose-toi un peu.\n\nTu pourras retravailler <t:${Math.floor(nextWork.getTime() / 1000)}:R>`
          )]
        });
      }

      // Calculer le gain
      const minAmount = guildConfig.work_min || 50;
      const maxAmount = guildConfig.work_max || 150;
      const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

      // Jobs aléatoires
      const jobs = [
        { name: 'développeur', emoji: '💻' },
        { name: 'médecin', emoji: '👨‍⚕️' },
        { name: 'professeur', emoji: '👨‍🏫' },
        { name: 'mécanicien', emoji: '🔧' },
        { name: 'chef cuisinier', emoji: '👨‍🍳' },
        { name: 'artiste', emoji: '🎨' },
        { name: 'musicien', emoji: '🎵' },
        { name: 'jardinier', emoji: '🌱' },
        { name: 'policier', emoji: '👮' },
        { name: 'pompier', emoji: '🚒' },
        { name: 'streamer', emoji: '📹' },
        { name: 'YouTubeur', emoji: '📺' },
        { name: 'pilote', emoji: '✈️' },
        { name: 'livreur', emoji: '📦' },
        { name: 'barista', emoji: '☕' },
      ];

      const job = jobs[Math.floor(Math.random() * jobs.length)];

      // Donner l'argent
      Models.User.addMoney(interaction.user.id, interaction.guildId, amount, 'balance');
      Models.User.setWork(interaction.user.id, interaction.guildId);

      const newBalance = Models.User.getBalance(interaction.user.id, interaction.guildId);

      // Embed de confirmation
      const embed = CustomEmbedBuilder.success(
        `${job.emoji} Tu as travaillé comme ${job.name}`,
        `Tu as gagné **${amount} ${guildConfig.currency_symbol}** !\n\n**Nouveau solde :** ${Validator.formatNumber(newBalance.balance)} ${guildConfig.currency_symbol}`
      );

      embed.setFooter({ text: 'Tu pourras retravailler dans 1 heure' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      throw error;
    }
  },
};
