import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-verification')
    .setDescription('Configurer le système de vérification CAPTCHA')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Le salon où les nouveaux membres doivent se vérifier')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Le rôle à donner après vérification')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'admin',
  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageChannels],

  async execute(interaction) {
    const { client, guild } = interaction;
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');

    try {
      // Vérifier que le rôle n'est pas @everyone
      if (role.id === guild.id) {
        return await interaction.reply({
          content: '❌ Vous ne pouvez pas utiliser le rôle @everyone.',
          flags: 64
        });
      }

      // Vérifier la hiérarchie des rôles
      const botMember = guild.members.me;
      if (role.position >= botMember.roles.highest.position) {
        return await interaction.reply({
          content: '❌ Ce rôle est au-dessus ou égal à mon rôle le plus élevé. Je ne peux pas le gérer.',
          flags: 64
        });
      }

      // Sauvegarder la configuration dans la base de données
      const guildData = client.db.getGuild(guild.id);
      
      client.db.db.prepare(
        'UPDATE guilds SET verification_channel = ?, verification_role = ? WHERE guild_id = ?'
      ).run(channel.id, role.id, guild.id);

      // Créer un embed de confirmation
      const embed = {
        color: 0x00ff00,
        title: '✅ Système de vérification configuré',
        description: 'Le système CAPTCHA est maintenant actif !',
        fields: [
          {
            name: '📝 Salon de vérification',
            value: channel.toString(),
            inline: true
          },
          {
            name: '🎭 Rôle membre',
            value: role.toString(),
            inline: true
          },
          {
            name: '📋 Fonctionnement',
            value: '1. Les nouveaux membres arrivent\n2. Ils doivent faire `/verify` dans ' + channel.toString() + '\n3. Ils résolvent un CAPTCHA\n4. Ils reçoivent le rôle ' + role.toString(),
            inline: false
          }
        ],
        footer: {
          text: 'Sentinel Bot',
          icon_url: client.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });

      // Envoyer un message dans le salon de vérification
      try {
        const verificationEmbed = {
          color: 0x5865f2,
          title: '🔐 Vérification obligatoire',
          description: 'Bienvenue sur **' + guild.name + '** !\n\nPour accéder aux autres salons, vous devez vous vérifier en utilisant la commande `/verify`.',
          fields: [
            {
              name: '📝 Comment faire ?',
              value: 'Tapez `/verify` et suivez les instructions.',
              inline: false
            }
          ],
          footer: {
            text: 'Sentinel Bot',
            icon_url: client.user.displayAvatarURL()
          },
          timestamp: new Date().toISOString()
        };

        await channel.send({ embeds: [verificationEmbed] });
      } catch (error) {
        console.error('Erreur envoi message verification:', error);
      }

    } catch (error) {
      console.error('Erreur dans setup-verification:', error);
      
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la configuration.',
        flags: 64
      });
    }
  },
};
