# 🎮 Intégration Discord - Comptes Temporaires

## 📖 Vue d'ensemble

Le système utilise un bot Discord pour générer automatiquement des comptes temporaires de 24h. Les utilisateurs obtiennent leurs identifiants directement via Discord.

## ✨ Fonctionnalités

- ✅ Génération automatique de comptes via commande Discord `/account`
- ✅ Identifiants envoyés en message privé (DM)
- ✅ Comptes valides pendant **24 heures**
- ✅ Suppression automatique des comptes expirés
- ✅ Un utilisateur Discord = 1 compte actif maximum
- ✅ Logs complets dans le panel admin

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd server
npm install
```

### 2. Configurer le Bot Discord

Suis le guide complet : [`server/DISCORD_BOT_SETUP.md`](server/DISCORD_BOT_SETUP.md)

**Résumé rapide :**
1. Crée une application sur https://discord.com/developers/applications
2. Ajoute un bot et récupère le token
3. Active les intents nécessaires
4. Invite le bot sur ton serveur

### 3. Configuration `.env`

Crée un fichier `.env` dans le dossier `server/` :

```env
DISCORD_BOT_TOKEN=ton_token_discord_ici
WS_PORT=3001
ADMIN_PASSWORD=admin123
```

### 4. Lancer les Services

**Option 1 : Tout en même temps**
```bash
cd server
npm run dev
```

**Option 2 : Séparé**

Terminal 1 - Serveur WebSocket + RTMP :
```bash
cd server
npm start
```

Terminal 2 - Bot Discord :
```bash
cd server
npm run bot
```

## 💻 Utilisation

### Pour les Utilisateurs

1. Sur Discord, tape la commande :
   ```
   /account
   ```

2. Le bot répond avec une confirmation et envoie les identifiants en DM :
   ```
   🎉 Compte Temporaire Créé !

   👤 Username: SwiftDragon4823
   🔑 Password: aB3$mK9pX2qL

   ⏰ Expire le: 27/10/2025 à 15:30

   ⚠️ Important:
   • Ces identifiants sont temporaires (24h)
   • Ne les partage avec personne
   • Connecte-toi sur le site du stream
   ```

3. Utilise ces identifiants pour te connecter sur le site

### Si l'utilisateur a déjà un compte actif

Le bot affiche le temps restant :
```
❌ Compte Existant

Tu as déjà un compte actif!

Username: SwiftDragon4823
Expire dans: 18h 45m
```

## 🔄 Cycle de Vie d'un Compte

```
1. Création via Discord
   └─> Identifiants générés
       └─> Envoi en DM
           └─> Compte actif (24h)
               └─> Expiration automatique
                   └─> Suppression + Log
```

### Timeline :
- **T+0** : Compte créé via `/account`
- **T+24h** : Compte expire automatiquement
- **T+24h+5min** : Compte supprimé de la DB (cleanup toutes les 5min)

## 📊 Panel Admin

Les admins peuvent voir tous les événements dans le panel admin :

### Section Logs
- `ACCOUNT_CREATED` - Nouveau compte Discord créé
- `ACCOUNT_EXPIRED` - Compte supprimé (24h écoulées)

### Section Utilisateurs
Les comptes Discord apparaissent avec :
- Username généré aléatoirement
- Discord ID et username
- Date d'expiration

## 🛡️ Sécurité

### Génération des Identifiants
- **Username** : Combinaison aléatoire (ex: `SwiftDragon4823`)
  - Adjectif + Nom + Nombre (1-9999)
- **Password** : 12 caractères aléatoires
  - Lettres majuscules/minuscules + chiffres + symboles
  - Hashé avec bcrypt (salt rounds: 10)

### Protection
- ✅ 1 compte actif maximum par utilisateur Discord
- ✅ Mots de passe cryptés dans la DB (bcrypt)
- ✅ Identifiants envoyés uniquement en DM
- ✅ Expiration automatique après 24h
- ✅ Logs de toutes les actions

## 🔧 Structure de la Base de Données

### Table `users` (mise à jour)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1,
  discord_id TEXT,              -- ID Discord de l'utilisateur
  discord_username TEXT,        -- Username Discord
  expires_at DATETIME          -- Date d'expiration du compte
);
```

### Exemple de données
```json
{
  "id": "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5",
  "username": "SwiftDragon4823",
  "password_hash": "$2a$10$...",
  "role": "viewer",
  "created_at": "2025-10-26 15:30:00",
  "last_login": null,
  "is_active": 1,
  "discord_id": "123456789012345678",
  "discord_username": "JohnDoe",
  "expires_at": "2025-10-27 15:30:00"
}
```

## 📝 API Endpoints (Local)

Le serveur reste 100% local avec ces endpoints :

```
GET  /api/logs               - Liste des logs d'activité
POST /api/logs               - Créer un log
GET  /api/admin/banned       - Liste des utilisateurs bannis
GET  /api/admin/muted        - Liste des utilisateurs mutes
POST /api/admin/ban          - Bannir un utilisateur
POST /api/admin/mute         - Mute un utilisateur
POST /api/admin/unban        - Débannir un utilisateur
POST /api/admin/unmute       - Démute un utilisateur
```

## 🐛 Dépannage

### Le bot ne se connecte pas
```
❌ DISCORD_BOT_TOKEN manquant dans .env !
```
**Solution** : Ajoute ton token Discord dans le fichier `.env`

### Les DMs ne fonctionnent pas
**Problème** : L'utilisateur a désactivé les DMs

**Solution** : Le bot affichera les identifiants dans le canal (avec avertissement de les supprimer)

### Les comptes ne s'auto-suppriment pas
**Vérification** : Le bot Discord doit être en cours d'exécution (`npm run bot`)

Le cleanup s'exécute automatiquement toutes les 5 minutes.

## 📈 Statistiques

Tu peux suivre l'utilisation dans le panel admin :
- Nombre de comptes créés
- Nombre de comptes expirés
- Utilisateurs actifs
- Logs de création/expiration

## 🎯 Avantages de ce Système

✅ **Pas d'inscription manuelle**
- Les utilisateurs obtiennent un compte instantanément

✅ **Sécurisé**
- Comptes temporaires = pas de DB qui grossit indéfiniment
- Identifiants uniques par utilisateur Discord

✅ **Automatisé**
- Création instantanée
- Suppression automatique
- Logs complets

✅ **Contrôle**
- Les admins voient tout dans le panel
- Possibilité de ban/mute même les comptes Discord

## 📞 Support

Si tu as des questions ou problèmes :
1. Vérifie les logs du bot (`npm run bot`)
2. Vérifie les logs du serveur (`npm start`)
3. Consulte le panel admin pour les détails

---

**Note** : Tout reste en localhost, aucune donnée n'est envoyée à des services externes (sauf Discord pour le bot).
