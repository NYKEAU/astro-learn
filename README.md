# AstroLearn

Une plateforme d'apprentissage interactive dédiée à l'astronomie, développée avec Next.js et Firebase.

## Configuration requise

- Node.js 16.x ou supérieur
- npm ou yarn
- Un compte Firebase

## Installation

1. Clonez le repository :

```bash
git clone https://github.com/NYKEAU/astro-learn.git
cd astro-learn
```

2. Installez les dépendances :

```bash
npm install
# ou
yarn install
```

3. Configurez les variables d'environnement :

   - Copiez le fichier `.env.example` vers `.env.local`
   - Remplissez les variables avec vos informations Firebase

4. Lancez le serveur de développement :

```bash
npm run dev
# ou
yarn dev
```

## Structure du projet

- `/app` - Routes et pages Next.js
- `/components` - Composants React réutilisables
- `/lib` - Utilitaires et configuration
- `/public` - Assets statiques

## Fonctionnalités

- Authentification utilisateur
- Modules d'apprentissage interactifs
- Exercices avec QCM et questions à trous
- Suivi de la progression
- Support multilingue (FR/EN)

## Sécurité

- Les clés d'API et autres informations sensibles doivent être stockées dans les variables d'environnement
- Ne jamais commiter de fichiers de configuration Firebase contenant des clés
- Utilisez `.env.local` pour les variables d'environnement locales

## Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Push vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## Licence

[MIT](https://choosealicense.com/licenses/mit/)
