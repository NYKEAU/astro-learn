// Configuration WebXR pour AstroLearn
export const WEBXR_CONFIG = {
  // Paramètres de session AR
  sessionOptions: {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay", "light-estimation", "anchors"],
    domOverlay: {
      root: document.body,
    },
  },

  // Paramètres de rendu
  renderer: {
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: true,
  },

  // Paramètres de caméra
  camera: {
    fov: 70,
    near: 0.01,
    far: 20,
  },

  // Paramètres de modèle 3D
  model: {
    defaultScale: 0.3, // 30cm par défaut
    minScale: 0.1, // 10cm minimum
    maxScale: 1.0, // 1m maximum
    rotationSpeed: 0.01,
  },

  // Paramètres de réticule
  reticle: {
    innerRadius: 0.15,
    outerRadius: 0.2,
    segments: 32,
    color: 0x00ff00,
    opacity: 0.7,
  },

  // Paramètres d'éclairage
  lighting: {
    hemisphere: {
      skyColor: 0xffffff,
      groundColor: 0xbbbbff,
      intensity: 1,
    },
    directional: {
      color: 0xffffff,
      intensity: 0.8,
      position: [0.5, 1, 0.25],
    },
  },

  // Messages d'erreur
  errors: {
    fr: {
      webxrNotSupported: "WebXR n'est pas supporté sur ce navigateur",
      arNotSupported:
        "La réalité augmentée n'est pas supportée sur cet appareil",
      sessionFailed: "Impossible de démarrer la session AR",
      modelLoadFailed: "Erreur lors du chargement du modèle 3D",
      hitTestFailed: "Détection de surface non disponible",
    },
    en: {
      webxrNotSupported: "WebXR is not supported on this browser",
      arNotSupported: "Augmented reality is not supported on this device",
      sessionFailed: "Unable to start AR session",
      modelLoadFailed: "Error loading 3D model",
      hitTestFailed: "Surface detection not available",
    },
  },

  // Instructions utilisateur
  instructions: {
    fr: {
      scanning: "Recherche de surface...",
      tapToPlace:
        "Pointez votre caméra vers une surface plane et tapez pour placer le modèle",
      modelPlaced: "Modèle placé ! Vous pouvez maintenant l'explorer",
      moveDevice: "Déplacez votre appareil pour explorer le modèle",
    },
    en: {
      scanning: "Looking for surface...",
      tapToPlace:
        "Point your camera at a flat surface and tap to place the model",
      modelPlaced: "Model placed! You can now explore it",
      moveDevice: "Move your device to explore the model",
    },
  },
};

// Fonction utilitaire pour obtenir un message d'erreur
export function getErrorMessage(errorKey, language = "fr") {
  return (
    WEBXR_CONFIG.errors[language]?.[errorKey] ||
    WEBXR_CONFIG.errors.fr[errorKey] ||
    "Erreur inconnue"
  );
}

// Fonction utilitaire pour obtenir une instruction
export function getInstruction(instructionKey, language = "fr") {
  return (
    WEBXR_CONFIG.instructions[language]?.[instructionKey] ||
    WEBXR_CONFIG.instructions.fr[instructionKey] ||
    "Instruction non disponible"
  );
}
