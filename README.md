# 🎥 ABD Stream - Plateforme de Streaming Complète

Une plateforme de streaming moderne avec chat en temps réel, gestion des streams et panel d'administration complet.

## 🚀 Fonctionnalités

### 🎬 Streaming
- **Lecteur vidéo intégré** avec contrôles complets
- **Support HLS/M3U8** pour le streaming adaptatif
- **Gestion des streams** via panel admin
- **Qualité adaptative** (Auto, 1080p, 720p, 480p)

### 💬 Chat Multi-Contextes
- **Chat global** quand aucun stream n'est actif
- **Chat par stream** pour chaque stream individuel
- **Modération en temps réel** (mute, ban, suppression)
- **Système de signalement** des messages

### 👑 Panel Administrateur
- **Gestion des streams** (création, activation, désactivation)
- **Upload de fichiers M3U8** pour les streams
- **Modération des utilisateurs** (ban/unban, mute/unmute)
- **Gestion des annonces popup**
- **Statistiques en temps réel**

### 🔒 Sécurité
- **Authentification sécurisée** avec bcrypt
- **Système de rôles** (viewer, moderator, admin)
- **Protection contre le spam** et les abus
- **Anonymat préservé**

## 📋 Installation

### 1. Prérequis
- Node.js 18+ 
- npm ou yarn

### 2. Installation des dépendances

```bash
# Cloner le projet
git clone <url-du-repo>
cd abd-stream

# Installer les dépendances frontend
npm install

# Installer les dépendances backend
cd server
npm install
cd ..
```

### 3. Configuration

Le fichier `server/.env` contient la configuration :
```env
# Ports
WS_PORT=3001
MEDIA_PORT=8000

# Discord (optionnel)
DISCORD_WEBHOOK_URL=your_webhook_url
DISCORD_BOT_TOKEN=your_bot_token

# Base de données
DB_PATH=./data/database.sqlite
```

## 🎯 Démarrage

### Méthode Simple (Recommandée)
```bash
npm run dev:full
```
Cette commande démarre automatiquement :
- Frontend React (port 5173)
- Serveur WebSocket (port 3001) 
- Serveur média (port 8000)

### Méthode Manuelle
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend WebSocket
cd server
npm run dev

# Terminal 3 - Serveur média
cd server
npm run media
```

## 🌐 Accès

- **Site web** : http://localhost:5173
- **Panel Admin** : Ctrl+Shift+A puis code `ADMIN_BOLT_2025`
- **API WebSocket** : ws://localhost:3001
- **Serveur média** : http://localhost:8000

## 📁 Structure du Projet

```
abd-stream/
├── src/                          # Frontend React
│   ├── components/               # Composants React
│   │   ├── AdminPage.tsx         # Panel d'administration
│   │   ├── HomePage.tsx          # Page d'accueil
│   │   ├── LiveStreamPage.tsx    # Page de streaming
│   │   ├── AuthPage.tsx          # Authentification
│   │   ├── chat/                 # Composants chat
│   │   └── modals/               # Modales
│   ├── services/                 # Services (WebSocket)
│   ├── types/                    # Types TypeScript
│   └── utils/                    # Utilitaires
├── server/                       # Backend Node.js
│   ├── data/                     # Base de données SQLite
│   ├── media/                    # Fichiers média (M3U8, TS)
│   ├── config.mjs                # Configuration
│   ├── database.mjs              # Gestion BDD
│   ├── server.mjs                # Serveur WebSocket
│   └── simple-media.mjs          # Serveur média
└── README.md
```

## 🎮 Utilisation

### 👤 Utilisateur Standard

1. **Connexion** : Créez un compte ou connectez-vous
2. **Navigation** : 
   - Accueil : Vue d'ensemble et réseaux sociaux
   - Streams : Liste des streams disponibles
   - Chat : Chat global ou par stream
3. **Streaming** : Cliquez sur un stream pour le regarder
4. **Chat** : Participez aux discussions en temps réel

### 👑 Administrateur

1. **Accès Admin** : `Ctrl+Shift+A` → Code `ADMIN_BOLT_2025`
2. **Gestion des Streams** :
   - Créer un nouveau stream
   - Uploader un fichier M3U8
   - Activer/désactiver les streams
   - Voir les statistiques
3. **Modération** :
   - Gérer les utilisateurs connectés
   - Modérer le chat
   - Voir les signalements
4. **Annonces** : Créer des popups d'annonce

## 🔧 Gestion des Streams

### Création d'un Stream

1. **Panel Admin** → Onglet "Streams"
2. **"Nouveau Stream"** → Remplir les informations
3. **Upload M3U8** : Glissez votre fichier .m3u8
4. **Activation** : Basculer le statut "Actif"

### Format des Fichiers

**Fichier M3U8 exemple** :
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
segment0.ts
#EXTINF:10.0,
segment1.ts
#EXT-X-ENDLIST
```

**Structure des fichiers** :
```
server/media/live/
├── stream-key-1/
│   ├── index.m3u8
│   ├── segment0.ts
│   ├── segment1.ts
│   └── ...
└── stream-key-2/
    ├── index.m3u8
    └── ...
```

## 💬 Système de Chat

### Types de Chat

1. **Chat Global** : Quand aucun stream n'est actif
2. **Chat par Stream** : Spécifique à chaque stream
3. **Persistance** : Chaque chat garde son historique

### Commandes de Modération

- **Supprimer** : Effacer un message
- **Mute** : Empêcher un utilisateur d'écrire (temporaire)
- **Ban** : Bannir définitivement un utilisateur
- **Signaler** : Signaler un message inapproprié

## 🛠️ Configuration Avancée

### Personnalisation des Ports

Modifiez `server/.env` :
```env
WS_PORT=3001      # Port WebSocket
MEDIA_PORT=8000   # Port serveur média
```

### Codes d'Accès

Dans `server/config.mjs` :
```javascript
export const SERVER_CONFIG = {
  ADMIN_ACCESS_CODE: 'ADMIN_BOLT_2025',
  MODERATOR_PASSWORDS: {
    'mod': 'mod123',
    'admin': 'admin123'
  }
};
```

### Base de Données

SQLite avec tables :
- `users` : Utilisateurs enregistrés
- `chat_messages` : Messages du chat
- `connected_users` : Utilisateurs connectés
- `banned_users` : Utilisateurs bannis
- `muted_users` : Utilisateurs mutes

## 🐛 Dépannage

### Port Occupé
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Problème WebSocket
1. Vérifiez que le serveur backend est démarré
2. Consultez la console du navigateur (F12)
3. Redémarrez avec `npm run dev:full`

### Fichiers M3U8
1. Vérifiez le format du fichier
2. Assurez-vous que les segments .ts sont présents
3. Vérifiez les permissions des fichiers

## 📊 API WebSocket

### Messages Client → Serveur
```javascript
// Connexion utilisateur
{
  type: 'user_info',
  username: 'string',
  page: 'string'
}

// Message chat
{
  type: 'chat_message',
  message: ChatMessage
}

// Rejoindre un stream
{
  type: 'join_stream',
  streamKey: 'string'
}
```

### Messages Serveur → Client
```javascript
// Nombre d'utilisateurs
{
  type: 'user_count',
  count: number
}

// Message chat reçu
{
  type: 'chat_message',
  message: ChatMessage
}

// Statut stream
{
  type: 'stream_status',
  status: 'live' | 'offline'
}
```

## 🔐 Sécurité

### Authentification
- Mots de passe hashés avec bcrypt
- Sessions sécurisées
- Protection CSRF

### Modération
- Système de mute progressif (5min → 15min → 30min → 1h → permanent)
- Ban par IP et fingerprint
- Logs de toutes les actions

### Anonymat
- Pas de tracking
- Données minimales collectées
- Chiffrement des communications

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Créez une Pull Request


## 🆘 Support

- **Issues** : Utilisez GitHub Issues

---

**Version 4.0 - Plateforme Complète**
*Développé avec ❤️ par l'équipe ABD Stream*
