# 🚀 Guide de déploiement Hostinger - AstroLearn

## 📋 Prérequis

- Plan Hostinger Business ou Premium (support Node.js)
- Accès au panel Hostinger
- Clés Firebase du projet

## 🔧 Étapes de déploiement

### 1. **Dans le panel Hostinger**

1. Allez dans **"Node.js Apps"**
2. Cliquez sur **"Create App"**
3. Configurez :
   - **Application Name** : `astro-learn`
   - **Node.js Version** : `18.x` ou plus récent
   - **Application Root** : `/domains/votre-domaine.com/public_html`

### 2. **Configuration des variables d'environnement**

Dans **Environment Variables**, ajoutez :

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=space-learn-a2406.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=space-learn-a2406
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=space-learn-a2406.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
NODE_ENV=production
NEXT_PUBLIC_BUILD_ENV=production
```

### 3. **Upload du code**

#### Option A : Via Git (recommandé)

```bash
# Dans votre terminal local
git remote add hostinger ssh://username@hostname/path/to/repo
git push hostinger main
```

#### Option B : Via File Manager

1. Zippez votre projet
2. Uploadez via File Manager Hostinger
3. Dézippez dans le dossier de l'app

### 4. **Installation et build**

Dans le terminal SSH Hostinger :

```bash
# Aller dans le dossier de l'app
cd /domains/votre-domaine.com/public_html

# Installer les dépendances
npm ci --production

# Build pour production
npm run build:hostinger
```

### 5. **Configuration du serveur**

Dans le panel Hostinger, configurez :

- **Startup File** : `server.js` ou `npm start`
- **Port** : `3000` (ou le port attribué par Hostinger)
- **Environment** : `production`

### 6. **Fichier de démarrage (si nécessaire)**

Créez `server.js` :

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(\`> Ready on http://\${hostname}:\${port}\`)
  })
})
```

## ✅ Vérification

1. **Application démarrée** dans le panel Node.js
2. **Domaine configuré** pointant vers l'app
3. **SSL activé** (gratuit avec Hostinger)

## 🔄 Mise à jour

```bash
# Push des changements
git push hostinger main

# Dans SSH Hostinger
npm run build:hostinger
# Redémarrer l'app dans le panel
```

## 🐛 Dépannage

- **Build fails** : Vérifiez les variables d'environnement
- **App ne démarre pas** : Vérifiez les logs dans le panel
- **404 errors** : Vérifiez la configuration du domaine

## 📞 Support

- Documentation Hostinger : [help.hostinger.com](https://help.hostinger.com)
- Support AstroLearn : Consultez les logs Firebase et Next.js
