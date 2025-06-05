// Configuration WebXR pour AstroLearn
export const WEBXR_CONFIG = {
  // Paramètres de session AR
  sessionOptions: {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay", "light-estimation", "anchors"],
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

// Fonction de diagnostic WebXR améliorée
export async function diagnosticWebXR() {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    webxr: {
      available: false,
      immersiveAR: false,
      features: {},
    },
    permissions: {
      camera: "unknown",
      details: null,
    },
    device: {
      type: "unknown",
      arSupport: "unknown",
    },
    network: {
      protocol: window.location.protocol,
      secure: window.location.protocol === "https:",
    },
  };

  console.log("🔍 DIAGNOSTIC WEBXR COMPLET");
  console.log("=".repeat(50));

  // 1. Vérification WebXR
  try {
    if ("xr" in navigator) {
      diagnostic.webxr.available = true;
      console.log("✅ WebXR API disponible");

      // Tester le support AR immersif
      const arSupported = await navigator.xr.isSessionSupported("immersive-ar");
      diagnostic.webxr.immersiveAR = arSupported;
      console.log(
        `${arSupported ? "✅" : "❌"} Support AR immersif: ${arSupported}`
      );

      // Tester les fonctionnalités optionnelles
      const features = [
        "hit-test",
        "dom-overlay",
        "light-estimation",
        "anchors",
      ];
      for (const feature of features) {
        try {
          const supported = await navigator.xr.isSessionSupported(
            "immersive-ar",
            {
              optionalFeatures: [feature],
            }
          );
          diagnostic.webxr.features[feature] = supported;
          console.log(
            `${supported ? "✅" : "❌"} Feature ${feature}: ${supported}`
          );
        } catch (e) {
          diagnostic.webxr.features[feature] = false;
          console.log(`❌ Feature ${feature}: erreur (${e.message})`);
        }
      }
    } else {
      console.log("❌ WebXR API non disponible");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification WebXR:", error);
    diagnostic.webxr.error = error.message;
  }

  // 2. Vérification des permissions caméra
  try {
    if ("permissions" in navigator) {
      const cameraPermission = await navigator.permissions.query({
        name: "camera",
      });
      diagnostic.permissions.camera = cameraPermission.state;
      diagnostic.permissions.details = cameraPermission;
      console.log(`📹 Permission caméra: ${cameraPermission.state}`);

      cameraPermission.addEventListener("change", () => {
        console.log(`📹 Permission caméra changée: ${cameraPermission.state}`);
      });
    } else {
      console.log("⚠️ API Permissions non disponible");
    }
  } catch (error) {
    console.warn("⚠️ Impossible de vérifier les permissions caméra:", error);
  }

  // 3. Test de la caméra
  try {
    console.log("📹 Test d'accès à la caméra...");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    console.log("✅ Accès caméra réussi:", {
      tracks: stream.getVideoTracks().length,
      settings: stream.getVideoTracks()[0]?.getSettings(),
    });

    // Fermer le stream de test
    stream.getTracks().forEach((track) => track.stop());
    diagnostic.permissions.cameraTest = "success";
  } catch (error) {
    console.error("❌ Test caméra échoué:", error);
    diagnostic.permissions.cameraTest = error.name;
    diagnostic.permissions.cameraError = error.message;
  }

  // 4. Détection du type d'appareil
  const ua = navigator.userAgent.toLowerCase();
  if (/android/i.test(ua)) {
    diagnostic.device.type = "android";
    diagnostic.device.arSupport = "ARCore requis";
    console.log("📱 Appareil Android détecté - ARCore requis");
  } else if (/iphone|ipad/i.test(ua)) {
    diagnostic.device.type = "ios";
    diagnostic.device.arSupport = "ARKit requis";
    console.log("📱 Appareil iOS détecté - ARKit requis");
  } else {
    console.log("💻 Appareil desktop détecté - AR non supporté");
  }

  // 5. Vérification du protocole
  if (!diagnostic.network.secure) {
    console.error("🔒 PROBLÈME: WebXR nécessite HTTPS en production!");
  } else {
    console.log("✅ Connexion sécurisée (HTTPS)");
  }

  // 6. Test du reference space (diagnostic avancé)
  if (diagnostic.webxr.immersiveAR) {
    try {
      console.log("🔍 Test du reference space...");
      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
      });

      try {
        const refSpace = await session.requestReferenceSpace("local-floor");
        diagnostic.webxr.referenceSpace = "local-floor";
        console.log("✅ Reference space 'local-floor' disponible");
      } catch (e) {
        try {
          const refSpace = await session.requestReferenceSpace("local");
          diagnostic.webxr.referenceSpace = "local";
          console.log("✅ Reference space 'local' disponible");
        } catch (e2) {
          diagnostic.webxr.referenceSpace = false;
          console.log("❌ Aucun reference space disponible - CRITIQUE!");
        }
      }

      session.end();
    } catch (error) {
      console.warn(
        "⚠️ Impossible de tester le reference space:",
        error.message
      );
      diagnostic.webxr.referenceSpaceError = error.message;
    }
  }

  // 7. Recommandations
  console.log("\n💡 RECOMMANDATIONS:");
  if (!diagnostic.webxr.available) {
    console.log("❌ Utilisez Chrome/Edge 79+ ou Safari 13+");
  }
  if (!diagnostic.webxr.immersiveAR) {
    console.log("❌ Vérifiez que ARCore/ARKit est installé et activé");
  }
  if (diagnostic.webxr.referenceSpace === false) {
    console.log(
      "❌ CRITIQUE: Reference space non disponible - redémarrez ARCore/ARKit"
    );
  }
  if (diagnostic.permissions.camera === "denied") {
    console.log("❌ Autorisez l'accès à la caméra dans les paramètres");
  }
  if (!diagnostic.network.secure) {
    console.log("❌ Utilisez HTTPS en production");
  }

  console.log("=".repeat(50));
  return diagnostic;
}
