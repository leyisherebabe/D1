# Architecture de la Plateforme de Streaming

## Vue d'ensemble

Plateforme de streaming moderne avec support RTMP, chat en temps réel, et panel d'administration complet, propulsée par Supabase.

## Stack Technique

### Frontend
- **React 18.2** avec TypeScript
- **Vite** pour le build
- **TailwindCSS** pour le styling
- **Lucide React** pour les icônes
- **Supabase JS Client** pour l'accès à la base de données
- **HLS.js** pour la lecture des streams

### Backend
- **Node.js** avec ES Modules
- **Express.js** pour l'API REST
- **WebSocket (ws)** pour la communication temps réel
- **Node Media Server** pour le serveur RTMP
- **Supabase** comme base de données PostgreSQL

### Base de Données
- **Supabase PostgreSQL** avec Row Level Security (RLS)
- **Realtime subscriptions** pour les mises à jour en direct

## Architecture de la Base de Données

### Tables

#### `profiles`
```sql
- id (uuid, primary key)
- username (text, unique)
- role (text) - viewer, moderator, admin
- created_at (timestamptz)
- last_login (timestamptz)
```

#### `streams`
```sql
- id (uuid, primary key)
- stream_key (text, unique)
- title (text)
- description (text)
- thumbnail (text)
- start_time (timestamptz)
- end_time (timestamptz)
- is_live (boolean)
- rtmp_url (text)
- hls_url (text)
- viewer_count (integer)
- created_by (uuid, foreign key)
- created_at (timestamptz)
```

#### `chat_messages`
```sql
- id (uuid, primary key)
- stream_id (uuid, foreign key, nullable)
- user_id (uuid, foreign key, nullable)
- username (text)
- message (text)
- ip_address (text)
- fingerprint (text)
- created_at (timestamptz)
```

#### `connected_users`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key, nullable)
- username (text)
- ip_address (text)
- user_agent (text)
- fingerprint (text)
- page (text)
- connected_at (timestamptz)
- last_activity (timestamptz)
```

#### `banned_users`
```sql
- id (uuid, primary key)
- fingerprint (text)
- ip_address (text)
- username (text)
- reason (text)
- banned_at (timestamptz)
- banned_by (text)
- is_permanent (boolean)
- ban_end_time (timestamptz, nullable)
```

#### `muted_users`
```sql
- id (uuid, primary key)
- fingerprint (text)
- username (text)
- ip_address (text)
- reason (text)
- muted_at (timestamptz)
- muted_by (text)
- mute_end_time (timestamptz, nullable)
- mute_count (integer)
```

## Sécurité

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec des policies restrictives :

**profiles**
- Users peuvent lire tous les profils
- Users peuvent modifier uniquement leur profil

**streams**
- Lecture pour tous les utilisateurs authentifiés
- Création/modification pour admins/moderators uniquement

**chat_messages**
- Lecture pour tous
- Insertion pour utilisateurs authentifiés
- Suppression pour admins/moderators uniquement

**connected_users**
- Lecture pour admins/moderators uniquement

**banned_users**
- Lecture/écriture pour admins/moderators uniquement

**muted_users**
- Lecture/écriture pour admins/moderators uniquement

### Sécurité Backend

- **Fingerprinting** : Hash SHA256 de IP + User Agent
- **Vérification des bans** à chaque connexion WebSocket
- **Vérification des mutes** avant chaque message
- **Validation des données** côté serveur
- **Protection CORS** configurée

## Flux de Données

### 1. Connexion Utilisateur
```
Client → WebSocket (ws://localhost:3000)
→ Vérification ban (Supabase)
→ Génération fingerprint
→ Insertion dans connected_users (Supabase)
→ Broadcast user_count
```

### 2. Streaming RTMP
```
OBS → RTMP Server (port 1935)
→ FFmpeg conversion → HLS
→ Fichiers .m3u8/.ts dans server/media/
→ Notification API REST → Backend
→ Insertion dans streams (Supabase)
→ Broadcast stream_detected (WebSocket)
```

### 3. Chat Message
```
Client → WebSocket
→ Vérification mute (Supabase)
→ Insertion dans chat_messages (Supabase)
→ Broadcast aux viewers du stream
→ Mise à jour Realtime (Supabase)
```

### 4. Panel Admin
```
Admin Panel → Supabase Realtime subscriptions
→ Mises à jour automatiques toutes les 5s
→ Actions (ban/mute) → Supabase
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

### POST `/api/stream/detect`
Notification de début/fin de stream RTMP

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
- **3000** : Backend WebSocket + API REST
- **1935** : Serveur RTMP (OBS)
- **8003** : Serveur HTTP pour fichiers HLS

## Variables d'Environnement

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=xxx
```

### Backend
Les variables sont injectées automatiquement depuis le frontend ou définies en fallback dans le code.

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
- **Supabase Realtime** : Mises à jour < 100ms
- **Polling** : Toutes les 5 secondes pour le panel admin

### Optimisations
- Broadcast ciblé par stream pour le chat
- Pagination des messages (50 derniers)
- Index sur les colonnes fréquemment utilisées
- Cleanup automatique des connexions fermées

## Monitoring

### Logs Backend
- Connexions/déconnexions WebSocket
- Création/arrêt des streams
- Actions d'administration
- Erreurs de base de données

### Panel Admin
- Utilisateurs connectés en temps réel
- Streams actifs
- Messages totaux
- Utilisateurs bannis/mute

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
npm start  # Serveur principal
npm run rtmp  # Serveur RTMP (terminal séparé)
```

### Supabase
- Base de données hébergée
- Migrations déjà appliquées
- RLS configuré

## Maintenance

### Nettoyage Automatique
- Mutes expirés supprimés périodiquement
- Connexions fermées nettoyées
- Streams inactifs archivés

### Backups
- Supabase effectue des backups automatiques
- Point-in-time recovery disponible

## Scalabilité

### Horizontal
- Multiple instances du backend possible
- Load balancer devant WebSocket
- Supabase gère automatiquement la montée en charge

### Vertical
- Augmenter les ressources Supabase
- Optimiser les requêtes SQL
- Ajouter des index si nécessaire

## Sécurité en Production

- [ ] Utiliser HTTPS/WSS
- [ ] Configurer un WAF
- [ ] Rate limiting sur les endpoints
- [ ] Rotation des clés Supabase
- [ ] Monitoring des logs
- [ ] Alertes pour activités suspectes
- [ ] CORS restrictif en production
- [ ] Chiffrement des données sensibles

## Support

Pour toute question technique, consulter :
- README.md pour l'installation
- Ce document pour l'architecture
- Code source pour l'implémentation détaillée
