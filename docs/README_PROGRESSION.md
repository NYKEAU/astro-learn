# 📊 Système de Progression des Exercices - AstroLearn

## 🎯 Vue d'ensemble

Ce document décrit la nouvelle logique de sauvegarde et de récupération de la progression des exercices dans Firestore, implémentée pour AstroLearn.

## 🏗️ Structure de données Firestore

### Collection principale

```
users/{userId}/progress/{moduleId}
```

### Structure du document

```javascript
{
  moduleId: string,                    // ID du module (ex: "1", "2", etc.)
  parts: {                            // Parties du module
    part1: {                          // Partie 1
      ex1: {                          // Exercice 1
        userAnswer: string,           // Réponse de l'utilisateur
        isCorrect: boolean,           // Si la réponse est correcte
        timestamp: string             // Horodatage de la réponse
      },
      ex2: { ... }                    // Exercice 2
    },
    part2: {                          // Partie 2
      ex3: { ... }                    // Exercice 3
    }
  },
  completedExercises: ["ex1", "ex2", "ex3"],  // Liste des exercices complétés
  totalExercises: number,             // Nombre total d'exercices
  score: number,                      // Score (nombre de bonnes réponses)
  percentage: number,                 // Pourcentage de réussite
  completed: boolean,                 // Si le module est complété (≥80%)
  startedAt: timestamp,               // Date de début
  lastUpdated: timestamp,             // Dernière mise à jour
  completedAt: timestamp | null       // Date de completion (null si pas complété)
}
```

## 🔧 Fonctions principales

### `initializeModuleProgress(userId, moduleId)`

- Initialise la progression d'un module pour un utilisateur
- Ne fait rien si la progression existe déjà
- Retourne `true` en cas de succès

### `saveExerciseAnswer(userId, moduleId, partId, exerciseId, userAnswer, isCorrect)`

- Sauvegarde la réponse d'un exercice
- Met à jour automatiquement le score et le pourcentage
- Détecte automatiquement la completion du module (≥80%)
- Gère les modifications de réponses existantes
- Retourne l'objet de progression mis à jour

### `getModuleProgress(userId, moduleId)`

- Récupère la progression complète d'un module
- Retourne `null` si aucune progression n'existe

### `getExerciseAnswer(userId, moduleId, partId, exerciseId)`

- Récupère la réponse d'un exercice spécifique
- Retourne `null` si l'exercice n'a pas été répondu

### `getPartAnswers(userId, moduleId, partId)`

- Récupère toutes les réponses d'une partie
- Retourne `null` si la partie n'existe pas

### `getAllModulesProgress(userId)`

- Récupère la progression de tous les modules d'un utilisateur
- Retourne un objet avec les moduleId comme clés

### `markModuleCompleted(userId, moduleId, finalScore?)`

- Marque manuellement un module comme complété
- Optionnel : définit un score final

## ✅ Avantages de cette structure

### 1. **Granularité fine**

- Chaque exercice est stocké individuellement
- Possibilité de modifier des réponses spécifiques
- Historique complet des réponses

### 2. **Calcul automatique**

- Score et pourcentage mis à jour automatiquement
- Détection automatique de la completion
- Gestion des modifications de réponses

### 3. **Évolutivité**

- Structure facilement extensible
- Compatible avec de nouveaux types d'exercices
- Supporte un nombre illimité de parties et d'exercices

### 4. **Performance**

- Mises à jour atomiques
- Pas d'écrasement de données existantes
- Requêtes optimisées

## 🧪 Tests unitaires

Le système inclut une suite complète de tests unitaires qui vérifient :

- ✅ Initialisation de modules
- ✅ Sauvegarde de réponses correctes/incorrectes
- ✅ Modification de réponses existantes
- ✅ Calcul automatique des scores
- ✅ Détection de completion (≥80%)
- ✅ Récupération de données
- ✅ Validation de structure

### Exécuter les tests

```bash
npm test                    # Tous les tests
npm run test:watch         # Mode watch
npm run test:coverage      # Avec couverture
```

## 🔄 Intégration avec l'univers personnel

La progression est automatiquement synchronisée avec l'univers personnel :

1. **Détection automatique** : Le hook `useModuleCompletion` surveille les changements
2. **Débloquage de modèles** : Les modèles 3D sont débloqués automatiquement
3. **Notifications** : L'utilisateur est notifié des nouveaux débloquages

## 📱 Utilisation dans les composants

### Page d'exercices

```javascript
import { saveExerciseAnswer, getModuleProgress } from "@/lib/firebase/progress";

// Sauvegarder une réponse
const result = await saveExerciseAnswer(
  userId,
  moduleId,
  partId,
  exerciseId,
  userAnswer,
  isCorrect
);

// Charger la progression
const progress = await getModuleProgress(userId, moduleId);
```

### Hook d'univers personnel

```javascript
import { useUnlockedModels } from "@/lib/hooks/useUnlockedModels";

const { unlockedModels, loading } = useUnlockedModels(userId);
```

## 🐛 Debug et test

Une page de debug est disponible à `/debug/progress` pour :

- Tester la logique de progression
- Vérifier la sauvegarde/récupération
- Simuler des scénarios complexes

## 🔮 Évolutions futures

- **Analytics** : Statistiques détaillées de progression
- **Recommandations** : Suggestions basées sur les erreurs
- **Gamification** : Badges et récompenses
- **Synchronisation offline** : Support hors ligne
- **Export de données** : Rapports de progression

## 📚 Compatibilité

Le système est rétrocompatible avec l'ancienne structure de progression grâce aux méthodes de fallback dans `useUnlockedModels` et `useModuleCompletion`.
