import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import config from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes')
    .addStringOption(option =>
      option.setName('commande')
        .setDescription('Nom de la commande pour plus d\'informations')
        .setRequired(false)
        .setAutocomplete(true)),

  cooldown: 3,

  async execute(interaction) {
    const commandName = interaction.options.getString('commande');

    if (commandName) {
      return showCommandHelp(interaction, commandName);
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Récupérer toutes les commandes par catégorie
      const categories = {};
      
      interaction.client.commands.forEach(command => {
        const category = command.category || 'Autre';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(command);
      });

      // Créer l'embed principal
      const embed = CustomEmbedBuilder.create(
        `📚 Centre d'aide - ${config.bot.name}`,
        `Utilise \`/help <commande>\` pour plus d'informations sur une commande spécifique.\n\n**Nombre de commandes :** ${interaction.client.commands.size}`,
        {
          thumbnail: interaction.client.user.displayAvatarURL({ size: 256 }),
        }
      );

      // Emojis pour les catégories
      const categoryEmojis = {
        moderation: '🔨',
        economy: '💰',
        levels: '📊',
        utility: '🔧',
        fun: '🎮',
        tickets: '🎫',
        admin: '⚙️',
      };

      // Ajouter chaque catégorie
      Object.keys(categories).sort().forEach(category => {
        const emoji = categoryEmojis[category.toLowerCase()] || '📁';
        const commands = categories[category]
          .map(cmd => `\`/${cmd.data.name}\``)
          .join(', ');
        
        embed.addFields({
          name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          value: commands || 'Aucune commande',
          inline: false,
        });
      });

      embed.addFields({
        name: '🔗 Liens utiles',
        value: [
          '[Support](https://discord.gg/votre-invite)',
          '[Documentation](https://docs.ph03nixcode.fr)',
          '[Site Web](https://ph03nixcode.fr)',
        ].join(' • '),
        inline: false,
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      throw error;
    }
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const commands = interaction.client.commands
      .filter(cmd => cmd.data.name.toLowerCase().includes(focusedValue))
      .map(cmd => ({ name: cmd.data.name, value: cmd.data.name }))
      .slice(0, 25);

    await interaction.respond(commands);
  },
};

async function showCommandHelp(interaction, commandName) {
  const command = interaction.client.commands.get(commandName);

  if (!command) {
    return interaction.reply({
      embeds: [CustomEmbedBuilder.error(
        'Commande introuvable',
        `La commande \`${commandName}\` n'existe pas.`
      )],
      ephemeral: true,
    });
  }

  const embed = CustomEmbedBuilder.create(
    `📖 Aide : /${command.data.name}`,
    command.data.description,
    { color: config.colors.info }
  );

  // Options de la commande
  if (command.data.options && command.data.options.length > 0) {
    const options = command.data.options.map(opt => {
      const required = opt.required ? '`[requis]`' : '`[optionnel]`';
      return `**${opt.name}** ${required}\n└ ${opt.description}`;
    }).join('\n\n');

    embed.addFields({
      name: '📝 Options',
      value: options,
      inline: false,
    });
  }

  // Permissions requises
  if (command.permissions && command.permissions.length > 0) {
    embed.addFields({
      name: '🔐 Permissions requises',
      value: command.permissions.map(p => `\`${p}\``).join(', '),
      inline: false,
    });
  }

  // Cooldown
  if (command.cooldown) {
    embed.addFields({
      name: '⏱️ Cooldown',
      value: `${command.cooldown} seconde(s)`,
      inline: true,
    });
  }

  // Catégorie
  if (command.category) {
    embed.addFields({
      name: '📁 Catégorie',
      value: command.category,
      inline: true,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
