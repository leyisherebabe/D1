# 📖 Guide des Fonctionnalités - ABD Stream

## 🎯 Vue d'ensemble

ABD Stream est maintenant équipé de deux fonctionnalités majeures :
1. **Chat Global en temps réel** - Visible sur la page principale quand aucun stream n'est actif
2. **Détection automatique des streams RTMP** - Les streams OBS sont automatiquement indexés et affichés

---

## 💬 Chat Global

### Description
Un système de chat en temps réel qui permet aux utilisateurs de communiquer sur la plateforme même quand aucun stream n'est en cours.

### Fonctionnalités

#### Pour tous les utilisateurs :
- ✅ Envoi de messages en temps réel
- ✅ Voir l'historique des messages
- ✅ Identification par nom d'utilisateur et rôle
- ✅ Messages limités à 500 caractères
- ✅ Auto-scroll vers les nouveaux messages
- ✅ Badges colorés pour les rôles (Admin/Modérateur)

#### Pour les modérateurs et admins :
- ✅ Suppression de n'importe quel message
- ✅ Vue des actions de modération en temps réel

#### Pour l'utilisateur :
- ✅ Suppression de ses propres messages

### Comment ça marche ?

1. **Connexion automatique au chat global**
   - Dès que vous vous connectez, vous rejoignez automatiquement le chat global
   - Le WebSocket envoie un message `join_global_chat`

2. **Envoi de messages**
   ```typescript
   // Structure d'un message
   {
     id: "uuid-unique",
     username: "nom_utilisateur",
     message: "contenu du message",
     timestamp: Date,
     role: "viewer" | "moderator" | "admin"
   }
   ```

3. **Réception en temps réel**
   - Tous les messages sont diffusés via WebSocket
   - Type de message: `chat_message`
   - Historique maintenu (50 derniers messages)

### Affichage

Le chat s'affiche **uniquement quand aucun stream n'est actif** :
- Si `currentStreamSource` est `null` → Chat visible
- Si un stream est actif → Le chat est masqué (pour laisser place au player)

### Code couleur des rôles

| Rôle | Couleur | Badge |
|------|---------|-------|
| Admin | 🔴 Rouge | `ADMIN` |
| Modérateur | 🟣 Violet | `MODERATOR` |
| Viewer | 🟢 Vert | Aucun badge |

---

## 🎥 Détection Automatique des Streams RTMP

### Description
Quand vous démarrez un stream depuis OBS Studio, il est automatiquement détecté, converti en HLS, et affiché sur le site sans aucune action manuelle.

### Flux de fonctionnement

```
OBS Studio (RTMP)
    ↓
Serveur RTMP (port 1935)
    ↓
Conversion FFmpeg → HLS
    ↓
Notification WebSocket
    ↓
Interface Web (affichage automatique)
```

### Configuration OBS

Pour streamer vers ABD Stream :

1. **Ouvrir OBS Studio**

2. **Paramètres → Stream**
   - Service : `Custom`
   - Serveur : `rtmp://localhost:1935/live`
   - Clé de stream : `votre_cle_personnalisee` (ex: `mystream`, `test`, etc.)

3. **Démarrer le streaming**
   - Cliquez sur "Démarrer le streaming" dans OBS
   - Attendez 5-10 secondes

4. **Vérification**
   - Le stream apparaît automatiquement sur votre interface web
   - L'URL HLS est : `http://localhost:8003/live/votre_cle/index.m3u8`

### Processus technique

#### 1. Détection du stream (RTMP Server)
```javascript
nms.on('prePublish', (id, StreamPath, args) => {
  const streamKey = StreamPath.replace('/live/', '');
  // Stream détecté avec la clé: streamKey
});
```

#### 2. Conversion HLS (FFmpeg)
- Le serveur lance automatiquement FFmpeg
- Conversion du flux RTMP en segments HLS (.m3u8 + .ts)
- Segments stockés dans `server/media/live/[streamKey]/`
- Paramètres optimisés pour faible latence :
  - Preset : ultrafast
  - Tune : zerolatency
  - GOP : 50 frames
  - Segment HLS : 2 secondes

#### 3. Notification WebSocket
```javascript
// Après 5 secondes de conversion
notifyWebSocketServer('start', streamKey, {
  title: 'Stream mystream',
  hlsUrl: 'http://localhost:8003/live/mystream/index.m3u8'
});
```

#### 4. Mise à jour de l'interface
```javascript
// Dans App.tsx - Réception côté client
case 'stream_detected':
  const newStreamSource = {
    id: streamKey,
    name: 'Stream détecté',
    url: hlsUrl,
    type: 'm3u8',
    isActive: true,
    createdBy: 'RTMP Auto-Detect'
  };
  setCurrentStreamSource(newStreamSource);
```

### Arrêt du stream

Quand vous arrêtez le stream dans OBS :

1. **Détection d'arrêt**
   ```javascript
   nms.on('donePublish', (id, StreamPath) => {
     // Stream arrêté
   });
   ```

2. **Nettoyage automatique**
   - Arrêt du processus FFmpeg
   - Notification WebSocket : `stream_ended`
   - Suppression des fichiers HLS après 30 secondes
   - Interface retourne à l'état initial (chat visible)

### Gestion de plusieurs streams

Le système supporte plusieurs streams simultanés :
- Chaque stream a sa propre clé unique
- Conversion FFmpeg indépendante pour chaque stream
- Les fichiers sont organisés dans des dossiers séparés
- Basculement automatique entre les streams

### Latence et Performance

| Élément | Latence |
|---------|---------|
| RTMP → Serveur | ~1 seconde |
| Conversion FFmpeg | ~3-5 secondes |
| HLS → Client | ~6-10 secondes |
| **Total** | **~10-16 secondes** |

**Note**: Cette latence est normale pour le HLS. Pour réduire la latence, il faudrait utiliser WebRTC (bien plus complexe).

---

## 🔄 Intégration des deux fonctionnalités

### Comportement dynamique

```javascript
// L'interface s'adapte automatiquement
if (!currentStreamSource) {
  // Afficher : Chat Global
} else {
  // Afficher : StreamPlayer avec le flux HLS
  // + Informations sur le stream
}
```

### Transitions fluides

1. **État initial** : Chat Global visible
2. **Stream OBS démarre** :
   - Détection automatique (5-10 secondes)
   - Le chat disparaît
   - Le player s'affiche avec le stream
3. **Stream OBS s'arrête** :
   - Détection instantanée
   - Le player disparaît
   - Le chat réapparaît

---

## 🛠️ Dépannage

### Le chat ne fonctionne pas

**Symptômes** :
- Messages ne s'envoient pas
- Messages des autres ne s'affichent pas

**Solutions** :
1. Vérifier que le serveur WebSocket est démarré (`cd server && npm start`)
2. Vérifier dans la console : doit voir "WebSocket connected successfully"
3. Vérifier que vous êtes bien connecté (authentifié)
4. Regarder les logs du serveur pour les erreurs

### Le stream RTMP ne s'affiche pas

**Symptômes** :
- OBS stream mais rien ne s'affiche sur le site
- Erreur de connexion RTMP

**Solutions** :

1. **Vérifier la connexion OBS**
   ```
   OBS → Paramètres → Stream
   Serveur DOIT être: rtmp://localhost:1935/live
   ```

2. **Vérifier que le serveur backend est démarré**
   ```bash
   cd server
   npm start
   ```
   Vous devez voir :
   ```
   🎥 [RTMP] Serveur démarré
   📡 [RTMP] RTMP: rtmp://localhost:1935/live
   ```

3. **Vérifier FFmpeg**
   - Sur Linux/Mac : `which ffmpeg`
   - Sur Windows : FFmpeg doit être dans `C:\ffmpeg\bin\`
   - Installer si manquant : `sudo apt install ffmpeg` (Linux)

4. **Vérifier les logs**
   - Dans le terminal du serveur, chercher :
     ```
     [RTMP] 🔴 Stream démarré: votre_cle
     [FFmpeg votre_cle] frame=...
     ```

5. **Temps d'attente**
   - Normal d'attendre 5-10 secondes après avoir démarré OBS
   - La conversion HLS prend du temps

6. **Ports occupés**
   ```bash
   # Vérifier si les ports sont libres
   lsof -i :1935  # RTMP
   lsof -i :8003  # HTTP/HLS
   lsof -i :3001  # WebSocket
   ```

### La latence est trop élevée

**C'est normal pour HLS** :
- Latence HLS standard : 10-20 secondes
- Pour réduire : modifier les paramètres FFmpeg dans `server/rtmp.mjs` :
  ```javascript
  '-hls_time', '1',  // Au lieu de 2
  '-hls_list_size', '2',  // Au lieu de 3
  ```
- Attention : Latence plus faible = plus de segments = plus de bande passante

---

## 📊 Statistiques et Monitoring

### Informations affichées

- **Utilisateurs actifs** : Nombre d'utilisateurs connectés au WebSocket
- **Stream LIVE** : Badge rouge quand un stream est actif
- **Messages** : Compteur dans le header du chat

### Logs serveur

Le serveur affiche des logs détaillés :

```
🔴 [RTMP] Stream démarré: mystream
[FFmpeg mystream] frame= 150 fps= 30 ...
✅ [RTMP] HLS généré: mystream
⏹️ [RTMP] Stream arrêté: mystream
🧹 [RTMP] Nettoyé: mystream
```

---

## 🚀 Prochaines Améliorations Possibles

- [ ] Chat par stream (chat différent pour chaque stream)
- [ ] Système de reactions sur les messages
- [ ] Mentions d'utilisateurs (@username)
- [ ] Commandes de chat (/me, /clear, etc.)
- [ ] Statistiques avancées (viewers au fil du temps)
- [ ] Liste des streams archivés
- [ ] VOD (Video On Demand) - enregistrement automatique
- [ ] Multi-qualité pour les streams
- [ ] Streaming direct depuis le navigateur (WebRTC)

---

## 📝 Notes importantes

1. **Sécurité** : Le système actuel est pour développement local. En production, ajoutez :
   - Authentification pour les streams RTMP
   - HTTPS/WSS pour les connexions sécurisées
   - Rate limiting pour les messages de chat
   - Validation stricte des clés de stream

2. **Performance** : Pour beaucoup d'utilisateurs simultanés :
   - Utiliser Redis pour le cache de messages
   - CDN pour la distribution HLS
   - Load balancer pour le WebSocket

3. **Stockage** : Les fichiers HLS sont supprimés 30 secondes après l'arrêt du stream. Pour garder les VOD, modifier la logique dans `server/rtmp.mjs`.
