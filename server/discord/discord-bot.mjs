import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Database from '../database.mjs';

// Configuration du bot
const BOT_CONFIG = {
  PREFIX: '!',
  ADMIN_USER_IDS: [
    // Ajoutez ici les IDs Discord des utilisateurs autorisés à utiliser le bot
    // Exemple: '123456789012345678'
  ],
  ADMIN_ROLE_NAMES: [
    'Admin',
    'Moderator',
    'ABD Admin'
  ]
};

// Initialisation de la base de données
const db = new Database();

// Création du client Discord avec les intents nécessaires
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Fonction pour vérifier les permissions
function hasPermission(message) {
  // Vérifier si l'utilisateur est dans la liste des admins
  if (BOT_CONFIG.ADMIN_USER_IDS.includes(message.author.id)) {
    return true;
  }
  
  // Vérifier si l'utilisateur a un rôle admin
  if (message.member) {
    const hasAdminRole = message.member.roles.cache.some(role => 
      BOT_CONFIG.ADMIN_ROLE_NAMES.includes(role.name)
    );
    if (hasAdminRole) {
      return true;
    }
  }
  
  // Vérifier les permissions Discord
  if (message.member && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }
  
  return false;
}

// Fonction pour créer un embed avec les couleurs du thème
function createEmbed(title, description, color = 0x3b82f6) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'ABD Stream Bot' });
}

// Fonction pour formater la durée
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}j ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Commandes disponibles
const commands = {
  help: {
    description: 'Affiche la liste des commandes disponibles',
    usage: '!help',
    execute: async (message, args) => {
      const embed = createEmbed('🤖 Commandes ABD Stream Bot', '', 0x8b5cf6);
      
      let commandList = '';
      Object.entries(commands).forEach(([name, cmd]) => {
        commandList += `**${BOT_CONFIG.PREFIX}${name}** - ${cmd.description}\n`;
        commandList += `Usage: \`${cmd.usage}\`\n\n`;
      });
      
      embed.setDescription(commandList);
      await message.reply({ embeds: [embed] });
    }
  },

  stats: {
    description: 'Affiche les statistiques générales de la plateforme',
    usage: '!stats',
    execute: async (message, args) => {
      try {
        const connectedUsers = await db.getConnectedUsers();
        const chatMessages = await db.getChatMessages(1000);
        const bannedUsers = await db.getBannedUsers();
        const mutedUsers = await db.getMutedUsers();
        
        const embed = createEmbed('📊 Statistiques ABD Stream', '', 0x10b981);
        embed.addFields(
          { name: '👥 Utilisateurs connectés', value: connectedUsers.length.toString(), inline: true },
          { name: '💬 Messages chat (derniers 1000)', value: chatMessages.length.toString(), inline: true },
          { name: '🚫 Utilisateurs bannis', value: bannedUsers.length.toString(), inline: true },
          { name: '🔇 Utilisateurs mutes', value: mutedUsers.length.toString(), inline: true }
        );
        
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        await message.reply('❌ Erreur lors de la récupération des statistiques.');
      }
    }
  },

  users: {
    description: 'Liste les utilisateurs actuellement connectés',
    usage: '!users [limite]',
    execute: async (message, args) => {
      try {
        const limit = args[0] ? parseInt(args[0]) : 10;
        const users = await db.getConnectedUsers();
        
        if (users.length === 0) {
          await message.reply('👥 Aucun utilisateur connecté actuellement.');
          return;
        }
        
        const embed = createEmbed(`👥 Utilisateurs connectés (${users.length})`, '', 0x3b82f6);
        
        let userList = '';
        users.slice(0, limit).forEach((user, index) => {
          const connectTime = new Date(user.connect_time);
          const duration = formatDuration(Date.now() - connectTime.getTime());
          const status = user.is_muted ? '🔇' : user.is_banned ? '🚫' : '✅';
          
          userList += `${status} **${user.username}** (${user.page})\n`;
          userList += `└ IP: \`${user.ip}\` | Connecté: ${duration}\n\n`;
        });
        
        if (users.length > limit) {
          userList += `... et ${users.length - limit} autres utilisateurs`;
        }
        
        embed.setDescription(userList);
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        await message.reply('❌ Erreur lors de la récupération des utilisateurs.');
      }
    }
  },

  messages: {
    description: 'Affiche les derniers messages du chat',
    usage: '!messages [limite]',
    execute: async (message, args) => {
      try {
        const limit = args[0] ? parseInt(args[0]) : 10;
        const messages = await db.getChatMessages(limit);
        
        if (messages.length === 0) {
          await message.reply('💬 Aucun message dans le chat.');
          return;
        }
        
        const embed = createEmbed(`💬 Derniers messages (${messages.length})`, '', 0x8b5cf6);
        
        let messageList = '';
        messages.slice(-limit).reverse().forEach((msg) => {
          const timestamp = new Date(msg.timestamp);
          const roleIcon = msg.role === 'admin' ? '👑' : msg.role === 'moderator' ? '🛡️' : '👤';
          const systemIcon = msg.is_system ? '🤖' : '';
          
          messageList += `${roleIcon}${systemIcon} **${msg.username}**: ${msg.message}\n`;
          messageList += `└ ${timestamp.toLocaleString('fr-FR')} | IP: \`${msg.ip || 'N/A'}\`\n\n`;
        });
        
        embed.setDescription(messageList);
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        await message.reply('❌ Erreur lors de la récupération des messages.');
      }
    }
  },

  banned: {
    description: 'Liste les utilisateurs bannis',
    usage: '!banned',
    execute: async (message, args) => {
      try {
        const bannedUsers = await db.getBannedUsers();
        
        if (bannedUsers.length === 0) {
          await message.reply('🚫 Aucun utilisateur banni actuellement.');
          return;
        }
        
        const embed = createEmbed(`🚫 Utilisateurs bannis (${bannedUsers.length})`, '', 0xef4444);
        
        let banList = '';
        bannedUsers.forEach((ban) => {
          const bannedAt = new Date(ban.banned_at);
          const duration = ban.is_permanent ? 'Permanent' : 'Temporaire';
          
          banList += `**${ban.username || 'Anonyme'}** (${duration})\n`;
          banList += `└ IP: \`${ban.ip}\` | Banni le: ${bannedAt.toLocaleString('fr-FR')}\n`;
          banList += `└ Raison: ${ban.reason || 'Non spécifiée'}\n\n`;
        });
        
        embed.setDescription(banList);
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur lors de la récupération des bans:', error);
        await message.reply('❌ Erreur lors de la récupération des utilisateurs bannis.');
      }
    }
  },

  muted: {
    description: 'Liste les utilisateurs mutes',
    usage: '!muted',
    execute: async (message, args) => {
      try {
        const mutedUsers = await db.getMutedUsers();
        
        if (mutedUsers.length === 0) {
          await message.reply('🔇 Aucun utilisateur mute actuellement.');
          return;
        }
        
        const embed = createEmbed(`🔇 Utilisateurs mutes (${mutedUsers.length})`, '', 0xf59e0b);
        
        let muteList = '';
        mutedUsers.forEach((mute) => {
          const mutedAt = new Date(mute.muted_at);
          const muteEnd = new Date(mute.mute_end_time);
          const remaining = muteEnd.getTime() - Date.now();
          
          muteList += `**${mute.username || 'Anonyme'}**\n`;
          muteList += `└ IP: \`${mute.ip}\` | Mute le: ${mutedAt.toLocaleString('fr-FR')}\n`;
          muteList += `└ Expire dans: ${remaining > 0 ? formatDuration(remaining) : 'Expiré'}\n`;
          muteList += `└ Raison: ${mute.reason || 'Non spécifiée'}\n\n`;
        });
        
        embed.setDescription(muteList);
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur lors de la récupération des mutes:', error);
        await message.reply('❌ Erreur lors de la récupération des utilisateurs mutes.');
      }
    }
  },

  unban: {
    description: 'Débannit un utilisateur par son IP ou fingerprint',
    usage: '!unban <ip_ou_fingerprint>',
    execute: async (message, args) => {
      if (args.length === 0) {
        await message.reply('❌ Usage: `!unban <ip_ou_fingerprint>`');
        return;
      }
      
      try {
        const identifier = args[0];
        await db.unbanUser(identifier, identifier); // Essaie avec les deux paramètres
        
        const embed = createEmbed('✅ Utilisateur débanni', `L'utilisateur avec l'identifiant \`${identifier}\` a été débanni avec succès.`, 0x10b981);
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur lors du déban:', error);
        await message.reply('❌ Erreur lors du déban de l\'utilisateur.');
      }
    }
  },

  unmute: {
    description: 'Démute un utilisateur par son fingerprint',
    usage: '!unmute <fingerprint>',
    execute: async (message, args) => {
      if (args.length === 0) {
        await message.reply('❌ Usage: `!unmute <fingerprint>`');
        return;
      }
      
      try {
        const fingerprint = args[0];
        await db.unmuteUser(fingerprint);
        
        const embed = createEmbed('🔊 Utilisateur démuté', `L'utilisateur avec le fingerprint \`${fingerprint}\` a été démuté avec succès.`, 0x10b981);
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur lors du démute:', error);
        await message.reply('❌ Erreur lors du démute de l\'utilisateur.');
      }
    }
  },

  cleanup: {
    description: 'Nettoie les mutes expirés de la base de données',
    usage: '!cleanup',
    execute: async (message, args) => {
      try {
        await db.clearExpiredMutes();
        
        const embed = createEmbed('🧹 Nettoyage effectué', 'Les mutes expirés ont été supprimés de la base de données.', 0x10b981);
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
        await message.reply('❌ Erreur lors du nettoyage de la base de données.');
      }
    }
  }
};

// Événement de connexion du bot
client.once('ready', () => {
  console.log('🤖 Bot Discord connecté !');
  console.log(`📝 Connecté en tant que ${client.user.tag}`);
  console.log(`🔧 Préfixe des commandes: ${BOT_CONFIG.PREFIX}`);
  console.log(`👑 Admins autorisés: ${BOT_CONFIG.ADMIN_USER_IDS.length} utilisateur(s)`);
  
  // Définir le statut du bot
  client.user.setActivity('ABD Stream | !help', { type: 'WATCHING' });
});

// Événement de réception de message
client.on('messageCreate', async (message) => {
  // Ignorer les messages du bot lui-même
  if (message.author.bot) return;
  
  // Vérifier si le message commence par le préfixe
  if (!message.content.startsWith(BOT_CONFIG.PREFIX)) return;
  
  // Vérifier les permissions
  if (!hasPermission(message)) {
    const embed = createEmbed('❌ Accès refusé', 'Vous n\'avez pas les permissions nécessaires pour utiliser ce bot.', 0xef4444);
    await message.reply({ embeds: [embed] });
    return;
  }
  
  // Parser la commande et les arguments
  const args = message.content.slice(BOT_CONFIG.PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // Vérifier si la commande existe
  if (!commands[commandName]) {
    const embed = createEmbed('❌ Commande inconnue', `La commande \`${BOT_CONFIG.PREFIX}${commandName}\` n'existe pas. Utilisez \`${BOT_CONFIG.PREFIX}help\` pour voir les commandes disponibles.`, 0xef4444);
    await message.reply({ embeds: [embed] });
    return;
  }
  
  // Exécuter la commande
  try {
    console.log(`🤖 Commande exécutée: ${commandName} par ${message.author.tag}`);
    await commands[commandName].execute(message, args);
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande ${commandName}:`, error);
    const embed = createEmbed('❌ Erreur', 'Une erreur est survenue lors de l\'exécution de la commande.', 0xef4444);
    await message.reply({ embeds: [embed] });
  }
});

// Gestion des erreurs
client.on('error', (error) => {
  console.error('Erreur du client Discord:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Erreur non gérée:', error);
});

// Connexion du bot
if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN non défini dans le fichier .env');
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN).catch((error) => {
  console.error('❌ Erreur lors de la connexion du bot Discord:', error);
  process.exit(1);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du bot Discord...');
  client.destroy();
  db.close();
  process.exit(0);
});