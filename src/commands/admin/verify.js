import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Se vérifier pour accéder au serveur'),

  category: 'admin',
  cooldown: 10,

  async execute(interaction) {
    const { client, guild, member } = interaction;

    try {
      // Récupérer la configuration
      const guildData = client.db.getGuild(guild.id);

      if (!guildData || !guildData.verification_channel || !guildData.verification_role) {
        return await interaction.reply({
          content: '❌ Le système de vérification n\'est pas configuré sur ce serveur.',
          flags: 64
        });
      }

      // Vérifier si l'utilisateur a déjà le rôle
      if (member.roles.cache.has(guildData.verification_role)) {
        return await interaction.reply({
          content: '✅ Vous êtes déjà vérifié !',
          flags: 64
        });
      }

      // Vérifier si on est dans le bon salon
      if (interaction.channel.id !== guildData.verification_channel) {
        const verificationChannel = guild.channels.cache.get(guildData.verification_channel);
        return await interaction.reply({
          content: '❌ Vous devez utiliser cette commande dans ' + (verificationChannel ? verificationChannel.toString() : 'le salon de vérification') + '.',
          flags: 64
        });
      }

      // Générer un CAPTCHA simple avec boutons
      const correctButton = Math.floor(Math.random() * 4); // 0 à 3
      const emojis = ['🔴', '🟢', '🔵', '🟡'];
      const correctEmoji = emojis[correctButton];

      const buttons = new ActionRowBuilder();
      
      for (let i = 0; i < 4; i++) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId('verify_' + i + '_' + member.id + '_' + correctButton)
            .setEmoji(emojis[i])
            .setStyle(i === correctButton ? ButtonStyle.Success : ButtonStyle.Secondary)
        );
      }

      const embed = {
        color: 0x5865f2,
        title: '🔐 Vérification CAPTCHA',
        description: '**Cliquez sur le bouton ' + correctEmoji + ' pour vous vérifier !**\n\nVous avez 30 secondes.',
        footer: {
          text: 'Sentinel Bot',
          icon_url: client.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({
        embeds: [embed],
        components: [buttons],
        flags: 64
      });

    } catch (error) {
      console.error('Erreur dans verify:', error);
      
      await interaction.reply({
        content: '❌ Une erreur est survenue.',
        flags: 64
      });
    }
  },
};
