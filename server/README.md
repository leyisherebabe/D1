# Backend Serveur de Streaming

Backend propre et local pour la plateforme de streaming.

## Structure

```
server/
├── index.mjs              # Point d'entrée principal
├── websocket-server.mjs   # Serveur WebSocket
├── rtmp.mjs              # Serveur RTMP
├── config.mjs            # Configuration
├── lib/
│   ├── database.mjs      # Gestion base de données SQLite
│   └── logger.mjs        # Logger Discord (optionnel)
├── data/                 # Base de données SQLite (créée automatiquement)
└── media/                # Fichiers HLS (créés automatiquement)
```

## Installation

```bash
cd server
npm install
```

## Configuration

Copiez `.env.example` vers `.env` et configurez les variables.

## Démarrage

```bash
npm start
```

## Services

- **WebSocket**: `ws://localhost:3001` - Chat, authentification, modération
- **RTMP**: `rtmp://localhost:1935/live` - Réception streams OBS
- **HLS**: `http://localhost:8003` - Distribution streams

## Base de données

Base de données SQLite locale dans `server/data/app.db`:

- Utilisateurs connectés
- Messages de chat
- Utilisateurs bannis/mutes
- Streams actifs
- Comptes utilisateurs

## Configuration OBS

- **Serveur**: `rtmp://localhost:1935/live`
- **Clé de stream**: Votre clé personnalisée

Le stream sera disponible sur: `http://localhost:8003/live/[votre_cle]/index.m3u8`
