# 🎥 ABD Stream - Plateforme de Streaming

Une plateforme de streaming moderne avec chat en temps réel, support RTMP, et panel d'administration complet, propulsée par Supabase.

## ✨ Fonctionnalités

### 🎬 Streaming
- **Support RTMP** - Streamez directement depuis OBS Studio
- **Lecteur HLS** - Lecture adaptative avec contrôles complets
- **Détection automatique** - Les streams sont détectés automatiquement
- **Multi-streams** - Support de plusieurs streams simultanés

### 💬 Chat en Temps Réel
- **Chat global** - Discussion générale de la plateforme
- **Chat par stream** - Chat dédié pour chaque stream
- **Historique persistant** - Stocké dans Supabase
- **Modération en direct** - Mute et ban en temps réel

### 👑 Panel Administrateur
- **Gestion des streams** - Créer et gérer les streams
- **Modération des utilisateurs** - Ban, mute, gestion des rôles
- **Statistiques en temps réel** - Viewers, messages, activité
- **Logs de sécurité** - Toutes les actions sont enregistrées

### 🔒 Sécurité
- **Supabase RLS** - Row Level Security sur toutes les tables
- **Authentification sécurisée** - Gestion des utilisateurs et rôles
- **Protection anti-spam** - Système de mute progressif
- **Fingerprinting** - Identification des utilisateurs

## 🏗️ Architecture

### Backend
- **Express.js** - Serveur API REST
- **WebSocket** - Communication en temps réel
- **Node Media Server** - Serveur RTMP pour OBS
- **Supabase** - Base de données PostgreSQL avec RLS

### Frontend
- **React + TypeScript** - Interface utilisateur moderne
- **Vite** - Build tool rapide
- **TailwindCSS** - Styling
- **HLS.js** - Lecture des streams

### Base de Données (Supabase)
- `profiles` - Profils utilisateurs
- `streams` - Streams actifs
- `chat_messages` - Messages du chat
- `connected_users` - Utilisateurs connectés
- `banned_users` - Utilisateurs bannis
- `muted_users` - Utilisateurs mute

## 📋 Installation

### Prérequis
- Node.js 18+
- FFmpeg (pour la conversion RTMP vers HLS)
- Compte Supabase (déjà configuré)

### Installation

```bash
# Installer les dépendances frontend
npm install

# Installer les dépendances backend
cd server
npm install
cd ..
```

### Configuration

Le fichier `.env` contient la configuration Supabase :
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Démarrage

### Frontend
```bash
npm run dev
```
Accessible sur http://localhost:5173

### Backend
```bash
# Terminal 1 - Serveur WebSocket/API
cd server
npm start

# Terminal 2 - Serveur RTMP
cd server
npm run rtmp
```

### Ports Utilisés
- **5173** - Frontend (Vite)
- **3000** - Backend API + WebSocket
- **1935** - Serveur RTMP (OBS)
- **8003** - Serveur HTTP pour les fichiers HLS

## 🎮 Configuration OBS Studio

### Paramètres de Stream
1. Ouvrez OBS Studio
2. Paramètres → Stream
3. Service : **Custom**
4. Serveur : `rtmp://localhost:1935/live`
5. Clé de stream : `votre_cle_personnalisee`

### Paramètres Recommandés
- **Encodeur** : x264
- **Bitrate** : 2500-6000 Kbps
- **Keyframe Interval** : 2
- **CPU Preset** : veryfast
- **Profile** : high

## 📁 Structure du Projet

```
streaming-platform/
├── src/                        # Frontend React
│   ├── components/             # Composants
│   │   ├── AdminPage.tsx       # Panel admin
│   │   ├── HomePage.tsx        # Page d'accueil
│   │   ├── LiveStreamPage.tsx  # Lecteur de stream
│   │   ├── StreamPlayer.tsx    # Composant lecteur
│   │   └── AuthPage.tsx        # Authentification
│   ├── services/               # Services
│   │   └── websocket.ts        # Client WebSocket
│   ├── types/                  # Types TypeScript
│   └── utils/                  # Utilitaires
├── server/                     # Backend Node.js
│   ├── index.mjs               # Serveur principal
│   ├── rtmp.mjs                # Serveur RTMP
│   ├── package.json            # Dépendances backend
│   └── media/                  # Fichiers HLS générés
├── supabase/                   # Migrations Supabase
└── package.json                # Dépendances frontend
```

## 🌐 Utilisation

### Utilisateur Standard

1. **Créer un compte** - Inscription via l'interface
2. **Regarder les streams** - Voir les streams en direct
3. **Participer au chat** - Chat global ou par stream
4. **Signaler du contenu** - Signaler les abus

### Administrateur

1. **Accès admin** - Utiliser le code d'accès admin
2. **Gérer les streams** - Créer/modifier/supprimer
3. **Modérer les utilisateurs** - Mute/ban
4. **Voir les statistiques** - Dashboard en temps réel

## 🔧 API WebSocket

### Client → Serveur

```javascript
// Informations utilisateur
{
  type: 'user_info',
  username: 'string',
  page: 'string'
}

// Message chat
{
  type: 'chat_message',
  message: {
    text: 'string',
    username: 'string'
  }
}

// Rejoindre un stream
{
  type: 'join_stream',
  streamKey: 'string'
}

// Quitter un stream
{
  type: 'leave_stream'
}

// Action admin
{
  type: 'admin_action',
  action: 'mute_user' | 'ban_user',
  targetUserId: 'string'
}
```

### Serveur → Client

```javascript
// Nombre d'utilisateurs
{
  type: 'user_count',
  count: number
}

// Liste des streams actifs
{
  type: 'active_streams',
  streams: Stream[]
}

// Nouveau message chat
{
  type: 'chat_message',
  message: ChatMessage
}

// Stream détecté
{
  type: 'stream_detected',
  stream: Stream
}

// Stream terminé
{
  type: 'stream_ended',
  streamKey: 'string'
}
```

## 🔐 Sécurité avec Supabase

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec des policies restrictives :

- **profiles** - Users peuvent lire tous les profils, modifier le leur
- **streams** - Lecture pour tous, écriture pour admins/mods
- **chat_messages** - Lecture pour tous, insertion pour authenticated, suppression pour admins
- **banned_users** - Lecture/écriture pour admins uniquement
- **muted_users** - Lecture/écriture pour admins uniquement

### Système de Mute Progressif

1. **1ère infraction** - 5 minutes
2. **2ème infraction** - 15 minutes
3. **3ème infraction** - 30 minutes
4. **4ème infraction** - 1 heure
5. **5ème infraction** - Permanent

## 🛠️ Dépannage

### Port déjà utilisé
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### FFmpeg non trouvé
- **Windows** : Installer FFmpeg dans `C:\ffmpeg\bin\`
- **Linux** : `sudo apt install ffmpeg`
- **Mac** : `brew install ffmpeg`

### WebSocket déconnecté
1. Vérifier que le serveur backend est lancé
2. Vérifier la console navigateur (F12)
3. Vérifier les variables d'environnement Supabase

### Stream ne s'affiche pas
1. Vérifier que le serveur RTMP est lancé
2. Vérifier les logs FFmpeg
3. Vérifier que les fichiers HLS sont générés dans `server/media/live/`

## 📊 Migrations Supabase

Les migrations sont dans `supabase/migrations/` :

```sql
-- Exemple de migration
create_streaming_platform_schema.sql
```

Pour appliquer les migrations manuellement :
```bash
# Via Supabase Dashboard
# SQL Editor → Coller le contenu de la migration → Run
```

## 🔄 Workflow de Streaming

1. **OBS Stream** → Serveur RTMP (port 1935)
2. **RTMP** → FFmpeg conversion → HLS (fichiers .m3u8 et .ts)
3. **HLS** → Serveur HTTP (port 8003)
4. **Frontend** → Lecture HLS via HLS.js
5. **Backend** → Notification WebSocket aux clients
6. **Supabase** → Stockage des métadonnées du stream

## 📝 Scripts Disponibles

```bash
# Frontend
npm run dev          # Lancer le dev server
npm run build        # Build production
npm run preview      # Preview du build

# Backend
npm run server       # Lancer le serveur principal
npm run rtmp         # Lancer le serveur RTMP

# Serveur (dans /server)
npm start            # Serveur WebSocket/API
npm run rtmp         # Serveur RTMP
```

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/nouvelle-feature`)
3. Committez (`git commit -m 'Ajout nouvelle feature'`)
4. Push (`git push origin feature/nouvelle-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

---

**Version 5.0 - Ur best experience**
*Plateforme de streaming moderne avec chat en temps réel*
