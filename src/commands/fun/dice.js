import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Lance un dé')
    .addIntegerOption(option =>
      option.setName('faces')
        .setDescription('Nombre de faces du dé (par défaut: 6)')
        .setMinValue(2)
        .setMaxValue(100)
        .setRequired(false)),

  cooldown: 2,

  async execute(interaction) {
    const faces = interaction.options.getInteger('faces') || 6;
    const result = Math.floor(Math.random() * faces) + 1;

    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const emoji = faces === 6 ? diceEmojis[result - 1] : '🎲';

    const embed = CustomEmbedBuilder.create(
      `${emoji} Résultat : ${result}`,
      `${interaction.user} a lancé un dé à ${faces} faces et a obtenu **${result}** !`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
