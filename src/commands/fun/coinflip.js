import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Lance une pièce'),

  cooldown: 2,

  async execute(interaction) {
    const result = Math.random() < 0.5 ? 'Pile' : 'Face';
    const emoji = result === 'Pile' ? '🪙' : '💿';

    const embed = CustomEmbedBuilder.create(
      `${emoji} ${result} !`,
      `${interaction.user} a lancé une pièce et a obtenu **${result}** !`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
