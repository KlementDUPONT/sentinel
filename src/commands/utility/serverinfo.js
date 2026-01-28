import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Affiche les informations du serveur'),

  guildOnly: true,
  cooldown: 5,

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const { guild } = interaction;
      await guild.members.fetch();

      const embed = CustomEmbedBuilder.create(
        `📊 Informations sur ${guild.name}`,
        null,
        {
          thumbnail: guild.iconURL({ dynamic: true, size: 512 }),
        }
      );

      // Informations générales
      embed.addFields({
        name: '📋 Informations générales',
        value: [
          `**Nom :** ${guild.name}`,
          `**ID :** \`${guild.id}\``,
          `**Propriétaire :** <@${guild.ownerId}>`,
          `**Créé le :** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
          `**Région :** ${guild.preferredLocale}`,
        ].join('\n'),
        inline: false,
      });

      // Statistiques
      const channels = guild.channels.cache;
      const members = guild.members.cache;
      const emojis = guild.emojis.cache;
      const stickers = guild.stickers.cache;

      embed.addFields({
        name: '📊 Statistiques',
        value: [
          `**Membres :** ${members.size}`,
          `**Humains :** ${members.filter(m => !m.user.bot).size}`,
          `**Bots :** ${members.filter(m => m.user.bot).size}`,
          `**Salons :** ${channels.size}`,
          `**Rôles :** ${guild.roles.cache.size}`,
          `**Emojis :** ${emojis.size}`,
          `**Stickers :** ${stickers.size}`,
        ].join('\n'),
        inline: true,
      });

      // Salons
      embed.addFields({
        name: '💬 Salons',
        value: [
          `**Texte :** ${channels.filter(c => c.type === 0).size}`,
          `**Vocal :** ${channels.filter(c => c.type === 2).size}`,
          `**Annonces :** ${channels.filter(c => c.type === 5).size}`,
          `**Forums :** ${channels.filter(c => c.type === 15).size}`,
          `**Catégories :** ${channels.filter(c => c.type === 4).size}`,
        ].join('\n'),
        inline: true,
      });

      // Boost
      embed.addFields({
        name: '💎 Boost',
        value: [
          `**Niveau :** ${guild.premiumTier || 0}`,
          `**Boosts :** ${guild.premiumSubscriptionCount || 0}`,
          `**Boosteurs :** ${members.filter(m => m.premiumSince).size}`,
        ].join('\n'),
        inline: true,
      });

      // Sécurité
      const verificationLevels = {
        0: 'Aucune',
        1: 'Faible',
        2: 'Moyenne',
        3: 'Élevée',
        4: 'Très élevée',
      };

      embed.addFields({
        name: '🔒 Sécurité',
        value: [
          `**Vérification :** ${verificationLevels[guild.verificationLevel]}`,
          `**Filtre de contenu :** ${guild.explicitContentFilter === 0 ? 'Désactivé' : guild.explicitContentFilter === 1 ? 'Sans rôle' : 'Tous'}`,
          `**MFA requis :** ${guild.mfaLevel === 1 ? 'Oui' : 'Non'}`,
        ].join('\n'),
        inline: false,
      });

      // Bannière et icône
      const links = [];
      if (guild.iconURL()) links.push(`[Icône](${guild.iconURL({ size: 4096 })})`);
      if (guild.bannerURL()) links.push(`[Bannière](${guild.bannerURL({ size: 4096 })})`);
      if (guild.splashURL()) links.push(`[Splash](${guild.splashURL({ size: 4096 })})`);

      if (links.length > 0) {
        embed.addFields({
          name: '🖼️ Liens',
          value: links.join(' • '),
          inline: false,
        });
      }

      if (guild.bannerURL()) {
        embed.setImage(guild.bannerURL({ size: 1024 }));
      }

      embed.setFooter({ text: `ID: ${guild.id}` });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      throw error;
    }
  },
};
