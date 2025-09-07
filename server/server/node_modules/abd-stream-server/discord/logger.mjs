import axios from 'axios';

class DiscordLogger {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.enabled = !!webhookUrl;
  }

  async sendLog(type, data) {
    console.log(`[DiscordLogger] Attempting to send log: ${type}`);
    if (!this.enabled) {
      console.log('Discord logging disabled - no webhook URL provided');
      return;
    }

    try {
      const embed = this.createEmbed(type, data);
      console.log('Sending to Webhook URL:', this.webhookUrl);
      console.log('Sending Embed Payload:', JSON.stringify({ embeds: [embed] }, null, 2));
      
      await axios.post(this.webhookUrl, {
        embeds: [embed]
      });
      console.log(`[DiscordLogger] Log '${type}' sent successfully.`);
    } catch (error) {
      console.error(`[DiscordLogger] Failed to send Discord log for type '${type}':`, error.message);
      if (error.response) {
        // Discord a répondu avec une erreur HTTP
        console.error('[DiscordLogger] Discord API Error Status:', error.response.status);
        console.error('[DiscordLogger] Discord API Error Data:', error.response.data);
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('[DiscordLogger] No response received from Discord API.');
      } else {
        // Autre chose a déclenché l'erreur
        console.error('[DiscordLogger] Error during request setup:', error.config);
      }
    }
  }

  createEmbed(type, data) {
    const timestamp = new Date().toISOString();
    
    switch (type) {
      case 'user_muted':
        return {
          title: '🔇 Utilisateur Mute',
          color: 0xf59e0b, // Orange
          fields: [
            { name: 'Utilisateur', value: data.username, inline: true },
            { name: 'IP', value: data.ip, inline: true },
            { name: 'Système', value: `${data.os} (${data.deviceType})`, inline: true },
            { name: 'Navigateur', value: data.browser, inline: true },
            { name: 'Durée', value: data.duration, inline: true },
            { name: 'Infraction #', value: data.count.toString(), inline: true },
            { name: 'Expire à', value: data.expiresAt, inline: false },
            { name: 'Raison', value: data.reason || 'Comportement inapproprié', inline: false }
          ],
          timestamp: timestamp,
          footer: { text: 'ABD Stream - Système de Modération' }
        };

      case 'user_banned':
        return {
          title: '🚫 Utilisateur Banni',
          color: 0xef4444, // Rouge
          fields: [
            { name: 'Utilisateur', value: data.username, inline: true },
            { name: 'IP', value: data.ip, inline: true },
            { name: 'Système', value: `${data.os} (${data.deviceType})`, inline: true },
            { name: 'Navigateur', value: data.browser, inline: true },
            { name: 'Type', value: data.permanent ? 'Ban Permanent' : 'Ban Temporaire', inline: true },
            { name: 'Infractions Totales', value: data.totalInfractions?.toString() || 'N/A', inline: true },
            { name: 'Raison', value: data.reason || 'Infractions répétées', inline: false }
          ],
          timestamp: timestamp,
          footer: { text: 'ABD Stream - Système de Modération' }
        };

      case 'user_unmuted':
        return {
          title: '🔊 Utilisateur Démute',
          color: 0x10b981, // Vert
          fields: [
            { name: 'Utilisateur', value: data.username, inline: true },
            { name: 'IP', value: data.ip, inline: true },
            { name: 'Système', value: `${data.os} (${data.deviceType})`, inline: true },
            { name: 'Navigateur', value: data.browser, inline: true },
            { name: 'Durée Totale', value: data.totalDuration, inline: true }
          ],
          timestamp: timestamp,
          footer: { text: 'ABD Stream - Système de Modération' }
        };

      case 'message_deleted':
        return {
          title: '🗑️ Message Supprimé',
          color: 0x6b7280, // Gris
          fields: [
            { name: 'Auteur', value: data.author, inline: true },
            { name: 'IP', value: data.ip, inline: true },
            { name: 'Modérateur', value: data.moderator || 'Système', inline: true },
            { name: 'Message', value: data.message.length > 100 ? data.message.substring(0, 100) + '...' : data.message, inline: false }
          ],
          timestamp: timestamp,
          footer: { text: 'ABD Stream - Modération Chat' }
        };

      case 'user_connected':
        return {
          title: '🟢 Nouvelle Connexion',
          color: 0x22c55e, // Vert clair
          fields: [
            { name: 'Utilisateur', value: data.username, inline: true },
            { name: 'IP', value: data.ip, inline: true },
            { name: 'Système', value: `${data.os} (${data.deviceType})`, inline: true },
            { name: 'Navigateur', value: data.browser, inline: true },
            { name: 'Page', value: data.page, inline: true },
            { name: 'Heure de connexion', value: new Date(data.connectTime).toLocaleString('fr-FR'), inline: false }
          ],
          timestamp: timestamp,
          footer: { text: 'ABD Stream - Connexions' }
        };

      case 'user_disconnected':
        return {
          title: '🔴 Déconnexion',
          color: 0xef4444, // Rouge
          fields: [
            { name: 'Utilisateur', value: data.username, inline: true },
            { name: 'IP', value: data.ip, inline: true },
            { name: 'Système', value: `${data.os} (${data.deviceType})`, inline: true },
            { name: 'Navigateur', value: data.browser, inline: true },
            { name: 'Durée de session', value: data.sessionDuration, inline: true },
            { name: 'Messages envoyés', value: data.messageCount?.toString() || '0', inline: true }
          ],
          timestamp: timestamp,
          footer: { text: 'ABD Stream - Connexions' }
        };

      case 'server_stats':
        return {
          title: '📊 Statistiques Serveur',
          color: 0x3b82f6, // Bleu
          fields: [
            { name: 'Utilisateurs Connectés', value: data.activeUsers.toString(), inline: true },
            { name: 'Messages Total', value: data.totalMessages.toString(), inline: true },
            { name: 'Utilisateurs Mutes', value: data.mutedUsers.toString(), inline: true },
            { name: 'Uptime', value: data.uptime, inline: true }
          ],
          timestamp: timestamp,
          footer: { text: 'ABD Stream - Statistiques' }
        };

      case 'suspicious_activity':
        return {
          title: '⚠️ Activité Suspecte',
          color: 0xf59e0b, // Orange
          fields: [
            { name: 'Type', value: data.type, inline: true },
            { name: 'IP', value: data.ip, inline: true },
            { name: 'Utilisateur', value: data.username || 'N/A', inline: true },
            { name: 'Détails', value: data.details, inline: false }
          ],
          timestamp: timestamp,
          footer: { text: 'ABD Stream - Sécurité' }
        };

      default:
        return {
          title: '📝 Log Système',
          color: 0x6b7280,
          fields: [
            { name: 'Type', value: type, inline: true },
            { name: 'Données', value: JSON.stringify(data, null, 2).substring(0, 500), inline: false }
          ],
          timestamp: timestamp,
          footer: { text: 'ABD Stream - Logs' }
        };
    }
  }

  // Méthodes utilitaires pour formater les durées
  formatDuration(milliseconds) {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  formatSessionDuration(startTime) {
    const duration = Date.now() - new Date(startTime).getTime();
    return this.formatDuration(duration);
  }
}

export default DiscordLogger;