import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify yourself to access the server'),

  category: 'admin',

  async execute(interaction) {
    try {
      const db = interaction.client.db;

      if (!db || !db.db) {
        return interaction.reply({
          content: '❌ Verification system is not available.',
          ephemeral: true
        });
      }

      // Récupérer la config du serveur
      const guild = db.db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(interaction.guildId);

      if (!guild || !guild.verification_channel || !guild.verification_role) {
        return interaction.reply({
          content: '❌ Verification system is not configured on this server.\n\nAsk an admin to run `/db-setup` and `/setup-verification` first.',
          ephemeral: true
        });
      }

      // Vérifier si on est dans le bon salon
      if (interaction.channelId !== guild.verification_channel) {
        const channel = interaction.guild.channels.cache.get(guild.verification_channel);
        return interaction.reply({
          content: `❌ You can only verify yourself in ${channel || 'the verification channel'}.`,
          ephemeral: true
        });
      }

      // Vérifier si l'utilisateur a déjà le rôle
      const member = interaction.member;
      if (member.roles.cache.has(guild.verification_role)) {
        return interaction.reply({
          content: '✅ You are already verified!',
          ephemeral: true
        });
      }

      // Créer les boutons de vérification
      const colors = ['🔴', '🔵', '🟢', '🟡'];
      const correctColor = colors[Math.floor(Math.random() * colors.length)];

      const buttons = colors.map(color => {
        return new ButtonBuilder()
          .setCustomId(`verify_${color === correctColor ? 'correct' : 'wrong'}_${interaction.user.id}`)
          .setLabel(color)
          .setStyle(color === correctColor ? ButtonStyle.Success : ButtonStyle.Secondary);
      });

      // Mélanger les boutons
      buttons.sort(() => Math.rand
