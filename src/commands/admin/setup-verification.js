// src/commands/admin/setup-verification.js
import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('setup-verification')
    .setDescription('Configure le salon de vérification')
    .addChannelOption(opt => opt.setName('channel').setDescription('Salon').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Rôle').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    try {
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');

        // On enregistre d'abord en DB
        interaction.client.db.updateVerification(interaction.guild.id, channel.id, role.id);

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Vérification Sentinel')
            .setDescription('Cliquez sur le bouton pour obtenir l\'accès au serveur.')
            .setColor('#2ecc71');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_user')
                .setLabel('Se vérifier')
                .setStyle(ButtonStyle.Success)
        );

        await channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: `✅ Configuration terminée dans ${channel}`, ephemeral: true });
    } catch (err) {
        console.error(err);
        return interaction.reply({ content: '❌ Erreur lors de la configuration.', ephemeral: true });
    }
}