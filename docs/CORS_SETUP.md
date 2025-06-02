# 🔧 Configuration CORS Firebase Storage

## Problème actuel

L'application déployée rencontre des erreurs CORS lors de l'accès à Firebase Storage pour charger `universe.json`.

## Solutions

### 1. Configuration CORS via Console Firebase (RECOMMANDÉ)

1. **Allez dans la [Console Firebase](https://console.firebase.google.com/)**
2. **Sélectionnez votre projet** : `space-learn-a2406`
3. **Naviguez vers Storage**
4. **Cliquez sur "Rules"**
5. **Ajoutez cette configuration CORS** :

```json
[
  {
    "origin": [
      "https://astrolearn.nicolaslhommeau.com",
      "http://localhost:3000"
    ],
    "method": ["GET", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"]
  }
]
```

### 2. Configuration via Google Cloud Console

1. **Allez dans [Google Cloud Console](https://console.cloud.google.com/)**
2. **Sélectionnez le projet** : `space-learn-a2406`
3. **Naviguez vers Cloud Storage**
4. **Trouvez le bucket** : `space-learn-a2406.appspot.com`
5. **Cliquez sur "Permissions"**
6. **Ajoutez les domaines autorisés**

### 3. Configuration domaine Firebase Hosting

1. **Console Firebase > Hosting**
2. **Cliquez sur "Add custom domain"**
3. **Ajoutez** : `astrolearn.nicolaslhommeau.com`
4. **Suivez les instructions DNS**

### 4. Mise à jour des règles Storage

Les règles actuelles dans `storage.rules` sont correctes :

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Modèles 3D publics
    match /models/{modelId} {
      allow read: if true;
    }

    // Univers personnels
    match /users/{userId}/universe.json {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 5. Test après configuration

Après avoir appliqué CORS, testez :

```bash
curl -H "Origin: https://astrolearn.nicolaslhommeau.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://firebasestorage.googleapis.com/v0/b/space-learn-a2406.appspot.com/o/users%2F8oEIQ9pFQNbmP031RLlZcX9xuXs2%2Funiverse.json?alt=media
```

## Vérification

Une fois configuré, les erreurs CORS devraient disparaître et l'univers se charger correctement.
