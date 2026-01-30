import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('renew')
    .setDescription('Dupliquer ce salon et supprimer l\'ancien (nettoie l\'historique)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  category: 'moderation',
  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],

  async execute(interaction) {
    const { client, guild, channel, user } = interaction;

    try {
      // Vérifier que c'est un salon textuel
      if (channel.type !== ChannelType.GuildText) {
        return await interaction.reply({
          content: '❌ Cette commande ne fonctionne que dans les salons textuels.',
          flags: 64
        });
      }

      // Demander confirmation
      await interaction.reply({
        content: '⏳ Duplication du salon en cours...',
        flags: 64
      });

      // Cloner le salon avec toutes ses propriétés
      const newChannel = await channel.clone({
        name: channel.name,
        topic: channel.topic,
        nsfw: channel.nsfw,
        rateLimitPerUser: channel.rateLimitPerUser,
        position: channel.position,
        parent: channel.parent,
        permissionOverwrites: channel.permissionOverwrites.cache,
        reason: 'Salon renouvelé par ' + user.tag
      });

      // Envoyer un message dans le nouveau salon
      const embed = {
        color: 0x00ff00,
        title: '✅ Salon renouvelé',
        description: 'Ce salon a été dupliqué et l\'ancien a été supprimé.',
        fields: [
          {
            name: '👮 Modérateur',
            value: user.tag,
            inline: true
          },
          {
            name: '📅 Date',
            value: new Date().toLocaleDateString('fr-FR'),
            inline: true
          }
        ],
        footer: {
          text: 'Sentinel Bot',
          icon_url: client.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
      };

      await newChannel.send({ embeds: [embed] });

      // Log dans le salon de logs
      const guildData = client.db.getGuild(guild.id);
      if (guildData && guildData.log_channel) {
        const logChannel = guild.channels.cache.get(guildData.log_channel);
        if (logChannel) {
          const logEmbed = {
            color: 0xffa500,
            title: '🔄 Salon renouvelé',
            fields: [
              {
                name: '📝 Salon',
                value: channel.name + ' → ' + newChannel.toString(),
                inline: false
              },
              {
                name: '👮 Modérateur',
                value: user.tag + ' (' + user.id + ')',
                inline: true
              },
              {
                name: '📅 Date',
                value: new Date().toLocaleString('fr-FR'),
                inline: true
              }
            ],
            timestamp: new Date().toISOString()
          };

          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      // Supprimer l'ancien salon
      await channel.delete('Salon renouvelé par ' + user.tag);

    } catch (error) {
      console.error('Erreur dans renew:', error);
      
      const errorMsg = {
        content: '❌ Une erreur est survenue lors du renouvellement du salon.',
        flags: 64
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  },
};
