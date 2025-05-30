# Variables d'Environnement - AstroLearn

Ce document liste toutes les variables d'environnement nécessaires pour le projet AstroLearn.

## 📋 Configuration Rapide

Pour configurer votre environnement local, créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

## 🔧 Variables Requises

### Next.js Configuration

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Firebase Client (Variables publiques)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Firebase Admin SDK (Variables sensibles)

```bash
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PROJECT_ID=your_project_id
```

## 🚀 Variables CI/CD

### Déploiement Firebase

```bash
FIREBASE_TOKEN=your_firebase_ci_token
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_EXPORT=false
```

## ⚙️ Variables Optionnelles

### Intelligence Artificielle

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Développement Local

```bash
NEXT_PUBLIC_LOCAL_IP=192.168.1.28
NEXT_PUBLIC_DEV_PORT=3000
```

### Fonctionnalités

```bash
NEXT_PUBLIC_ENABLE_3D_MODELS=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=false
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_DEBUG_MODE=false
```

### Sécurité & CORS

```bash
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Cache & Performance

```bash
NEXT_PUBLIC_CACHE_TTL=3600
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=false
```

### Monitoring (Optionnel)

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
```

## 📝 Description des Variables

### Variables Firebase Client

| Variable                              | Description                              | Exemple                  |
| ------------------------------------- | ---------------------------------------- | ------------------------ |
| `NEXT_PUBLIC_FIREBASE_API_KEY`        | Clé API Firebase pour l'authentification | `AIzaSyC...`             |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`    | Domaine d'authentification Firebase      | `projet.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`     | ID unique du projet Firebase             | `astro-learn-prod`       |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de stockage Firebase              | `projet.appspot.com`     |

### Variables Firebase Admin

| Variable                      | Description                   | Sécurité    |
| ----------------------------- | ----------------------------- | ----------- |
| `FIREBASE_ADMIN_PRIVATE_KEY`  | Clé privée du service account | 🔒 Sensible |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Email du service account      | 🔒 Sensible |
| `FIREBASE_TOKEN`              | Token CI pour déploiement     | 🔒 Sensible |

### Variables de Fonctionnalités

| Variable                         | Description                   | Valeurs      |
| -------------------------------- | ----------------------------- | ------------ |
| `NEXT_PUBLIC_ENABLE_3D_MODELS`   | Active les modèles 3D         | `true/false` |
| `NEXT_PUBLIC_ENABLE_AI_FEATURES` | Active les fonctionnalités IA | `true/false` |
| `NEXT_PUBLIC_DEBUG_MODE`         | Mode debug pour développement | `true/false` |

## 🛡️ Sécurité

### Variables Publiques (NEXT*PUBLIC*\*)

- Exposées côté client dans le bundle JavaScript
- Visibles par tous les utilisateurs
- Utilisées pour la configuration Firebase côté client

### Variables Privées

- Restent côté serveur uniquement
- Utilisées pour l'authentification admin et les APIs
- Ne jamais les exposer côté client

## 📚 Exemples de Configuration

### Développement Local (.env.local)

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_PROJECT_ID=astro-learn-dev
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

### Production (.env.production)

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://astro-learn.web.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=astro-learn-prod
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
```

### CI/CD (GitHub Secrets)

Toutes les variables doivent être configurées comme secrets GitHub.
Voir le guide `GITHUB_SECRETS_SETUP.md` pour les instructions détaillées.

## 🔗 Liens Utiles

- [Guide Configuration Secrets GitHub](./GITHUB_SECRETS_SETUP.md)
- [Documentation Firebase](https://firebase.google.com/docs/web/setup)
- [Variables d'environnement Next.js](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## ⚠️ Sécurité Importante

1. **Ne jamais commit** les vraies valeurs dans le repository
2. **Utilisez .env.local** pour le développement (ignoré par Git)
3. **Configurez les secrets GitHub** pour le CI/CD
4. **Rotation régulière** des tokens et clés API
5. **Principe du moindre privilège** pour les service accounts
