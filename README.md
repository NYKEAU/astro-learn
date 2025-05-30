# 🌌 AstroLearn

Une plateforme d'apprentissage interactive dédiée à l'astronomie, développée avec Next.js et Firebase.

## ✨ Fonctionnalités

- 🔭 **Modules d'apprentissage interactifs** avec contenu multimédia
- 🎮 **Exercices gamifiés** (QCM, textes à trous, interactions 3D)
- 🌟 **Visualisations 3D immersives** des objets astronomiques
- 📱 **Support mobile complet** avec fonctionnalités AR
- 🌍 **Multilingue** (Français/Anglais)
- 👤 **Système de progression personnalisé**
- 🎨 **Interface moderne** avec thème spatial

## 🚀 Technologies

- **Frontend** : Next.js 15.3.1, React 19, Tailwind CSS, Framer Motion
- **3D** : Three.js, React Three Fiber, WebXR
- **Backend** : Firebase (Auth, Firestore, Storage, Hosting)
- **Tests** : Jest, React Testing Library
- **CI/CD** : GitHub Actions

## 📋 Prérequis

- Node.js 18.x ou supérieur
- npm ou yarn
- Compte Firebase

## ⚡ Installation rapide

1. **Cloner le repository**

```bash
git clone https://github.com/NYKEAU/astro-learn.git
cd astro-learn
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configuration Firebase**

   - Créer un projet Firebase
   - Configurer les variables d'environnement (voir `docs/ENVIRONMENT_VARIABLES.md`)

4. **Lancer en développement**

```bash
npm run dev
```

## 📖 Documentation

Toute la documentation technique se trouve dans le dossier `docs/` :

- **[Documentation technique complète](docs/DOCUMENTATION_TECHNIQUE.md)**
- **[Configuration des variables d'environnement](docs/ENVIRONMENT_VARIABLES.md)**
- **[Guide CI/CD](docs/CI_CD_SETUP_SUMMARY.md)**
- **[Système de progression](docs/README_PROGRESSION.md)**

## 🛠️ Scripts disponibles

```bash
# Développement
npm run dev              # Serveur de développement
npm run dev:mobile       # Développement mobile

# Build et déploiement
npm run build            # Build Next.js standard
npm run build:safe       # Build multiplateforme
npm run build:firebase   # Build optimisé Firebase
npm run deploy           # Build + déploiement

# Tests et qualité
npm test                 # Tests unitaires
npm run test:coverage    # Couverture de tests
npm run lint             # Linting ESLint

# Migration des données
npm run migrate          # Migration Firestore
npm run export-firestore # Export des données
```

## 🎯 État du projet

- ✅ **Architecture** : Stable et scalable
- ✅ **Tests** : 21/21 tests passent (100%)
- ✅ **CI/CD** : Pipeline GitHub Actions complet
- ✅ **Build** : Scripts multi-plateformes
- ⚠️ **Warnings** : ESLint à nettoyer (180+)

## 🌐 Déploiement

Le projet est configuré pour un déploiement automatique via GitHub Actions :

- **Production** : Déploiement automatique sur push vers `main`
- **Preview** : Déploiement automatique des PR
- **Support** : Windows, Linux, macOS

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commit (`git commit -m 'Ajout: ma fonctionnalité'`)
4. Push (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

## 📜 Licence

[MIT](https://choosealicense.com/licenses/mit/)

---

**AstroLearn** - Explorez l'univers de manière interactive 🚀
