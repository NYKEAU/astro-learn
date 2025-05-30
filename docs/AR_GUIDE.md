# Guide de la Réalité Augmentée - AstroLearn

## 🥽 Qu'est-ce que la Réalité Augmentée ?

La réalité augmentée (AR) permet de superposer des objets 3D virtuels dans le monde réel via la caméra de votre appareil. Dans AstroLearn, vous pouvez placer et explorer des modèles 3D d'objets astronomiques directement dans votre environnement.

## 📱 Appareils Compatibles

### Android
- **Navigateur** : Chrome 79+ ou Edge 79+
- **Système** : Android 7.0+ avec ARCore
- **Appareils supportés** : [Liste officielle ARCore](https://developers.google.com/ar/devices)

### iOS
- **Navigateur** : Safari 13+ ou Chrome 79+
- **Système** : iOS 12+ avec ARKit
- **Appareils supportés** : iPhone 6s+ et iPad (5ème génération)+

## 🚀 Comment utiliser l'AR

### 1. Accès à la fonctionnalité
- Ouvrez une leçon contenant un modèle 3D
- Sur mobile, le bouton **"Voir en AR"** apparaît automatiquement
- Sur desktop, utilisez le QR code pour accéder depuis votre mobile

### 2. Démarrage de la session AR
1. Tapez sur le bouton **"Voir en AR"**
2. Autorisez l'accès à la caméra si demandé
3. Attendez que l'application détecte les surfaces

### 3. Placement du modèle
1. **Pointez votre caméra** vers une surface plane (table, sol, etc.)
2. Un **cercle vert** apparaît quand une surface est détectée
3. **Tapez sur l'écran** pour placer le modèle à cet endroit
4. Le modèle apparaît et commence à tourner automatiquement

### 4. Exploration
- **Déplacez-vous** autour du modèle pour l'observer sous tous les angles
- **Rapprochez-vous** ou **éloignez-vous** pour changer la perspective
- Le modèle reste ancré à sa position dans l'espace réel

### 5. Contrôles disponibles
- **Bouton rouge** (bas gauche) : Fermer la session AR
- **Bouton bleu** (bas droite) : Afficher/masquer les instructions

## 🛠️ Résolution de problèmes

### Le bouton AR n'apparaît pas
- Vérifiez que votre appareil supporte WebXR
- Utilisez un navigateur compatible (Chrome/Safari)
- Assurez-vous d'être sur mobile ou d'utiliser le QR code

### La caméra ne s'active pas
- Autorisez l'accès à la caméra dans les paramètres du navigateur
- Rechargez la page et réessayez
- Vérifiez que la caméra n'est pas utilisée par une autre application

### Le cercle vert n'apparaît pas
- Pointez vers une surface plane et bien éclairée
- Évitez les surfaces réfléchissantes ou transparentes
- Bougez lentement l'appareil pour aider la détection

### Le modèle ne se place pas
- Assurez-vous que le cercle vert est visible
- Tapez fermement sur l'écran
- Réessayez sur une surface différente

### Performance lente
- Fermez les autres applications en arrière-plan
- Utilisez un appareil plus récent si possible
- Vérifiez votre connexion internet pour le chargement du modèle

## 🔧 Spécifications techniques

### WebXR
- **API utilisée** : WebXR Device API
- **Fonctionnalités** : Hit testing, anchors, light estimation
- **Rendu** : Three.js avec WebGL

### Modèles 3D
- **Format** : GLTF/GLB
- **Taille** : Optimisée pour mobile (< 5MB)
- **Échelle** : Automatiquement ajustée à 30cm par défaut

### Performances
- **FPS cible** : 30-60 FPS
- **Résolution** : Adaptée à l'écran de l'appareil
- **Mémoire** : Optimisée pour les appareils mobiles

## 🌟 Conseils pour une meilleure expérience

### Environnement optimal
- **Éclairage** : Lumière naturelle ou éclairage uniforme
- **Surfaces** : Tables, sols, surfaces mates et planes
- **Espace** : Au moins 1m² d'espace libre autour de vous

### Utilisation
- **Mouvements** : Lents et fluides pour éviter la perte de tracking
- **Distance** : Restez entre 0.5m et 3m du modèle
- **Stabilité** : Tenez fermement votre appareil

### Sécurité
- **Attention** : Regardez où vous marchez
- **Obstacles** : Dégagez l'espace autour de vous
- **Pause** : Prenez des pauses régulières

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez ce guide
2. Vérifiez la compatibilité de votre appareil
3. Contactez le support technique d'AstroLearn

---

*La réalité augmentée transforme l'apprentissage de l'astronomie en une expérience immersive et interactive. Explorez l'univers comme jamais auparavant !* 🌌 