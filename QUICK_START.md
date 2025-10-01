# 🚀 Guide de Démarrage Rapide

## Problème : "Le serveur WebSocket n'est pas disponible"

Si vous voyez ce message dans l'interface, c'est que le serveur backend n'est pas démarré.

## Solution : Démarrer le serveur backend

### Étape 1 : Installer les dépendances du serveur

Ouvrez un nouveau terminal et exécutez :

```bash
cd server
npm install
```

### Étape 2 : Démarrer le serveur

```bash
npm start
```

Vous devriez voir :

```
═══════════════════════════════════════════════════════════
🚀  Serveurs démarrés avec succès
═══════════════════════════════════════════════════════════

📡 WebSocket Server: ws://localhost:3001
🎥 RTMP Server: rtmp://localhost:1935/live
🌐 HLS Server: http://localhost:8003

💾 Base de données: SQLite (local)

═══════════════════════════════════════════════════════════
```

### Étape 3 : Vérifier la connexion

Retournez sur l'interface web (http://localhost:5173) et le message d'erreur devrait disparaître.

## Architecture Complète

Pour faire fonctionner l'application complètement, vous avez besoin de **2 terminaux** :

### Terminal 1 - Frontend (déjà démarré)
```bash
npm run dev
```
→ Interface web sur http://localhost:5173

### Terminal 2 - Backend
```bash
cd server
npm start
```
→ WebSocket sur ws://localhost:3001
→ RTMP sur rtmp://localhost:1935/live
→ HLS sur http://localhost:8003

## Résumé des Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Interface utilisateur React |
| WebSocket | ws://localhost:3001 | Chat temps réel, authentification |
| RTMP | rtmp://localhost:1935/live | Réception streams OBS |
| HLS | http://localhost:8003 | Distribution streams vidéo |

## Dépannage

### Le serveur ne démarre pas
- Vérifiez que le port 3001 est libre : `lsof -i :3001`
- Assurez-vous que les dépendances sont installées : `cd server && npm install`

### "npm install" échoue dans le dossier server
- Utilisez Node.js version 18 ou supérieure
- Sur certains systèmes, `bcrypt` nécessite des outils de compilation (build-tools)

### Le WebSocket se déconnecte constamment
- Vérifiez que le serveur backend est toujours en cours d'exécution
- Regardez les logs du serveur pour identifier les erreurs

## Accès Administrateur

Pour accéder au panel admin :
1. Connectez-vous avec un compte
2. Appuyez sur `Ctrl + Shift + A`
3. Entrez le code : `ADMIN_BOLT_2025` (par défaut)

Vous pouvez changer ce code dans `server/.env` :
```env
ADMIN_ACCESS_CODE=votre_code_secret
```

## Configuration OBS Studio

Pour streamer depuis OBS :

1. **Paramètres → Stream**
   - Service : Custom
   - Serveur : `rtmp://localhost:1935/live`
   - Clé de stream : Votre clé personnalisée (ex: `mystream`)

2. **Démarrer le stream dans OBS**

3. **Voir le stream**
   - URL : `http://localhost:8003/live/mystream/index.m3u8`
   - Ou ajoutez-le dans l'interface admin

## Support

Si vous rencontrez des problèmes :
1. Vérifiez que les 2 serveurs sont démarrés
2. Consultez les logs dans les terminaux
3. Vérifiez les ports utilisés
