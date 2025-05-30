# Guide de Migration Firestore - AstroLearn

## 🎯 Objectif de la Migration

Cette migration restructure la base de données Firestore pour :

- **Simplifier** : Passer de 4 à 2 collections principales
- **Clarifier** : Structure hiérarchique modules > parts > lessons/exercises
- **Optimiser** : Suivi de progression détaillé avec sous-collections

## 📊 Avant/Après

### Structure AVANT

```
📁 modules (4 docs)
📁 profilesInfos (3 docs)
📁 users (3 docs)
📁 usersModules (3 docs)
```

### Structure APRÈS

```
📁 modules (4 docs)
   └── Structure hiérarchique avec parts/lessons/exercises
📁 users (3 docs)
   ├── Profil utilisateur intégré
   └── 📁 progress (sous-collection)
       └── Documents par module suivi
```

## 🚀 Commandes de Migration

### 1. Test en mode simulation (RECOMMANDÉ)

```bash
npm run migrate:dry-run
```

Simule la migration sans modifier la base de données.

### 2. Migration complète

```bash
npm run migrate
```

Exécute la migration complète avec backup automatique.

### 3. Migration par étapes

```bash
# Migrer seulement les modules
npm run migrate:modules

# Migrer seulement les utilisateurs
npm run migrate:users

# Migrer seulement la progression
npm run migrate:progress

# Nettoyer les anciennes collections
npm run migrate:cleanup
```

### 4. Mode verbose (debug)

```bash
npm run migrate:verbose
```

Affiche tous les détails de la migration.

## 📋 Étapes de la Migration

### Étape 1 : Backup Automatique

- Sauvegarde complète dans `migration-backups/`
- Format JSON avec timestamp
- Toutes les collections exportées

### Étape 2 : Migration des Modules

**Transformation :**

```javascript
// AVANT
{
  "title": "La Terre",
  "description": "...",
  "easyDesc": "...",
  "interDesc": "...",
  "hardDesc": "..."
}

// APRÈS
{
  "title": "La Terre",
  "description": "...",
  "parts": [
    {
      "id": "1",
      "title": "Introduction",
      "lessons": [
        {
          "id": "1",
          "title": "Leçon principale",
          "content": {
            "easy": "...",
            "intermediate": "...",
            "advanced": "..."
          }
        }
      ],
      "exercises": [...]
    }
  ]
}
```

### Étape 3 : Migration des Utilisateurs

**Fusion des données :**

- `users` + `profilesInfos` → `users` unifié
- Conservation des champs IA critiques
- Ajout de statistiques de base

### Étape 4 : Migration de la Progression

**Transformation :**

```javascript
// AVANT (usersModules)
{
  "1": ["3", "50"],  // ou {"difficulty": "3", "progress": "0"}
  "2": ["1", "25"]
}

// APRÈS (users/{id}/progress/{moduleId})
{
  "moduleId": "1",
  "finished": false,
  "globalScore": 50,
  "currentPosition": {
    "partId": "1",
    "lessonId": "1"
  },
  "parts": [
    {
      "id": "1",
      "finished": false,
      "lessons": [{"id": "1", "done": false}],
      "exercises": [{"id": "1", "done": false, "score": 0}]
    }
  ]
}
```

### Étape 5 : Nettoyage

- Suppression de `profilesInfos`
- Suppression de `usersModules`

### Étape 6 : Validation

- Vérification de la structure des modules
- Comptage des documents de progression
- Validation de l'intégrité

## ⚠️ Précautions

### Avant la Migration

1. **Backup manuel** (optionnel, backup auto inclus)
2. **Test en dry-run** obligatoire
3. **Arrêt de l'application** pendant la migration

### Champs IA Préservés

Ces champs sont critiques pour l'IA et sont préservés exactement :

- `learningPreference` (pas `learningStyle`)
- `interests` (format array)
- `knownSubjects` (format array)
- `learningGoals` (format array)
- `usedApps` (boolean)
- `educationLevel`, `knowledgeLevel`, `age`

## 🔧 Dépannage

### Erreur de migration

```bash
# Vérifier les logs détaillés
npm run migrate:verbose

# Migrer étape par étape
npm run migrate:modules
npm run migrate:users
# etc.
```

### Restauration manuelle

Si problème, utilisez le backup dans `migration-backups/` :

```javascript
// Script de restauration à créer si nécessaire
const backup = require("./migration-backups/backup-TIMESTAMP.json");
// Restaurer manuellement via Firebase Console
```

## 📈 Après la Migration

### Vérifications

1. **Interface utilisateur** : Tester les pages profil/progression
2. **IA** : Vérifier que l'IA fonctionne avec les nouveaux champs
3. **Performance** : Vérifier les requêtes Firestore

### Nouveaux Patterns de Code

```javascript
// Récupérer la progression d'un utilisateur
const progressRef = db
  .collection("users")
  .doc(userId)
  .collection("progress")
  .doc(moduleId);

// Récupérer un module avec sa structure
const moduleRef = db.collection("modules").doc(moduleId);
const module = await moduleRef.get();
const parts = module.data().parts;
```

## 🎉 Avantages Post-Migration

- ✅ **2 collections** au lieu de 4
- ✅ **Structure claire** et hiérarchique
- ✅ **Progression détaillée** par leçon/exercice
- ✅ **Performance optimisée** avec sous-collections
- ✅ **Maintenance simplifiée**
- ✅ **Compatibilité IA** préservée

---

**⚠️ IMPORTANT :** Toujours tester en `dry-run` avant la migration réelle !
