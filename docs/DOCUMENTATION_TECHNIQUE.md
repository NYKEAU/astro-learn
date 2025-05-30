# 📚 Documentation Technique - AstroLearn

## 🎯 Vue d'ensemble du projet

**AstroLearn** est une plateforme d'apprentissage interactive dédiée à l'astronomie, développée avec Next.js 15 et Firebase. Le projet offre une expérience éducative immersive avec des modules interactifs, des exercices engageants, et une visualisation 3D de l'univers.

### Objectifs principaux

- 🌟 Démocratiser l'apprentissage de l'astronomie
- 🎮 Offrir une expérience interactive et gamifiée
- 🌍 Support multilingue (FR/EN)
- 📱 Accessibilité mobile et responsive design
- 🎨 Visualisations 3D immersives avec support AR

---

## 🏗️ Architecture technique

### Stack technologique

#### Frontend

- **Framework** : Next.js 15.3.1 (App Router)
- **Runtime** : React 19.0.0
- **Langage** : JavaScript + TypeScript 5.8.3
- **Styling** : Tailwind CSS 3.4.1 + Shadcn UI
- **Animations** : Framer Motion 12.4.10
- **3D/AR** : Three.js 0.175.0 + React Three Fiber + WebXR

#### Backend & Services

- **Base de données** : Firebase Firestore
- **Authentification** : Firebase Auth
- **Storage** : Firebase Storage
- **Intelligence artificielle** : OpenAI API
- **Déploiement** : Firebase Hosting

#### Développement & Tests

- **Tests** : Jest 29.7.0 + @firebase/rules-unit-testing
- **Linting** : ESLint 9 (configuration Next.js)
- **CI/CD** : GitHub Actions
- **Gestionnaire de paquets** : npm

### Architecture des dossiers

```
astro-learn/
├── src/
│   ├── app/                    # Routes Next.js (App Router)
│   │   ├── api/               # API routes
│   │   │   ├── ai/            # Endpoint IA
│   │   │   ├── network-info/  # Informations réseau
│   │   │   └── proxy-model/   # Proxy pour modèles 3D
│   │   ├── dashboard/         # Tableau de bord utilisateur
│   │   ├── modules/           # Pages des modules d'apprentissage
│   │   │   └── [moduleId]/    # Module dynamique
│   │   │       ├── lessons/   # Leçons du module
│   │   │       └── exercises/ # Exercices du module
│   │   ├── profile/           # Profil utilisateur
│   │   ├── register/          # Inscription utilisateur
│   │   ├── settings/          # Paramètres
│   │   └── universe/          # Univers 3D personnel
│   ├── components/            # Composants React réutilisables
│   │   ├── ui/               # Composants UI basiques (Shadcn)
│   │   ├── forms/            # Composants de formulaires
│   │   ├── exercises/        # Composants d'exercices
│   │   ├── 3d/               # Composants 3D/AR
│   │   ├── debug/            # Outils de debug
│   │   └── universe/         # Composants univers 3D
│   ├── lib/                  # Utilitaires et configuration
│   │   ├── firebase/         # Configuration Firebase
│   │   ├── hooks/            # Hooks personnalisés
│   │   ├── services/         # Services métier
│   │   └── utils/            # Utilitaires
│   └── types/                # Définitions TypeScript
├── public/                   # Assets statiques
│   ├── models/              # Modèles 3D (.glb)
│   └── images/              # Images et textures
├── scripts/                 # Scripts d'automatisation
├── .github/workflows/       # GitHub Actions CI/CD
└── docs/                    # Documentation
```

---

## 🔥 Architecture Firebase

### Collections Firestore

#### 📚 `modules`

Structure des modules d'apprentissage :

```javascript
modules/{moduleId} = {
  id: string,
  title: {
    fr: string,
    en: string
  },
  description: {
    fr: string,
    en: string
  },
  order: number,
  isLocked: boolean,
  requiredModule: string | null,

  // Contenu du module
  lessons: {
    [lessonId]: {
      title: { fr: string, en: string },
      content: { fr: string, en: string },
      order: number
    }
  },

  exercises: {
    [partId]: {
      [exerciseId]: {
        type: "multiple-choice" | "fill-in-blank" | "drag-drop",
        question: { fr: string, en: string },
        options?: string[],
        correctAnswer: string | string[],
        explanation: { fr: string, en: string }
      }
    }
  },

  // Ressources 3D
  models: {
    [modelId]: {
      url: string,
      name: { fr: string, en: string },
      description: { fr: string, en: string }
    }
  }
}
```

#### 👤 `users`

Données utilisateur principales :

```javascript
users/{userId} = {
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  createdAt: timestamp,
  lastLoginAt: timestamp,
  isPremium: boolean,
  subscription: {
    type: "free" | "premium",
    startDate: timestamp,
    endDate: timestamp
  }
}
```

#### 📋 `profilesInfos`

Profils détaillés et préférences :

```javascript
profilesInfos/{userId} = {
  // Informations personnelles
  firstName: string,
  lastName: string,
  age: number,
  country: string,

  // Préférences d'apprentissage
  learningGoals: string[],
  interests: string[],
  astronomyKnowledge: "beginner" | "intermediate" | "advanced",

  // Parcours personnalisé
  personalizedPath: string[], // ["1", "2", "3", "4", "5"]
  unlockedModules: string[],

  // Métadonnées
  createdAt: timestamp,
  updatedAt: timestamp,
  onboardingCompleted: boolean
}
```

#### 📊 `users/{userId}/progress/{moduleId}`

Système de progression granulaire :

```javascript
users/{userId}/progress/{moduleId} = {
  moduleId: string,

  // Structure des réponses par partie
  parts: {
    part1: {
      ex1: {
        userAnswer: string,
        isCorrect: boolean,
        timestamp: string
      },
      ex2: { ... }
    },
    part2: { ... }
  },

  // Statistiques de progression
  completedExercises: string[], // ["ex1", "ex2", "ex3"]
  totalExercises: number,
  score: number,              // Nombre de bonnes réponses
  percentage: number,         // (score / totalExercises) * 100
  completed: boolean,         // true si percentage >= 80%

  // Timestamps
  startedAt: timestamp,
  lastUpdated: timestamp,
  completedAt: timestamp | null
}
```

### Règles de sécurité Firestore

```javascript
// Lecture : utilisateur authentifié peut lire ses propres données
allow read: if request.auth != null && request.auth.uid == userId;

// Écriture : utilisateur authentifié peut écrire ses propres données
allow write: if request.auth != null && request.auth.uid == userId;

// Modules : lecture publique, écriture admin uniquement
allow read: if true;
allow write: if request.auth != null && request.auth.token.admin == true;
```

---

## 🔧 Hooks Principaux

### `useAuth()`

Hook d'authentification principal :

```javascript
/**
 * Hook d'authentification principal
 * @returns {Object} État d'authentification
 */
const {
  user, // Utilisateur Firebase
  loading, // État de chargement
  isPremium, // Statut premium
  unlockedModules, // Modules débloqués
  progression, // Progression globale
  signIn, // Fonction de connexion
  signOut, // Fonction de déconnexion
  updateProfile, // Mise à jour du profil
} = useAuth();
```

### `useModuleAccess()`

Hook pour gérer l'accès aux modules :

```javascript
/**
 * Hook pour gérer l'accès aux modules en fonction du rôle et de la progression
 * @returns {Object} Fonctions d'accès aux modules
 */
const {
  canAccessModule, // (moduleId: string) => boolean
  getModuleOrder, // () => string[]
  isModuleCompleted, // (moduleId: string) => boolean
  getNextModuleToUnlock, // () => string | null
  getModuleAccessMessage, // (moduleId: string, isLocked: boolean) => string
  getPreviousModule, // (moduleId: string) => string | null
} = useModuleAccess();
```

### `useModuleCompletion()`

Hook pour gérer la complétion des modules :

```javascript
/**
 * Hook pour gérer la complétion des modules
 * @returns {Object} Fonctions de complétion
 */
const {
  markModuleCompleted, // (moduleId: string) => Promise<boolean>
  getCompletionStatus, // (moduleId: string) => boolean
  calculateProgress, // (moduleId: string) => number
  unlockNextModule, // (moduleId: string) => Promise<boolean>
} = useModuleCompletion();
```

---

## 🌐 API Routes

### `/api/ai/route.ts`

Endpoint pour les fonctionnalités IA :

```javascript
/**
 * Endpoint pour les fonctionnalités IA
 * @method POST
 * @body {Object} { prompt: string, context?: string }
 * @returns {Object} { response: string, usage: Object }
 */
```

### `/api/network-info/route.js`

Informations réseau pour l'optimisation :

```javascript
/**
 * Informations réseau pour l'optimisation
 * @method GET
 * @returns {Object} { ip: string, country: string, speed: string }
 */
```

### `/api/proxy-model/[...path]/route.js`

Proxy pour les modèles 3D :

```javascript
/**
 * Proxy pour les modèles 3D avec headers CORS
 * @method GET
 * @param {string[]} path - Chemin vers le modèle
 * @returns {Response} Fichier 3D avec headers CORS appropriés
 */
```

---

## 📊 Fonctions de Progression

### `initializeModuleProgress(userId, moduleId)`

Initialise la progression d'un module :

```javascript
/**
 * Initialise la progression d'un module pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} moduleId - ID du module
 * @returns {Promise<boolean>} Succès de l'initialisation
 */
```

### `saveExerciseAnswer(...)`

Sauvegarde la réponse d'un exercice :

```javascript
/**
 * Sauvegarde la réponse d'un exercice et met à jour la progression
 * @param {string} userId - ID de l'utilisateur
 * @param {string} moduleId - ID du module
 * @param {string} partId - ID de la partie (ex: "part1")
 * @param {string} exerciseId - ID de l'exercice (ex: "ex1")
 * @param {string} userAnswer - Réponse de l'utilisateur
 * @param {boolean} isCorrect - Si la réponse est correcte
 * @param {number} totalExercisesInModule - Nombre total d'exercices
 * @returns {Promise<Object|null>} Progression mise à jour ou null
 */
```

### `getModuleProgress(userId, moduleId)`

Récupère la progression d'un module :

```javascript
/**
 * Récupère la progression d'un module
 * @param {string} userId - ID de l'utilisateur
 * @param {string} moduleId - ID du module
 * @returns {Promise<Object|null>} Données de progression ou null
 */
```

---

## 🎯 Logique de Progression

### Calcul du Pourcentage

```javascript
// Formule de calcul
percentage = (score / totalExercises) * 100;

// Conditions de complétion
completed = percentage >= 80; // 80% requis pour compléter un module
```

### Déverrouillage des Modules

```javascript
// Logique d'accès séquentiel
if (isPremium) return true; // Premium : tout débloqué
if (moduleId === "1") return true; // Module 1 toujours accessible
if (!user) return false; // Non connecté : rien sauf module 1

// Vérification séquentielle basée sur personalizedPath
const order = getModuleOrder();
const currentIndex = order.indexOf(moduleId);
const previousModule = order[currentIndex - 1];
return isModuleCompleted(previousModule);
```

---

## 🧪 Tests et Qualité

### Configuration Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"],
};
```

### Tests de Progression

Tests unitaires avec Firebase Rules Unit Testing :

```javascript
// Exemple de test
describe("saveExerciseAnswer", () => {
  beforeEach(() => {
    clearFirestoreData();
  });

  it("should save exercise answer and update progress", async () => {
    const result = await saveExerciseAnswer(
      "testUser",
      "1",
      "part1",
      "ex1",
      "answer",
      true,
      10
    );
    expect(result.score).toBe(1);
    expect(result.percentage).toBe(10);
  });
});
```

### Couverture de Code

- **Objectif** : 70% minimum
- **Actuel** : 69% pour progress.js
- **Commande** : `npm run test:coverage`

---

## 🚀 Déploiement et CI/CD

### Scripts de Build

```bash
# Build standard
npm run build

# Build pour Firebase (avec nettoyage Windows)
npm run build:firebase

# Déploiement
npm run deploy

# Preview deployment
npm run deploy:preview
```

### Pipeline CI/CD GitHub Actions

#### Workflow Principal (`.github/workflows/ci.yml`)

- **Triggers** : Push sur `main`/`develop`, PRs vers `main`
- **Jobs** :
  - Tests automatiques et linting
  - Build multi-plateforme (Linux + Windows)
  - Déploiement Firebase automatique
  - Notifications de statut

#### Workflow PR (`.github/workflows/pr-check.yml`)

- **Triggers** : Ouverture/mise à jour de PR
- **Jobs** :
  - Détection des changements
  - Vérification qualité (seuil 70% couverture)
  - Validation du build
  - Déploiement preview avec commentaire automatique

### Résolution EPERM Windows

Scripts spéciaux pour résoudre les erreurs Windows :

```bash
# scripts/build-windows.bat
taskkill /f /im node.exe 2>nul
rmdir /s /q .next 2>nul
npm run build
```

---

## 📱 Fonctionnalités 3D/AR

### Composants 3D

```javascript
/**
 * Composant de visualisation 3D avec support AR
 * @param {Object} props - Propriétés du composant
 * @param {string} props.modelUrl - URL du modèle 3D
 * @param {boolean} props.autoRotate - Rotation automatique
 * @param {boolean} props.enableAR - Activer le mode AR
 * @param {Function} props.onLoad - Callback de chargement
 */
<ModelViewer
  modelUrl="/models/earth.glb"
  autoRotate={true}
  enableAR={true}
  onLoad={handleModelLoad}
/>
```

### Support AR/WebXR

```javascript
/**
 * Hook pour la détection et gestion du support AR
 * @returns {Object} État et fonctions AR
 */
const {
  isARSupported, // boolean
  startARSession, // () => Promise<void>
  endARSession, // () => void
  isARActive, // boolean
} = useARSupport();
```

---

## 🌍 Internationalisation

### Structure des Traductions

```javascript
// LanguageContext.js
const translations = {
  fr: {
    "module.title": "Titre du module",
    "exercise.question": "Question de l'exercice",
    "progress.completed": "Complété",
  },
  en: {
    "module.title": "Module title",
    "exercise.question": "Exercise question",
    "progress.completed": "Completed",
  },
};
```

### Hook de Traduction

```javascript
/**
 * Hook pour la gestion des traductions
 * @returns {Object} Fonctions de traduction
 */
const {
  language, // "fr" | "en"
  setLanguage, // (lang: string) => void
  t, // (key: string) => string
} = useLanguage();
```

---

## 🔧 Configuration et Outils

### ESLint Configuration

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "no-unused-vars": "warn",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Variables d'Environnement

Voir `ENVIRONMENT_VARIABLES.md` pour la configuration complète des variables requises et optionnelles.

### Scripts Utiles

```bash
# Développement
npm run dev                 # Serveur de développement
npm run lint               # Vérification ESLint
npm run test               # Tests unitaires
npm run test:coverage      # Tests avec couverture

# Production
npm run build              # Build de production
npm run build:clean        # Build avec nettoyage Windows
npm run deploy             # Déploiement Firebase
```

---

## 📚 Ressources et Documentation

### Liens Utiles

- [Documentation Next.js 15](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)

### Documentation Projet

- [Guide CI/CD Complet](./CI_CD_SETUP_SUMMARY.md)
- [Configuration Secrets GitHub](./GITHUB_SECRETS_SETUP.md)
- [Variables d'Environnement](./ENVIRONMENT_VARIABLES.md)
- [Solution Erreurs Windows](./EPERM_SOLUTION.md)
- [Guide Migration](./MIGRATION-GUIDE.md)

### Onboarding Développeur

1. **Setup** : Cloner le repo et installer les dépendances
2. **Configuration** : Copier `.env.example` vers `.env.local`
3. **Firebase** : Configurer les clés Firebase (voir ENVIRONMENT_VARIABLES.md)
4. **Tests** : Lancer `npm test` pour vérifier l'installation
5. **Développement** : `npm run dev` pour démarrer le serveur local

---

## 🎯 Prochaines Étapes

### Améliorations Techniques

- [ ] Migration complète vers TypeScript
- [ ] Optimisation des performances 3D
- [ ] Cache intelligent pour les modèles
- [ ] PWA avec mode hors-ligne

### Fonctionnalités

- [ ] Système de badges et récompenses
- [ ] Mode collaboratif multi-utilisateurs
- [ ] Intégration réalité virtuelle (VR)
- [ ] Analytics avancées d'apprentissage

Cette documentation est maintenue à jour et reflète l'état actuel du projet AstroLearn.
