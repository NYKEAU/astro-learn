# Guide de migration de la base de données Firebase

Ce document explique comment migrer la structure de votre base de données Firebase d'une structure plate vers une structure imbriquée plus organisée.

## Nouvelle structure

```
modules/
  ├── moduleId/
  │     ├── title, titleEn, description, image, etc... (infos générales)
  │     ├── parts/
  │     │     ├── part1/
  │     │     │     ├── title: "Titre de la partie 1"
  │     │     │     ├── order: 1
  │     │     │     ├── lessons/
  │     │     │     │     ├── lesson1: { title, content, order: 1 }
  │     │     │     │     └── lesson2: { title, content, order: 2 }
  │     │     │     └── exercises/
  │     │     │           ├── ex1: { title, content, type: "qcm", order: 1 }
  │     │     │           └── ex2: { title, content, type: "fill", order: 2 }
  │     │     └── part2/
  │     │           └── ...
  │     └── ...
  └── ...
```

## Étapes à suivre

### 1. Préparation

1. Téléchargez une clé de service Firebase:

   - Accédez à la console Firebase
   - Projet > Paramètres > Comptes de service
   - Cliquez sur "Générer une nouvelle clé privée"
   - Enregistrez le fichier sous le nom `serviceAccountKey.json` à la racine du projet

2. Créez une sauvegarde de votre base de données actuelle:
   - Dans la console Firebase, allez dans "Firestore Database"
   - Cliquez sur "Exporter les données" dans le menu

### 2. Exécuter le script de migration

1. Installez les dépendances nécessaires:

   ```
   npm install firebase-admin
   ```

2. Exécutez le script de migration:

   ```
   node migrate-firestore.js
   ```

3. Le script fera:
   - Lire tous vos modules existants
   - Extraire les titres des parties et les questions
   - Créer la nouvelle structure avec des sous-collections
   - Organiser les questions en tant qu'exercices
   - Créer une leçon de base pour chaque partie

### 3. Vérification

Après la migration, vérifiez dans la console Firebase que:

- La structure des données correspond à celle décrite ci-dessus
- Les modules contiennent bien leurs informations de base
- Chaque partie contient une collection `lessons` et une collection `exercises`
- Les exercices ont été correctement catégorisés par type

### 4. Mise à jour de l'application

Une fois la migration terminée, vous devez mettre à jour votre application pour utiliser la nouvelle structure de données. Voir les nouveaux fichiers:

- `src/app/modules/[moduleId]/lessons/page.jsx` pour le contenu théorique
- `src/app/modules/[moduleId]/exercises/page.jsx` pour les exercices

## Notes importantes

- Ne supprimez pas l'ancienne structure tant que vous n'avez pas vérifié que tout fonctionne correctement
- Testez d'abord sur un environnement de développement avant de déployer en production
- Mettez à jour vos règles de sécurité Firestore pour refléter la nouvelle structure

## Résolution des problèmes

Si vous rencontrez des erreurs lors de la migration:

1. Vérifiez que le fichier `serviceAccountKey.json` est correctement placé
2. Assurez-vous que les permissions de votre compte de service sont correctes
3. Examinez les messages d'erreur pour identifier le problème spécifique
