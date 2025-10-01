# Architecture de la Plateforme de Streaming

## Vue d'ensemble

Plateforme de streaming moderne avec support RTMP, chat en temps réel, et panel d'administration complet, 100% localhost avec SQLite.

## Stack Technique

### Frontend
- **React 18.2** avec TypeScript
- **Vite** pour le build
- **TailwindCSS** pour le styling
- **Lucide React** pour les icônes
- **HLS.js** pour la lecture des streams
- **WebSocket** pour la communication temps réel

### Backend
- **Node.js** avec ES Modules
- **WebSocket (ws)** pour la communication temps réel
- **Node Media Server** pour le serveur RTMP
- **SQLite3** comme base de données locale
- **Discord.js** pour le bot Discord

### Base de Données
- **SQLite3** - Base de données fichier locale (`server/data/app.db`)
- **Aucun service cloud** - Toutes les données restent sur votre machine
- **Discord Bot** - Seule connexion externe (nécessaire pour la génération de comptes)

## Architecture de la Base de Données

### Tables SQLite

#### `users`
```sql
- id (text, primary key)
- username (text, unique)
- password_hash (text)
- role (text) - viewer, moderator, admin
- created_at (datetime)
- last_login (datetime)
- is_active (boolean)
- discord_id (text) - ID Discord de l'utilisateur
- discord_username (text) - Username Discord
- expires_at (datetime) - Date d'expiration (comptes temporaires)
```

#### `streams`
```sql
- id (integer, primary key autoincrement)
- stream_key (text, unique)
- title (text)
- description (text)
- started_at (datetime)
- ended_at (datetime)
- is_live (boolean)
```

#### `chat_messages`
```sql
- id (text, primary key)
- username (text)
- message (text)
- timestamp (datetime)
- role (text)
- is_system (boolean)
- color (text)
- ip (text)
- fingerprint (text)
- stream_key (text)
```

#### `connected_users`
```sql
- id (text, primary key)
- username (text)
- ip (text)
- user_agent (text)
- connect_time (datetime)
- last_activity (datetime)
- page (text)
- fingerprint (text)
```

#### `banned_users`
```sql
- id (integer, primary key autoincrement)
- fingerprint (text)
- ip (text)
- username (text)
- banned_at (datetime)
- ban_end_time (datetime)
- reason (text)
- banned_by (text)
- is_permanent (boolean)
```

#### `muted_users`
```sql
- id (integer, primary key autoincrement)
- fingerprint (text)
- username (text)
- ip (text)
- muted_at (datetime)
- mute_end_time (datetime)
- reason (text)
- muted_by (text)
- mute_count (integer)
```

#### `activity_logs`
```sql
- id (integer, primary key autoincrement)
- action_type (text)
- username (text)
- ip_address (text)
- fingerprint (text)
- details (text) - JSON stringifié
- severity (text)
- admin_username (text)
- created_at (datetime)
```

## Sécurité

### Sécurité Base de Données

- **SQLite local** - Pas d'exposition réseau de la base de données
- **Fichier protégé** - Base de données stockée dans `server/data/app.db`
- **Validation côté serveur** - Toutes les requêtes sont validées avant exécution
- **Mots de passe hashés** - Utilisation de bcrypt avec salt rounds: 10
- **Accès contrôlé** - Vérifications des rôles pour les actions admin/mod

### Sécurité Backend

- **Fingerprinting** : Hash SHA256 de IP + User Agent
- **Vérification des bans** à chaque connexion WebSocket
- **Vérification des mutes** avant chaque message
- **Validation des données** côté serveur
- **Protection CORS** configurée

## Flux de Données

### 1. Connexion Utilisateur
```
Client → WebSocket (ws://localhost:3001)
→ Vérification ban (SQLite)
→ Génération fingerprint
→ Insertion dans connected_users (SQLite)
→ Broadcast user_count
```

### 2. Streaming RTMP
```
OBS → RTMP Server (port 1935)
→ FFmpeg conversion → HLS
→ Fichiers .m3u8/.ts dans server/media/
→ Insertion dans streams (SQLite)
→ Broadcast stream_detected (WebSocket)
```

### 3. Chat Message
```
Client → WebSocket
→ Vérification mute (SQLite)
→ Insertion dans chat_messages (SQLite)
→ Broadcast aux viewers du stream
```

### 4. Panel Admin
```
Admin Panel → WebSocket
→ Mises à jour automatiques via WebSocket
→ Actions (ban/mute) → SQLite
→ Broadcast via WebSocket
```

## Messages WebSocket

### Client → Serveur

**user_info**
```json
{
  "type": "user_info",
  "username": "string",
  "page": "string"
}
```

**chat_message**
```json
{
  "type": "chat_message",
  "message": {
    "text": "string"
  }
}
```

**join_stream**
```json
{
  "type": "join_stream",
  "streamKey": "string"
}
```

**leave_stream**
```json
{
  "type": "leave_stream"
}
```

**authenticate**
```json
{
  "type": "authenticate",
  "password": "string"
}
```

**delete_message**
```json
{
  "type": "delete_message",
  "messageId": "string"
}
```

**admin_action**
```json
{
  "type": "admin_action",
  "action": "mute_user" | "ban_user",
  "targetUserId": "string"
}
```

### Serveur → Client

**user_count**
```json
{
  "type": "user_count",
  "count": number
}
```

**active_streams**
```json
{
  "type": "active_streams",
  "streams": Stream[]
}
```

**chat_message**
```json
{
  "type": "chat_message",
  "message": ChatMessage
}
```

**stream_detected**
```json
{
  "type": "stream_detected",
  "stream": Stream
}
```

**stream_ended**
```json
{
  "type": "stream_ended",
  "streamKey": "string"
}
```

**banned**
```json
{
  "type": "banned",
  "message": "string",
  "reason": "string"
}
```

**muted**
```json
{
  "type": "muted",
  "message": "string",
  "duration": number
}
```

## API REST

### Discord Bot

#### Génération de Comptes Temporaires
```
Utilisateur Discord → /account
→ Vérification compte existant (SQLite)
→ Génération username + password aléatoires
→ Hash bcrypt du password
→ Insertion dans users (SQLite)
→ Envoi identifiants en DM Discord
→ Expiration automatique après 24h
```

### POST `/api/stream/detect`
Notification de début/fin de stream RTMP (non utilisé actuellement)

**Request:**
```json
{
  "action": "start" | "stop",
  "streamKey": "string",
  "title": "string",
  "description": "string",
  "thumbnail": "string",
  "rtmpUrl": "string",
  "hlsUrl": "string"
}
```

**Response:**
```json
{
  "success": boolean
}
```

### GET `/api/streams`
Liste des streams actifs

**Response:**
```json
{
  "success": boolean,
  "streams": Stream[]
}
```

### GET `/api/status`
Statut du serveur

**Response:**
```json
{
  "success": boolean,
  "status": "online",
  "connectedUsers": number,
  "activeStreams": number,
  "database": "Supabase",
  "timestamp": "string"
}
```

## Ports

- **5173** : Frontend (Vite dev server)
- **3001** : Backend WebSocket
- **1935** : Serveur RTMP (OBS)
- **8003** : Serveur HTTP pour fichiers HLS

## Variables d'Environnement

### Backend (server/.env)
```env
# Clés de sécurité locale
ENCRYPTION_KEY=BOLT_ANONYMOUS_2025
ADMIN_ACCESS_CODE=ADMIN_BOLT_2025

# Mots de passe des rôles
MOD_PASSWORD=mod123
MODERATOR_PASSWORD=moderator123
ADMIN_PASSWORD=admin123

# Configuration WebSocket
WS_PORT=3001

# Configuration Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_WEBHOOK_URL=
```

### Frontend
Aucune variable d'environnement requise pour le fonctionnement localhost.

## Configuration OBS

```
Service: Custom
Serveur: rtmp://localhost:1935/live
Clé de stream: votre_cle_personnalisee
Encodeur: x264
Bitrate: 2500-6000 Kbps
Keyframe Interval: 2
CPU Preset: veryfast
Profile: high
```

## Performances

### Temps Réel
- **WebSocket** : Latence < 50ms
- **SQLite** : Requêtes < 10ms (fichier local)
- **Broadcast** : Instantané via WebSocket

### Optimisations
- Broadcast ciblé par stream pour le chat
- SQLite en mode WAL (Write-Ahead Logging)
- Index automatiques sur les colonnes PRIMARY KEY et UNIQUE
- Cleanup automatique des connexions fermées
- Cleanup automatique des comptes Discord expirés (toutes les 5min)

## Monitoring

### Logs Backend
- Connexions/déconnexions WebSocket
- Création/arrêt des streams
- Actions d'administration
- Erreurs de base de données SQLite
- Création/expiration des comptes Discord

### Panel Admin
- Utilisateurs connectés en temps réel
- Streams actifs
- Messages totaux
- Utilisateurs bannis/mute
- Logs d'activité (création/expiration comptes Discord, etc.)

## Déploiement

### Frontend
```bash
npm run build
# Déployer le dossier dist/
```

### Backend
```bash
cd server
npm install
npm start        # Serveur WebSocket + RTMP
npm run bot      # Bot Discord (terminal séparé)
# OU
npm run dev      # Serveur + Bot en même temps
```

### Base de Données
- SQLite initialisé automatiquement au premier lancement
- Fichier créé dans `server/data/app.db`
- Aucune configuration supplémentaire nécessaire

## Maintenance

### Nettoyage Automatique
- Mutes expirés supprimés périodiquement
- Connexions fermées nettoyées
- Comptes Discord expirés supprimés automatiquement (toutes les 5min)
- Logs d'expiration créés pour chaque compte supprimé

### Backups
- Copier manuellement le fichier `server/data/app.db`
- Possibilité d'utiliser SQLite backup API
- Recommandé: backup régulier du dossier `server/data/`

## Scalabilité

### Limites SQLite
- Conçu pour usage local/petit à moyen trafic
- Excellentes performances en lecture
- Écritures séquentielles (lock de fichier)
- Recommandé pour < 1000 utilisateurs simultanés

### Migration Future
- Si besoin de scale: migrer vers PostgreSQL
- Structure de base de données compatible
- Adapter les requêtes SQL si nécessaire

## Sécurité en Production

- [ ] Utiliser HTTPS/WSS (certificat SSL)
- [ ] Rate limiting sur WebSocket
- [ ] Changer les mots de passe par défaut dans .env
- [ ] Protéger le fichier `server/data/app.db` (permissions 600)
- [ ] Monitoring des logs
- [ ] Alertes pour activités suspectes
- [ ] Firewall pour limiter accès aux ports
- [ ] Backups réguliers de la base SQLite
- [ ] Ne JAMAIS commit le fichier .env dans Git

## Connexions Externes

**IMPORTANT** : Le système est 100% localhost sauf pour :

1. **Bot Discord** (obligatoire)
   - Connexion aux serveurs Discord pour le bot
   - Nécessaire pour la génération de comptes temporaires via `/account`
   - Aucune donnée utilisateur n'est envoyée à Discord (sauf Discord ID/username)

2. **Aucune autre connexion cloud**
   - Pas de Supabase
   - Pas de services externes
   - Toutes les données restent sur votre machine

## Support

Pour toute question technique, consulter :
- README.md pour l'installation
- DISCORD_INTEGRATION.md pour le bot Discord
- server/DISCORD_BOT_SETUP.md pour la configuration Discord
- Ce document pour l'architecture
- Code source pour l'implémentation détaillée
