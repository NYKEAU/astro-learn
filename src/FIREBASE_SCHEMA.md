# Structure de la base de données Firebase pour AstroLearn

## Collection `modules`

Chaque module contient les champs suivants:

```javascript
{
  id: "module-id", // Identifiant unique du module (utilisé dans les URLs)
  title: "Titre du module en français",
  titleEn: "Module title in English",
  description: "Description complète du module en français",
  descriptionEn: "Complete module description in English",
  shortDesc: "Description courte et simple pour présenter le module rapidement",
  imageUrl: "/images/path-to-image.jpg", // URL de l'image du module
  bgColor: "from-blue-600 to-purple-800", // Dégradé de couleur pour le fond (Tailwind CSS)
  level: "Débutant", // Niveau en français
  levelEn: "Beginner", // Niveau en anglais
  tags: ["espace", "planètes", "système solaire"], // Tags pour catégoriser le module
  order: 1, // Ordre d'affichage dans la liste des modules

  // Contenu du module (liste des leçons)
  content: [
    {
      id: "lesson-1",
      title: "Titre de la leçon en français",
      titleEn: "Lesson title in English",
      duration: "10 min", // Durée estimée
      order: 1 // Ordre d'affichage dans le module
    },
    // Autres leçons...
  ]
}
```

## Collection `lessons`

Chaque leçon contient les champs suivants:

```javascript
{
  id: "lesson-id", // Identifiant unique de la leçon
  moduleId: "module-id", // Référence au module parent
  title: "Titre de la leçon en français",
  titleEn: "Lesson title in English",
  content: "Contenu de la leçon (peut inclure du HTML/markdown)",
  contentEn: "Lesson content in English",
  duration: "10 min", // Durée estimée
  order: 1, // Ordre d'affichage dans le module

  // Médias associés à la leçon
  media: {
    image: "/images/lesson-image.jpg", // Image principale
    video: "https://youtube.com/...", // Vidéo explicative (optionnel)
    model3d: "https://example.com/model.gltf" // Modèle 3D (optionnel)
  },

  // Quiz et exercices interactifs
  exercises: [
    {
      id: "exercise-1",
      type: "mcq", // Type: mcq (QCM), fill-blank (texte à remplir), fill-blank-choice (texte à trous avec propositions)
      question: "Question ou énoncé en français?",
      questionEn: "Question or statement in English?",
      content: "1. Première option\n2. Deuxième option\n3. Troisième option", // Pour QCM
      contentEn: "1. First option\n2. Second option\n3. Third option", // Pour QCM en anglais
      answer: [1], // Indices des bonnes réponses pour QCM (tableau car plusieurs réponses possibles)
      isSingleChoice: true, // QCU (une seule réponse) ou QCM (plusieurs réponses)
      explanation: "Explication de la réponse correcte",
      explanationEn: "Explanation of the correct answer"
    },
    {
      id: "exercise-2",
      type: "fill-blank", // Texte à trous (saisie libre)
      question: "Complétez la phrase suivante:",
      questionEn: "Complete the following sentence:",
      content: "Phrase avec un mot à compléter [mot_correct] suite de la phrase.", // Le mot entre [] est la réponse attendue
      contentEn: "Sentence with a word to complete [correct_word] rest of the sentence.",
      answer: ["mot_correct"], // Réponses acceptées (peut inclure des synonymes)
      caseSensitive: false, // Si la casse est importante
      explanation: "Explication de la réponse correcte",
      explanationEn: "Explanation of the correct answer"
    },
    {
      id: "exercise-3",
      type: "fill-blank-choice", // Texte à trous avec propositions
      question: "Choisissez le mot correct pour compléter la phrase:",
      questionEn: "Choose the correct word to complete the sentence:",
      content: "Phrase avec un mot à compléter [] suite de la phrase.", // Les [] vides indiquent l'emplacement du trou
      contentEn: "Sentence with a word to complete [] rest of the sentence.",
      options: ["proposition1", "proposition2", "proposition3"], // Propositions parmi lesquelles choisir
      optionsEn: ["option1", "option2", "option3"], // Propositions en anglais
      answer: 0, // Indice de la bonne réponse dans le tableau options
      explanation: "Explication de la réponse correcte",
      explanationEn: "Explanation of the correct answer"
    }
  ]
}
```

## Collection `users`

Informations utilisateur, incluant les données de progression:

```javascript
{
  uid: "user-id", // UID Firebase Auth
  displayName: "Nom d'utilisateur",
  email: "email@example.com",
  photoURL: "https://...", // Avatar (optionnel)
  createdAt: Timestamp, // Date de création du compte

  // Préférences utilisateur
  preferences: {
    language: "fr", // Langue préférée (fr/en)
    theme: "dark", // Thème préféré
    notifications: true // Activation des notifications
  },

  // Progression dans les modules
  progress: {
    "module-id": 30, // Pourcentage (0-100) de complétion du module
    // Autres modules...
  },

  // Progression détaillée par leçon et exercice
  lessonProgress: {
    "lesson-id": {
      completed: true,
      completedAt: Timestamp,
      timeSpent: 300, // Temps passé en secondes
      exercises: {
        "exercise-id": {
          completed: true,
          score: 100, // Pourcentage de réussite (0-100)
          attempts: 1, // Nombre de tentatives
          lastAttemptAt: Timestamp
        }
        // Autres exercices...
      }
    }
    // Autres leçons...
  }
}
```

## Système de détection automatique des types d'exercices

Le système peut également détecter automatiquement le type d'exercice à partir du texte formaté:

1. **QCM/QCU**: Détecté par la présence de numéros (1., 2., 3., etc.) au début des options

   ```
   Question ou énoncé ?
   1. Première option
   2. Deuxième option
   3. Troisième option
   ```

2. **Texte à remplir (saisie libre)**: Détecté par la présence de crochets [] contenant la réponse

   ```
   Phrase avec un mot à compléter [mot_correct] suite de la phrase.
   ```

3. **Texte à trous avec propositions**: Détecté par la présence de crochets vides [] et de chevrons <> contenant les propositions
   ```
   Phrase avec un mot à compléter [] suite de la phrase. <proposition1> <proposition2> <proposition3>
   ```

Cette détection automatique permet de créer des exercices rapidement sans avoir à spécifier manuellement le type, mais la structure des données reste la même que celle définie ci-dessus.

## Relations entre les données

- Un **module** contient plusieurs **leçons** (relation parent-enfant)
- Une **leçon** contient plusieurs **exercices** (relation parent-enfant)
- Un **utilisateur** suit plusieurs **modules** et progresse dans plusieurs **leçons** et **exercices**

## Règles de sécurité

- Tous les utilisateurs peuvent lire les modules et leçons
- Seuls les utilisateurs authentifiés peuvent mettre à jour leur progression
- Seuls les administrateurs peuvent créer/modifier/supprimer des modules et leçons
