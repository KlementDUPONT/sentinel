import { EmbedBuilder } from 'discord.js';
import logger from '../utils/logger.js';

class ErrorHandler {
    constructor(client) {
        this.client = client;
    }

    async handleInteractionError(error, interaction) {
        logger.error(`❌ Command Error [${interaction.commandName || 'Unknown'}]:`, error);

        // 1. Réponse à l'utilisateur
        const userEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ An unexpected error occurred')
            .setDescription('My developers have been notified. Please try again later.')
            .setTimestamp();

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ embeds: [userEmbed], flags: 64 });
            } else {
                await interaction.reply({ embeds: [userEmbed], flags: 64 });
            }
        } catch (e) {
            logger.error('Failed to send error message to user:', e);
        }

        // 2. Rapport aux développeurs (Log Channel)
        await this.reportToAdmin(error, interaction);
    }

    async reportToAdmin(error, interaction) {
        const db = this.client.db;
        const guildData = db.getGuild(interaction.guildId);

        // On cherche le salon de logs configuré
        const logChannelId = guildData?.log_channel;
        if (!logChannelId) return;

        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        const reportEmbed = new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('🚨 Bug Report')
            .addFields(
                { name: 'Command', value: `/${interaction.commandName || 'Unknown'}`, inline: true },
                { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Error Message', value: `\`\`\`js\n${error.message}\n\`\`\`` },
                { name: 'Stack Trace', value: `\`\`\`js\n${error.stack.slice(0, 1000)}...\n\`\`\`` }
            )
            .setTimestamp();

        await logChannel.send({ content: '⚠️ **New Error Detected!**', embeds: [reportEmbed] });
    }
}

export default ErrorHandler;