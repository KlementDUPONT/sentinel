import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Pose une question à la boule magique')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Ta question')
        .setRequired(true)),

  cooldown: 3,

  async execute(interaction) {
    const question = interaction.options.getString('question');

    const responses = [
      // Positives
      'Oui, absolument !',
      'C\'est certain.',
      'Sans aucun doute.',
      'Oui, définitivement.',
      'Tu peux compter dessus.',
      'Selon moi, oui.',
      'Très probablement.',
      'Les signes pointent vers oui.',
      'Oui.',
      'Les perspectives sont bonnes.',
      
      // Neutres
      'Réponse floue, réessaie.',
      'Demande à nouveau plus tard.',
      'Mieux vaut ne pas te le dire maintenant.',
      'Impossible de prédire maintenant.',
      'Concentre-toi et redemande.',
      
      // Négatives
      'N\'y compte pas.',
      'Ma réponse est non.',
      'Mes sources disent non.',
      'Les perspectives ne sont pas bonnes.',
      'Très douteux.',
      'Non.',
      'Certainement pas.',
    ];

    const answer = responses[Math.floor(Math.random() * responses.length)];

    const embed = CustomEmbedBuilder.create(
      '🎱 Boule magique',
      null
    );

    embed.addFields(
      { name: '❓ Question', value: question, inline: false },
      { name: '💭 Réponse', value: answer, inline: false }
    );

    await interaction.reply({ embeds: [embed] });
  },
};
