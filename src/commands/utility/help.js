import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Afficher le menu d\'aide'),

  category: 'utility',

  async execute(interaction) {
    const { client } = interaction;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📚 Aide - Sentinel Bot')
      .setDescription('Liste des commandes disponibles')
      .addFields(
        {
          name: '⚙️ Admin',
          value: '`/config` `/reload` `/setup`',
          inline: false
        },
        {
          name: '💰 Économie',
          value: '`/balance` `/daily` `/work` `/pay` `/leaderboard`',
          inline: false
        },
        {
          name: '🛡️ Modération',
          value: '`/ban` `/kick` `/warn` `/warnings` `/clearwarns` `/removewarn` `/clear`',
          inline: false
        },
        {
          name: '🎮 Fun',
          value: '`/8ball` `/coinflip` `/dice`',
          inline: false
        },
        {
          name: '📊 Niveaux',
          value: '`/rank`',
          inline: false
        },
        {
          name: '🔧 Utilitaire',
          value: '`/help` `/ping` `/avatar` `/userinfo` `/serverinfo`',
          inline: false
        }
      )
      .setFooter({
        text: 'Sentinel Bot • Version alpha.2',
        iconURL: client.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
