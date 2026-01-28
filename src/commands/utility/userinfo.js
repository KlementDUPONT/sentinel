import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import config from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Affiche les informations d\'un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à vérifier')
        .setRequired(false)),

  guildOnly: true,
  cooldown: 3,

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id);

    try {
      const embed = CustomEmbedBuilder.create(
        `👤 Informations sur ${targetUser.tag}`,
        null,
        {
          thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 512 }),
          color: member.displayHexColor !== '#000000' ? member.displayHexColor : config.getRandomColor(),
        }
      );

      // Informations générales
      embed.addFields({
        name: '📋 Informations générales',
        value: [
          `**Pseudo :** ${targetUser.tag}`,
          `**ID :** \`${targetUser.id}\``,
          `**Surnom :** ${member.nickname || 'Aucun'}`,
          `**Bot :** ${targetUser.bot ? 'Oui' : 'Non'}`,
          `**Compte créé :** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
        ].join('\n'),
        inline: false,
      });

      // Informations sur le serveur
      embed.addFields({
        name: '🏠 Sur ce serveur',
        value: [
          `**A rejoint :** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
          `**Position :** ${[...interaction.guild.members.cache.filter(m => !m.user.bot).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp).keys()].indexOf(member.id) + 1}/${interaction.guild.memberCount}`,
          `**Boosteur :** ${member.premiumSince ? `Oui (depuis <t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>)` : 'Non'}`,
        ].join('\n'),
        inline: false,
      });

      // Rôles
      const roles = member.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .slice(0, 15);

      embed.addFields({
        name: `🎭 Rôles [${member.roles.cache.size - 1}]`,
        value: roles.length > 0 ? roles.join(', ') : 'Aucun rôle',
        inline: false,
      });

      // Permissions clés
      const keyPermissions = [];
      if (member.permissions.has('Administrator')) keyPermissions.push('Administrateur');
      if (member.permissions.has('ManageGuild')) keyPermissions.push('Gérer le serveur');
      if (member.permissions.has('ManageRoles')) keyPermissions.push('Gérer les rôles');
      if (member.permissions.has('ManageChannels')) keyPermissions.push('Gérer les salons');
      if (member.permissions.has('KickMembers')) keyPermissions.push('Expulser');
      if (member.permissions.has('BanMembers')) keyPermissions.push('Bannir');
      if (member.permissions.has('ModerateMembers')) keyPermissions.push('Modérer');

      if (keyPermissions.length > 0) {
        embed.addFields({
          name: '🔑 Permissions clés',
          value: keyPermissions.map(p => `\`${p}\``).join(', '),
          inline: false,
        });
      }

      // Avatar et bannière
      const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 4096 });
      embed.addFields({
        name: '🖼️ Liens',
        value: `[Avatar](${avatarURL})`,
        inline: false,
      });

      embed.setFooter({ text: `ID: ${targetUser.id}` });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      throw error;
    }
  },
};
