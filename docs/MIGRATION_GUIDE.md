# 🔄 Migration Vercel → Hostinger - Guide complet

## 🎯 Objectif

Migrer AstroLearn de Vercel vers Hostinger pour centraliser domaine + hébergement.

## ⏱️ Temps estimé : 30-45 minutes

## 📋 Prérequis vérifiés

- ✅ Plan Hostinger Business/Premium avec Node.js
- ✅ Domaine configuré sur Hostinger
- ✅ Accès au panel Hostinger
- ✅ Build local fonctionnel

## 🚀 Étapes de migration

### **1. Test local (5 min)**

```bash
# Vérifiez que le build Hostinger fonctionne
npm run build:hostinger

# Test en local
npm run start:hostinger
# → Devrait fonctionner sur http://localhost:3000
```

### **2. Configuration Hostinger (10 min)**

#### Dans le panel Hostinger :

1. **Websites** → **Node.js Apps** → **Create App**
2. **Configuration** :
   - Application Name : `astro-learn`
   - Node.js Version : `18.x` (recommandé)
   - Application Root : `/domains/votre-domaine.com/public_html`
   - Startup File : `server.js` ou `npm start`

#### Variables d'environnement :

Copiez depuis Vercel → Hostinger :

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_real_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=space-learn-a2406.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=space-learn-a2406
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=space-learn-a2406.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_real_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_real_app_id
NODE_ENV=production
NEXT_PUBLIC_BUILD_ENV=production
```

### **3. Déploiement du code (15 min)**

#### Option A : Upload ZIP (plus simple)

```bash
# 1. Créez un ZIP du projet
# Excluez : node_modules/, .git/, .next/

# 2. Uploadez via File Manager Hostinger
# 3. Dézippez dans le dossier de l'app
```

#### Option B : Git SSH (plus pro)

```bash
# 1. Configurez SSH avec Hostinger
# 2. Ajoutez remote Git
git remote add hostinger ssh://username@hostname/path/to/repo
git push hostinger main
```

### **4. Installation et build (10 min)**

Dans le terminal SSH Hostinger :

```bash
# Naviguez vers votre app
cd /domains/votre-domaine.com/public_html

# Installation
npm install

# Build production
npm run build:hostinger

# Vérifiez que ça démarre
npm run start:hostinger
```

### **5. Configuration domaine (5 min)**

1. **Dans Hostinger** → **Domains** → **Manage**
2. **DNS Zone** → Vérifiez que A record pointe vers l'IP de l'app
3. **SSL** → Activez le certificat gratuit

### **6. Test et validation (5 min)**

✅ **Checklist de validation :**

- [ ] App accessible sur votre domaine
- [ ] Authentification Firebase fonctionne
- [ ] Modèles 3D se chargent ou fallback s'affiche
- [ ] Navigation fluide
- [ ] SSL actif (https://)

## 🔄 Workflow de déploiement futur

### Mise à jour rapide :

```bash
# 1. Développement local
npm run dev

# 2. Test build
npm run build:hostinger

# 3. Upload vers Hostinger (File Manager ou Git)

# 4. Rebuild sur serveur
npm run build:hostinger
# Restart app dans le panel
```

### Automatisation possible :

- GitHub Actions → SSH vers Hostinger
- Webhook Hostinger sur push GitHub

## 📊 Comparaison Vercel vs Hostinger

| Aspect          | Vercel                 | Hostinger             |
| --------------- | ---------------------- | --------------------- |
| **Déploiement** | Auto Git               | Manuel/SSH            |
| **Performance** | Edge Functions         | CDN inclus            |
| **Coût**        | Gratuit puis €20+/mois | Inclus dans plan      |
| **Contrôle**    | Limité                 | Accès serveur complet |
| **Domaine**     | Séparé                 | Tout intégré          |
| **Analytics**   | Intégrées              | À configurer          |

## 🛠️ Dépannage migration

### Problèmes courants :

1. **Build fails** → Vérifiez Node.js version et variables env
2. **404 errors** → Vérifiez la configuration du domaine
3. **Firebase errors** → Vérifiez les clés API
4. **Performance** → Activez le cache Hostinger

### Support :

- **Hostinger** : Help center + chat 24/7
- **AstroLearn** : Logs dans `/domains/votre-domaine/logs/`

## 🎯 Avantages post-migration

- ✅ **Coût optimisé** : Tout inclus dans un plan
- ✅ **Contrôle total** : Accès serveur, logs, configuration
- ✅ **Simplicité** : Domaine + app + emails au même endroit
- ✅ **Support** : Un seul point de contact
- ✅ **Évolutivité** : Plus de ressources si besoin
