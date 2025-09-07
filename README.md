# 🎥 ABD Stream - Plateforme de Streaming Privée

Une plateforme de streaming sécurisée et anonyme avec chat en temps réel, gestion d'utilisateurs et support RTMP.

## 🚀 Fonctionnalités

- **Streaming RTMP** : Support complet pour OBS Studio et autres logiciels de streaming
- **Chat en temps réel** : Système de chat avec modération avancée
- **Authentification sécurisée** : Système d'authentification avec rôles (viewer, moderator, admin)
- **Interface moderne** : Design futuriste avec animations et effets visuels
- **Gestion d'utilisateurs** : Panel d'administration complet
- **Anonymat garanti** : Protection de la vie privée des utilisateurs
- **Multi-plateforme** : Compatible Windows, macOS et Linux

## 📋 Prérequis

- **Node.js** (version 18 ou supérieure)
- **npm** ou **yarn**
- **FFmpeg** (pour le streaming RTMP)
- **OBS Studio** (recommandé pour le streaming)

## 🛠️ Installation

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd abd-stream
```

### 2. Installer les dépendances

**Frontend :**
```bash
npm install
```

**Backend :**
```bash
cd server
npm install
```

### 3. Configuration

Copiez le fichier de configuration d'exemple :
```bash
cd server
cp .env.example .env
```

Modifiez le fichier `.env` avec vos paramètres :
```env
# Configuration Discord (optionnel)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE

# Clés de sécurité (CHANGEZ EN PRODUCTION!)
ENCRYPTION_KEY=VOTRE_CLE_SECRETE_ICI
ADMIN_ACCESS_CODE=VOTRE_CODE_ADMIN_ICI
MOD_PASSWORD=mot_de_passe_moderateur
```

### 4. Installer FFmpeg (pour le streaming RTMP)

**Linux/macOS :**
```bash
cd server
chmod +x install-ffmpeg.sh
./install-ffmpeg.sh
```

**Windows :**
```bash
# Avec Chocolatey
choco install ffmpeg

# Ou téléchargement manuel depuis https://ffmpeg.org/download.html
```

## 🚀 Démarrage

### Option 1: Démarrage complet (Recommandé)
```bash
# Depuis la racine du projet
npm run start:all
```

Cette commande démarre :
- Serveur WebSocket (port 3000)
- Frontend Vite (port 5173)
- Serveur média (port 8015)

### Option 2: Démarrage manuel

**Terminal 1 - Serveur WebSocket :**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend :**
```bash
npm run dev
```

**Terminal 3 - Serveur média :**
```bash
cd server
npm run media
```

## 📺 Configuration OBS Studio

1. **Ouvrir OBS Studio**
2. **Aller dans Paramètres → Stream**
3. **Configurer :**
   - **Service :** Serveur personnalisé
   - **Serveur :** `rtmp://localhost:1935/live`
   - **Clé de stream :** `votre-cle-personnalisee`
4. **Démarrer le streaming**

## 🌐 Accès à la plateforme

- **Site web :** http://localhost:5173
- **Serveur média :** http://localhost:8015
- **API WebSocket :** ws://localhost:3000

## 👑 Accès Administrateur

1. **Combinaison secrète :** `Ctrl + Shift + A`
2. **Code d'accès :** Défini dans votre fichier `.env`
3. **Panel admin :** Gestion complète des utilisateurs et du contenu

## 📁 Structure du Projet

```
abd-stream/
├── src/                    # Frontend React + TypeScript
│   ├── components/         # Composants React
│   ├── services/          # Services (WebSocket, etc.)
│   ├── types/             # Types TypeScript
│   └── utils/             # Utilitaires
├── server/                # Backend Node.js
│   ├── discord/           # Intégration Discord
│   ├── data/              # Base de données SQLite
│   ├── media/             # Fichiers média générés
│   ├── server.mjs         # Serveur WebSocket principal
│   ├── simple-media.mjs   # Serveur média HTTP
│   └── database.mjs       # Gestion base de données
└── README.md              # Ce fichier
```

## 🔧 Scripts Disponibles

### Frontend
- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire pour la production
- `npm run preview` - Prévisualiser la build de production

### Backend
- `npm run dev` - Démarrer le serveur WebSocket
- `npm run media` - Démarrer le serveur média
- `npm run bot` - Démarrer le bot Discord (optionnel)

### Combinés
- `npm run start:all` - Démarrer tous les services
- `npm run dev:full` - Mode développement complet

## 🤖 Bot Discord (Optionnel)

Le projet inclut un bot Discord pour la gestion à distance :

```bash
cd server
npm run bot
```

**Commandes disponibles :**
- `!stats` - Statistiques de la plateforme
- `!users` - Liste des utilisateurs connectés
- `!banned` - Liste des utilisateurs bannis
- `!unban <ip>` - Débannir un utilisateur

## 🔒 Sécurité

- **Chiffrement AES-256** pour les communications
- **Authentification par rôles** (viewer, moderator, admin)
- **Protection anti-spam** et système de modération
- **Logs détaillés** de toutes les actions
- **Bannissement automatique** des utilisateurs malveillants

## 🐛 Dépannage

### Port déjà utilisé
```bash
# Identifier le processus utilisant le port
netstat -ano | findstr :PORT_NUMBER

# Terminer le processus
taskkill /PID <PID> /F
```

### FFmpeg non trouvé
```bash
# Vérifier l'installation
ffmpeg -version

# Réinstaller si nécessaire
./install-ffmpeg.sh
```

### Problèmes de WebSocket
1. Vérifiez que le serveur WebSocket (port 3000) est démarré
2. Vérifiez les logs du serveur pour les erreurs
3. Testez la connexion avec un client WebSocket

## 📝 Logs et Monitoring

Les logs sont disponibles dans :
- **Console du serveur** : Logs en temps réel
- **Base de données SQLite** : `server/data/database.sqlite`
- **Discord** : Logs automatiques (si configuré)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Issues GitHub** : Pour les bugs et demandes de fonctionnalités
- **Discord** : Serveur communautaire (lien dans l'app)
- **Email** : contact@abdstream.com

## 🎯 Roadmap

- [ ] Support multi-streams simultanés
- [ ] Intégration avec d'autres plateformes de streaming
- [ ] Application mobile
- [ ] API REST complète
- [ ] Système de notifications push
- [ ] Enregistrement automatique des streams

---

**Développé avec ❤️ par ley**

*Pour une expérience de streaming sécurisée et anonyme*
