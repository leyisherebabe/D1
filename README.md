# 🎥 ABD Stream - Version Optimisée 2.0.3

Une plateforme de streaming et chat en temps réel, optimisée pour la simplicité et la performance.

## 🚀 Fonctionnalités

- **Chat en temps réel** : Système de chat global avec WebSocket
- **Authentification sécurisée** : Inscription/connexion avec hashage bcrypt
- **Interface moderne** : Design épuré avec Tailwind CSS
- **Base de données simple** : SQLite avec structure optimisée
- **Multi-utilisateurs** : Gestion des utilisateurs connectés en temps réel

## 📋 Installation Rapide

### 1. Cloner et installer
```bash
git clone <url-du-repo>
cd abd-stream
npm install
cd server && npm install && cd ..
```

### 2. Démarrer l'application
```bash
npm start
```

Cette commande démarre automatiquement :
- Serveur WebSocket (port 3000)
- Interface web (port 5173)

## 🌐 Accès

- **Site web** : http://localhost:5173
- **API WebSocket** : ws://localhost:3000
- **API Status** : http://localhost:3000/api/status

## 📁 Structure Optimisée

```
abd-stream/
├── src/                    # Frontend React
│   ├── components/         # Composants React
│   │   ├── AuthPage.tsx    # Page d'authentification
│   │   ├── HomePage.tsx    # Page d'accueil
│   │   ├── SimpleLiveStreamPage.tsx # Chat principal
│   │   ├── ChatMessage.tsx # Composant message
│   │   ├── LegalPage.tsx   # Mentions légales
│   │   └── DMCAPage.tsx    # Page DMCA
│   ├── services/          # Service WebSocket
│   ├── types/             # Types TypeScript
│   └── utils/             # Utilitaires centralisés
├── server/                # Backend Node.js
│   ├── data/              # Base de données SQLite
│   ├── config.js          # Configuration centralisée
│   ├── database.js        # Gestion base de données
│   ├── websocket.js       # Serveur WebSocket
│   ├── main.js            # Point d'entrée principal
│   └── package.json
└── README.md
```

## 🔧 Scripts Disponibles

### Frontend
- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run clean` - Nettoyer le cache

### Backend
- `npm run dev` - Démarrer le serveur
- `npm run clean` - Nettoyer la base de données

### Combiné
- `npm start` - Démarrer tout (recommandé)

## 🔒 Sécurité

- **Mots de passe hashés** avec bcrypt
- **Validation des données** côté serveur
- **Protection XSS** avec sanitisation
- **WebSocket sécurisé** avec reconnexion automatique

## 👑 Accès Administrateur

Combinaison secrète : `Ctrl + Shift + A`
Code par défaut : `ADMIN_2025`

## 🛠️ Configuration

Modifiez `server/config.js` pour personnaliser :
- Ports des serveurs
- Codes d'accès admin
- Limites utilisateurs
- Chemins de base de données

## 📊 Base de Données

Structure SQLite optimisée :
- `users` - Utilisateurs enregistrés
- `messages` - Historique des messages
- `connected_users` - Utilisateurs connectés

## 🐛 Dépannage

### Port déjà utilisé
```bash
# Identifier le processus
netstat -ano | findstr :3000
# Terminer le processus
taskkill /PID <PID> /F
```

### Problème WebSocket
1. Vérifiez que le serveur (port 3000) est démarré
2. Consultez la console du navigateur
3. Redémarrez avec `npm start`

## 🎯 Optimisations Apportées

- ✅ Structure de fichiers simplifiée et organisée
- ✅ Suppression des fichiers inutiles (RTMP, Discord, etc.)
- ✅ Code centralisé et réutilisable
- ✅ Configuration unifiée
- ✅ Composants modulaires
- ✅ Utilitaires centralisés
- ✅ Base de données optimisée
- ✅ Performance améliorée

---

**Version 3.0 - Optimisée et Réorganisée**
