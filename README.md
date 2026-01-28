# 🛡️ Sentinel v2.0 - Alpha

Bot Discord Multifonction Professionnel avec Dashboard Web

## 🚀 Fonctionnalités

### ✅ Modération Avancée
- Ban, Kick, Mute, Warn système complet
- Auto-modération (spam, liens, toxicité)
- Logs de modération détaillés
- Gestion des permissions

### 💰 Système d'Économie
- Monnaie virtuelle personnalisable
- Shop avec items
- Daily rewards & travail
- Transactions entre utilisateurs

### 📊 Niveaux & XP
- Système de progression automatique
- Rôles récompenses par niveau
- Leaderboard interactif
- Messages personnalisés

### 🎫 Système de Tickets
- Création via boutons/commandes
- Panels personnalisables
- Transcripts HTML
- Gestion avancée

### 👋 Communauté
- Messages bienvenue/départ
- Système de suggestions
- Sondages
- Giveaways
- Annonces

### 🎮 Divertissement
- Mini-jeux (8ball, dice, coinflip)
- Commandes sociales (hug, kiss, slap)
- Memes & GIFs

### 🌐 Dashboard Web
- Interface professionnelle
- Configuration complète
- Statistiques en temps réel
- Gestion multi-serveurs

## 🛠️ Stack Technique

- **Discord.js** v14
- **SQLite3** (better-sqlite3)
- **Express.js** API REST
- **Winston** Logging
- **Discord OAuth2** Authentication

## 📦 Installation

```bash
# Clone le projet
git clone https://github.com/KlementDUPONT/Sentinel.git
cd Sentinel

# Installe les dépendances
npm install

# Configure les variables d'environnement
cp .env.template .env
# Édite .env avec tes valeurs

# Initialise la base de données
npm run db:migrate

# Déploie les commandes slash
npm run deploy

# Lance le bot
npm start
