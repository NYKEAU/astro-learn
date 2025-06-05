# Guide de Résolution des Problèmes WebXR

## 🔍 Diagnostic des Problèmes Courants

### Symptômes principaux rencontrés :

1. **Pas de demande d'accès à la caméra**
2. **Interface en fullscreen mais écran noir**
3. **Erreurs : "ARCore/ARKit ne démarre pas" et "Aucune frame WebXR après 2s"**

## 🛠️ Corrections Apportées

### 1. **Erreur de structure du code (CRITIQUE)**

**Problème** : Erreur de syntaxe dans le try-catch qui empêchait l'exécution correcte
**Solution** : Correction de la structure try-catch dans `ARSession.js`

### 2. **Approche permissions caméra (MAJEUR)**

**Problème** : Demande manuelle de getUserMedia avant WebXR peut créer des conflits
**Solution** : Laisser WebXR gérer automatiquement les permissions caméra

**Avant :**

```javascript
// Demande manuelle de la caméra avant WebXR
const stream = await navigator.mediaDevices.getUserMedia({...});
const session = await navigator.xr.requestSession('immersive-ar', options);
```

**Après :**

```javascript
// WebXR gère automatiquement les permissions
const session = await navigator.xr.requestSession("immersive-ar", options);
```

### 3. **Configuration de session optimisée**

**Problème** : Configuration trop complexe avec features non essentielles
**Solution** : Configuration minimale et robuste

```javascript
const sessionOptions = {
  requiredFeatures: ["hit-test"],
  optionalFeatures: ["dom-overlay", "light-estimation"], // Suppression de "anchors"
};
```

### 4. **Ordre d'initialisation Three.js (CRITIQUE)**

**Problème** : Session liée au renderer avant activation XR
**Solution** : Ordre correct d'initialisation

```javascript
// CORRECT
this.renderer.xr.enabled = true; // 1. Activer XR
this.renderer.xr.setSession(session); // 2. Lier la session
```

### 5. **Gestion d'erreurs améliorée**

**Problème** : Gestion d'erreurs générique
**Solution** : Gestion spécifique par type d'erreur WebXR

```javascript
if (sessionError.name === "NotSupportedError") {
  throw new Error("❌ Fonctionnalité WebXR non supportée");
} else if (sessionError.name === "SecurityError") {
  throw new Error("❌ Erreur de sécurité - HTTPS requis");
} else if (sessionError.name === "NotAllowedError") {
  throw new Error("❌ Permission caméra refusée");
}
```

### 6. **Monitoring des frames amélioré**

**Problème** : Pas de diagnostic précis des problèmes de frames
**Solution** : Monitoring complet avec métriques

```javascript
// Vérification continue des frames
if (!this._firstFrameLogged) {
  console.log("🎬 PREMIÈRE FRAME WebXR reçue:", {
    sessionVisibility: this.session?.visibilityState,
    referenceSpace: !!this.renderer.xr.getReferenceSpace(),
  });
}
```

### 7. **Style Canvas forcé**

**Problème** : Canvas peut ne pas être visible en fullscreen
**Solution** : Style CSS forcé pour le canvas

```javascript
canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.zIndex = "1000";
```

## 🔧 Outils de Diagnostic Ajoutés

### 1. **Fonction de diagnostic complète** (`diagnosticWebXR`)

- Vérification support WebXR
- Test permissions caméra
- Détection type d'appareil
- Vérification protocole HTTPS

### 2. **Composant de diagnostic UI** (`WebXRDiagnostic`)

- Interface utilisateur pour le diagnostic
- Recommandations personnalisées
- Export du rapport de diagnostic

### 3. **Monitoring en temps réel**

- Compteur de frames WebXR
- Calcul FPS en temps réel
- Alertes en cas de problème

## 📋 Checklist de Diagnostic

### Avant de lancer l'AR :

- [ ] HTTPS activé (obligatoire en production)
- [ ] Navigateur compatible (Chrome 79+, Safari 13+)
- [ ] Appareil mobile avec ARCore/ARKit
- [ ] Permissions caméra disponibles

### Pendant l'exécution :

- [ ] Session WebXR créée avec succès
- [ ] Première frame reçue dans les 2 secondes
- [ ] Canvas visible en fullscreen
- [ ] Hit testing fonctionnel

### En cas de problème :

1. **Ouvrir la console de debug** (F12)
2. **Lancer le diagnostic WebXR** (bouton "Diagnostic")
3. **Vérifier les logs détaillés**
4. **Appliquer les recommandations**

## 🚨 Problèmes Fréquents et Solutions

### "Aucune frame WebXR reçue"

**Causes possibles :**

- ARCore/ARKit non installé ou désactivé
- Permissions caméra refusées
- Session WebXR mal configurée
- Problème de compatibilité navigateur

**Solutions :**

1. Vérifier installation ARCore/ARKit
2. Réautoriser permissions caméra
3. Redémarrer l'application caméra
4. Tester avec diagnostic WebXR

### "Écran noir en AR"

**Causes possibles :**

- Canvas pas affiché correctement
- Problème de style CSS
- Contexte WebGL perdu

**Solutions :**

1. Vérifier styles CSS du canvas
2. Forcer position fixed sur canvas
3. Redémarrer la session AR

### "Permission caméra non demandée"

**Causes possibles :**

- Permissions déjà refusées
- Problème de contexte sécurisé
- Conflit avec getUserMedia manuel

**Solutions :**

1. Réinitialiser permissions dans navigateur
2. Vérifier HTTPS
3. Laisser WebXR gérer les permissions

## 🔬 Logs de Debug à Surveiller

### Séquence normale :

```
🔧 Initialisation ARSession...
✅ WebXR API disponible
✅ AR supportée
🚀 Demande session AR...
✅ Session AR créée
🎨 Configuration Three.js...
🔄 Démarrage de la boucle de rendu...
🎬 PREMIÈRE FRAME WebXR reçue
```

### Séquence problématique :

```
❌ ERREUR demande session AR: NotAllowedError
❌ PROBLÈME: Aucune frame WebXR après 2s!
❌ CRITIQUE: Aucune frame WebXR reçue!
```

## 📱 Test Sur Différents Appareils

### Android (ARCore)

- Chrome 79+ requis
- Android 7.0+ requis
- ARCore installé et activé

### iOS (ARKit)

- Safari 13+ ou Chrome 79+
- iOS 12+ requis
- ARKit supporté (iPhone 6s+)

## 🔄 Procédure de Test

1. **Ouvrir la page AR**
2. **Cliquer sur "Diagnostic"** pour vérifier la compatibilité
3. **Corriger les problèmes identifiés**
4. **Lancer l'AR** avec le bouton principal
5. **Surveiller les logs** en cas de problème
6. **Utiliser le diagnostic** pour identifier la cause

## 📞 Support et Debug

En cas de problème persistant :

1. Copier le rapport de diagnostic complet
2. Noter la version du navigateur et de l'OS
3. Décrire la séquence exacte du problème
4. Fournir les logs de la console
