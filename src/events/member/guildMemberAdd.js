export default {
  name: 'guildMemberAdd',
  category: 'member',

  async execute(member, client) {
    const { guild } = member;

    try {
      // Récupérer la configuration
      const guildData = client.db.getGuild(guild.id);

      if (!guildData || !guildData.verification_channel) {
        return; // Pas de système de vérification configuré
      }

      const verificationChannel = guild.channels.cache.get(guildData.verification_channel);
      const verificationRole = guild.roles.cache.get(guildData.verification_role);

      if (!verificationChannel || !verificationRole) {
        return; // Canal ou rôle introuvable
      }

      // Envoyer un message de bienvenue
      const embed = {
        color: 0x5865f2,
        title: '👋 Bienvenue ' + member.user.username + ' !',
        description: 'Bienvenue sur **' + guild.name + '** !\n\nPour accéder aux autres salons, vous devez vous vérifier.',
        fields: [
          {
            name: '📝 Comment faire ?',
            value: 'Utilisez la commande `/verify` dans ce salon.',
            inline: false
          },
          {
            name: '⏰ Temps limité',
            value: 'Vous avez **10 minutes** pour vous vérifier, sinon vous serez expulsé.',
            inline: false
          }
        ],
        thumbnail: {
          url: member.user.displayAvatarURL()
        },
        footer: {
          text: 'Sentinel Bot',
          icon_url: client.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
      };

      await verificationChannel.send({
        content: member.toString(),
        embeds: [embed]
      });

      // Auto-kick après 10 minutes si pas vérifié
      setTimeout(async () => {
        try {
          const stillMember = await guild.members.fetch(member.id).catch(() => null);
          
          if (stillMember && !stillMember.roles.cache.has(guildData.verification_role)) {
            await stillMember.kick('Non vérifié après 10 minutes');
            
            await verificationChannel.send({
              content: '⚠️ ' + member.user.tag + ' a été expulsé pour non-vérification.'
            });
          }
        } catch (error) {
          console.error('Erreur auto-kick:', error);
        }
      }, 10 * 60 * 1000); // 10 minutes

    } catch (error) {
      console.error('Erreur dans guildMemberAdd:', error);
    }
  }
};
