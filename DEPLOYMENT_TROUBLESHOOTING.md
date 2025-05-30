# 🔧 Guide de résolution des problèmes de déploiement

## Problèmes courants et solutions

### 1. **Erreurs de dépendances React 19**

**Problème :**

```
npm error ERESOLVE could not resolve
Could not resolve dependency: peer react@"^18.0.0" from @testing-library/react
```

**Solution :** ✅ **RÉSOLU**

- Mise à jour vers `@testing-library/react@^16.1.0` (compatible React 19)
- Ajout de `@testing-library/dom@^10.4.0` comme peer dependency
- Fichier `.npmrc` avec `legacy-peer-deps=true`

### 2. **Problèmes de build Next.js 15**

**Problème :** Avertissements de configuration deprecated

**Solution :** ✅ **RÉSOLU**

- Configuration séparée `next.config.hostinger.mjs` pour Hostinger
- Suppression des options dépréciées (`appDir`, `swcMinify`)
- ESLint et TypeScript désactivés pour les builds en production

### 3. **Erreurs modèles 3D Firebase Storage**

**Problème :** CORS et erreurs d'accès aux modèles 3D

**Solution :** ✅ **RÉSOLU**

- Configuration CORS Firebase Storage (`storage.cors.json`)
- Règles de sécurité Firebase Storage (`storage.rules`)
- Système de fallback avec système solaire animé
- API route Next.js 15 corrigée (`await params`)

### 4. **Configuration Vercel**

**Variables d'environnement à configurer dans Vercel :**

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD1nF-_wOkeoowYsrNgkmnkb7E-iPkeO1s
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=space-learn-a2406.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=space-learn-a2406
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=space-learn-a2406.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1093792863177
NEXT_PUBLIC_FIREBASE_APP_ID=1:1093792863177:web:4556babb47b22ce6ed0e18
NODE_ENV=production
NEXT_PUBLIC_BUILD_ENV=production
```

### 5. **Configuration Hostinger**

Voir le guide détaillé : `docs/HOSTINGER_DEPLOY.md`

**Script de build pour Hostinger :**

```bash
npm run build:hostinger
```

### 6. **Tests et compatibilité**

**Pour les tests locaux :**

```bash
npm test
npm run test:coverage
```

**Build de test :**

```bash
npm run build:safe
```

## Checklist de déploiement

### Avant déploiement :

- [ ] Tests passent localement
- [ ] Build local réussi (`npm run build`)
- [ ] Variables d'environnement configurées
- [ ] Pas d'erreurs ESLint critiques
- [ ] Pas d'erreurs TypeScript critiques

### Après déploiement :

- [ ] Application se charge correctement
- [ ] Authentification Firebase fonctionne
- [ ] Modèles 3D se chargent ou fallback s'affiche
- [ ] Navigation entre pages fonctionne
- [ ] Responsive design OK

## Commandes utiles

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build avec logs détaillés
npm run build:safe

# Test specific
npm test -- --verbose

# Vérifier les dépendances obsolètes
npm audit

# Fix automatique des problèmes mineurs
npm audit fix
```

## Logs de déploiement

Les builds réussis doivent afficher :

- ✅ Compiled successfully
- ✅ 16 routes générées
- ✅ ~20 secondes de compilation
- ✅ Taille totale < 600 kB par route

## Support

En cas de problème persistant :

1. Vérifier les logs détaillés
2. Tester le build local d'abord
3. Comparer avec les configurations de référence
4. Consulter la documentation Firebase/Vercel/Hostinger
