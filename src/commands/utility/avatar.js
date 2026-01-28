import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Affiche l\'avatar d\'un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur dont afficher l\'avatar')
        .setRequired(false)),

  cooldown: 3,

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;

    const embed = CustomEmbedBuilder.create(
      `🖼️ Avatar de ${targetUser.tag}`,
      `[PNG](${targetUser.displayAvatarURL({ extension: 'png', size: 4096 })}) • [JPG](${targetUser.displayAvatarURL({ extension: 'jpg', size: 4096 })}) • [WEBP](${targetUser.displayAvatarURL({ extension: 'webp', size: 4096 })})`,
      {
        image: targetUser.displayAvatarURL({ dynamic: true, size: 4096 }),
      }
    );

    await interaction.reply({ embeds: [embed] });
  },
};
