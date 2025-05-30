# Configuration des Secrets GitHub pour CI/CD

Ce guide vous aide à configurer tous les secrets nécessaires pour activer le pipeline CI/CD automatisé.

## 🔐 Secrets Requis

### Firebase Configuration (Variables publiques)

Ces variables sont sûres à exposer côté client :

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Firebase Admin (Variables sensibles)

Ces variables doivent rester secrètes :

```
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_CLIENT_EMAIL
```

### Déploiement Firebase

```
FIREBASE_TOKEN
FIREBASE_PROJECT_ID
```

## 📝 Comment Obtenir les Valeurs

### 1. Configuration Firebase Client

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. Cliquez sur ⚙️ **Paramètres du projet**
4. Dans l'onglet **Général**, descendez jusqu'à **Vos applications**
5. Cliquez sur **Configuration** (icône `</>`)
6. Copiez les valeurs du `firebaseConfig`

### 2. Service Account Firebase Admin

1. Dans Firebase Console → **Paramètres du projet**
2. Onglet **Comptes de service**
3. Cliquez sur **Générer une nouvelle clé privée**
4. Téléchargez le fichier JSON
5. Extrayez :
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`

### 3. Token Firebase CLI

```bash
# Installer Firebase CLI globalement
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Générer le token CI
firebase login:ci

# Copier le token affiché
```

## 🛠️ Configuration dans GitHub

### Méthode 1 : Interface Web

1. Allez sur votre repository GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Cliquez **New repository secret**
4. Ajoutez chaque secret individuellement

### Méthode 2 : GitHub CLI

```bash
# Installer GitHub CLI
gh auth login

# Ajouter les secrets (remplacez les valeurs)
gh secret set NEXT_PUBLIC_FIREBASE_API_KEY --body "your_api_key"
gh secret set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --body "your_project.firebaseapp.com"
gh secret set NEXT_PUBLIC_FIREBASE_PROJECT_ID --body "your_project_id"
gh secret set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --body "your_project.appspot.com"
gh secret set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --body "your_sender_id"
gh secret set NEXT_PUBLIC_FIREBASE_APP_ID --body "your_app_id"

gh secret set FIREBASE_ADMIN_PRIVATE_KEY --body "$(cat path/to/service-account.json | jq -r .private_key)"
gh secret set FIREBASE_ADMIN_CLIENT_EMAIL --body "$(cat path/to/service-account.json | jq -r .client_email)"

gh secret set FIREBASE_TOKEN --body "your_firebase_token"
gh secret set FIREBASE_PROJECT_ID --body "your_project_id"
```

## ✅ Vérification de la Configuration

### Test Local

Créez un fichier `.env.local` avec toutes les variables :

```bash
# Copier le template
cp .env.example .env.local

# Remplir avec vos vraies valeurs
nano .env.local

# Tester le build
npm run build
npm run build:firebase
```

### Test CI/CD

1. **Push sur une branche** pour déclencher les tests
2. **Ouvrir une Pull Request** pour tester le preview deploy
3. **Merger sur main** pour déclencher le déploiement production

## 🚨 Problèmes Courants

### Erreur "Firebase project not found"

- Vérifiez `FIREBASE_PROJECT_ID`
- Assurez-vous que le token a accès au projet

### Erreur "Permission denied"

- Vérifiez que le service account a les rôles :
  - Firebase Admin SDK Administrator Service Agent
  - Firebase Hosting Admin

### Erreur "Invalid private key"

- Vérifiez que `FIREBASE_ADMIN_PRIVATE_KEY` inclut les `\n`
- Format attendu : `"-----BEGIN PRIVATE KEY-----\nvotre_clé\n-----END PRIVATE KEY-----\n"`

### Build échoue sur les variables d'environnement

- Vérifiez que TOUS les `NEXT_PUBLIC_*` secrets sont configurés
- Les variables publiques doivent être préfixées par `NEXT_PUBLIC_`

## 🔒 Sécurité

### ✅ Bonnes Pratiques

- Utilisez des service accounts dédiés pour CI/CD
- Limitez les permissions aux minimum nécessaire
- Changez les tokens régulièrement
- Ne jamais commit des clés dans le code

### ❌ À Éviter

- Partager les tokens dans les logs
- Utiliser votre compte personnel pour CI/CD
- Donner des permissions trop larges
- Stocker des secrets dans le code source

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs des workflows GitHub Actions
2. Testez la configuration en local d'abord
3. Consultez la [documentation Firebase](https://firebase.google.com/docs)
4. Ouvrez une issue avec les détails de l'erreur (sans exposer les secrets !)

## 🎯 Checklist de Configuration

- [ ] Firebase project créé et configuré
- [ ] Service account généré avec les bonnes permissions
- [ ] Token Firebase CLI généré
- [ ] Tous les secrets GitHub configurés
- [ ] Test local réussi (build + build:firebase)
- [ ] Test CI/CD avec une PR de test
- [ ] Protection des branches configurée
- [ ] Documentation d'équipe mise à jour
