// Configuration serveur - JAMAIS exposée au client
import 'dotenv/config';

export const SERVER_CONFIG = {
  // Clés d'authentification (à déplacer dans .env en production)
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'BOLT_ANONYMOUS_2025',
  ADMIN_ACCESS_CODE: process.env.ADMIN_ACCESS_CODE || 'ADMIN_BOLT_2025',
  
  MODERATOR_PASSWORDS: {
    'mod': process.env.MOD_PASSWORD || 'mod123',
    'moderator': process.env.MODERATOR_PASSWORD || 'moderator123',
    'admin': process.env.ADMIN_PASSWORD || 'admin123'
  },
  
  // Configuration WebSocket
  WS_PORT: process.env.WS_PORT || 3001,
  
  // Configuration Discord
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL
};