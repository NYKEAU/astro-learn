import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { WEBXR_CONFIG, getErrorMessage } from "./config.js";

export class ARSession {
  constructor() {
    this.session = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.reticle = null;
    this.model = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.isPlaced = false;
    this.language = "fr";
  }

  async init(modelURL, language = "fr") {
    this.language = language;
    console.log("🔧 Initialisation ARSession...");
    console.log("📄 ModelURL:", modelURL);

    try {
      // Vérifier le support WebXR
      console.log("🔍 Vérification support WebXR...");
      if (!navigator.xr) {
        console.log("❌ navigator.xr non disponible");
        throw new Error(getErrorMessage("webxrNotSupported", language));
      }
      console.log("✅ navigator.xr disponible");

      // Vérifier le support AR
      console.log("🔍 Vérification support AR...");
      const isSupported = await navigator.xr.isSessionSupported("immersive-ar");
      console.log("📊 Support AR:", isSupported);
      if (!isSupported) {
        console.log("❌ AR non supportée");
        throw new Error(getErrorMessage("arNotSupported", language));
      }
      console.log("✅ AR supportée");

      // NOUVELLE APPROCHE: Demander directement la session WebXR avec permissions
      console.log(
        "🚀 Demande session AR avec gestion automatique des permissions..."
      );

      // Configuration de session optimisée
      let sessionOptions = {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay", "light-estimation"],
      };

      // Créer un div dédié pour domOverlay si nécessaire
      if (sessionOptions.optionalFeatures.includes("dom-overlay")) {
        const overlayRoot = document.createElement("div");
        overlayRoot.id = "ar-overlay-root";
        overlayRoot.style.cssText =
          "position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;";
        document.body.appendChild(overlayRoot);
        sessionOptions.domOverlay = { root: overlayRoot };
        console.log("🎭 DOM Overlay configuré");
      }

      console.log("🔑 Options de session:", sessionOptions);

      try {
        // NOUVELLE APPROCHE: Demander explicitement la permission caméra AVANT WebXR
        console.log("📹 Test et demande permission caméra...");
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          console.log("✅ Permission caméra accordée");
          testStream.getTracks().forEach((track) => track.stop()); // Fermer immédiatement
        } catch (permError) {
          console.error("❌ Permission caméra refusée:", permError.name);
          if (permError.name === "NotAllowedError") {
            throw new Error(
              "❌ Veuillez autoriser l'accès à la caméra pour utiliser l'AR"
            );
          }
          throw permError;
        }

        // Demander la session WebXR (maintenant que la permission caméra est accordée)
        this.session = await navigator.xr.requestSession(
          "immersive-ar",
          sessionOptions
        );
        console.log("✅ Session AR créée:", this.session);

        // Vérifications post-session
        console.log("📱 État session AR:", {
          renderState: this.session.renderState,
          inputSources: this.session.inputSources?.length || 0,
          environmentBlendMode: this.session.environmentBlendMode,
          visibilityState: this.session.visibilityState,
        });
      } catch (sessionError) {
        console.error("❌ ERREUR demande session AR:", sessionError);
        console.error("🔍 Type erreur session:", sessionError.name);
        console.error("🔍 Message erreur session:", sessionError.message);

        // Gestion spécifique des erreurs WebXR
        if (sessionError.name === "NotSupportedError") {
          throw new Error(
            "❌ Fonctionnalité WebXR non supportée sur cet appareil"
          );
        } else if (sessionError.name === "SecurityError") {
          throw new Error(
            "❌ Erreur de sécurité - Assurez-vous d'être en HTTPS"
          );
        } else if (sessionError.name === "NotAllowedError") {
          throw new Error(
            "❌ Permission caméra refusée - Rechargez et autorisez l'accès"
          );
        } else if (sessionError.name === "InvalidStateError") {
          throw new Error(
            "❌ État invalide - Une session AR est peut-être déjà active"
          );
        }
        throw sessionError;
      }

      // Configurer Three.js APRÈS avoir obtenu la session
      await this.setupThreeJS();

      // Charger le modèle 3D
      await this.loadModel(modelURL);

      // Configurer les événements
      this.setupEventListeners();

      // Démarrer la boucle de rendu avec monitoring amélioré
      console.log("🔄 Démarrage de la boucle de rendu...");
      this._frameCount = 0;
      this._lastFrameTime = performance.now();
      this.renderer.setAnimationLoop(this.render.bind(this));

      // Monitoring des frames WebXR
      this.startFrameMonitoring();

      // Vérifier le canvas après initialisation
      this.checkCanvasStatus();

      console.log("🥽 Session AR initialisée avec succès");
      return this.session;
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation AR:", error);
      console.error("🔍 Type erreur:", typeof error);
      console.error("🔍 Nom erreur:", error.name);
      console.error("🔍 Message erreur:", error.message);
      console.error("🔍 Stack erreur:", error.stack);

      // Nettoyer en cas d'erreur
      this.cleanup();
      throw error;
    }
  }

  startFrameMonitoring() {
    // Monitoring initial après 2 secondes
    setTimeout(() => {
      console.log("🔍 État frames WebXR après 2s:", {
        frameCount: this._frameCount,
        sessionActive: !!this.session,
        sessionVisibility: this.session?.visibilityState,
        rendererXREnabled: this.renderer?.xr?.enabled,
        sessionMode: this.session?.environmentBlendMode,
        fps: this._frameCount > 0 ? Math.round(this._frameCount / 2) : 0,
      });

      if (this._frameCount === 0) {
        console.error("❌ PROBLÈME: Aucune frame WebXR après 2s!");
        console.error("💡 Diagnostics suggérés:");
        console.error("   - Vérifiez que ARCore/ARKit est installé et activé");
        console.error("   - Assurez-vous d'être en HTTPS");
        console.error("   - Redémarrez l'application caméra et réessayez");
        console.error(
          "   - Vérifiez les permissions caméra dans les paramètres"
        );
      }
    }, 2000);

    // Monitoring continu toutes les 10 secondes
    this._monitoringInterval = setInterval(() => {
      if (this.session && this._frameCount > 0) {
        const now = performance.now();
        const timeDelta = (now - this._lastFrameTime) / 1000;
        const currentFPS = this._frameCount / timeDelta;

        console.log("📊 Stats AR:", {
          frames: this._frameCount,
          fps: Math.round(currentFPS),
          sessionState: this.session.visibilityState,
          modelPlaced: this.isPlaced,
        });
      }
    }, 10000);
  }

  checkCanvasStatus() {
    setTimeout(() => {
      const canvas = this.renderer?.domElement;
      if (canvas) {
        console.log("🖥️ État du canvas:", {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight,
          style: canvas.style.cssText,
          parentNode: canvas.parentNode ? "attaché" : "non attaché",
          visibility: getComputedStyle(canvas).visibility,
          display: getComputedStyle(canvas).display,
          position: getComputedStyle(canvas).position,
        });

        // Forcer le canvas en plein écran si nécessaire
        if (canvas.style.position !== "fixed") {
          canvas.style.position = "fixed";
          canvas.style.top = "0";
          canvas.style.left = "0";
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvas.style.zIndex = "1000";
          console.log("📱 Canvas forcé en plein écran");
        }
      }
    }, 500);
  }

  async setupThreeJS() {
    console.log("🎨 Configuration Three.js pour WebXR...");

    // Créer le renderer WebXR AVANT de configurer la session
    console.log("🖥️ Création du renderer WebGL...");
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    console.log("✅ Renderer créé");

    // Configuration du renderer
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limiter pour les performances
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    console.log(
      "📐 Taille renderer:",
      window.innerWidth,
      "x",
      window.innerHeight
    );

    // IMPORTANT: Activer XR AVANT de lier la session
    this.renderer.xr.enabled = true;
    console.log("🥽 XR activé sur le renderer");

    // CORRECTION: Lier la session APRÈS avoir activé XR
    if (this.session) {
      await this.renderer.xr.setSession(this.session);
      console.log("🔗 Session XR liée au renderer");

      // CRITIQUE: S'assurer que le reference space est configuré
      // Tenter différents types de reference space par ordre de préférence
      const referenceSpaceTypes = [
        "local-floor",
        "local",
        "viewer",
        "bounded-floor",
      ];
      let referenceSpace = null;
      let usedType = null;

      for (const spaceType of referenceSpaceTypes) {
        try {
          console.log(`🔍 Test reference space '${spaceType}'...`);
          referenceSpace = await this.session.requestReferenceSpace(spaceType);
          usedType = spaceType;
          console.log(`✅ Reference space '${spaceType}' configuré`);
          break;
        } catch (error) {
          console.warn(`⚠️ '${spaceType}' non disponible:`, error.message);
        }
      }

      if (referenceSpace) {
        this.renderer.xr.setReferenceSpace(referenceSpace);
        console.log(`🎯 Reference space final: '${usedType}'`);
      } else {
        console.error("❌ AUCUN reference space disponible sur cet appareil");
        // Ne pas bloquer - laisser WebXR utiliser ses valeurs par défaut
        console.warn("⚠️ Continuer sans reference space explicite...");
      }
    }

    // Créer la scène
    console.log("🎬 Création de la scène 3D...");
    this.scene = new THREE.Scene();
    console.log("✅ Scène créée");

    // Créer la caméra
    console.log("📷 Création de la caméra...");
    const { fov, near, far } = WEBXR_CONFIG.camera;
    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far
    );
    console.log("✅ Caméra créée avec FOV:", fov);

    // Créer le réticule
    console.log("🎯 Création du réticule...");
    this.createReticle();
    console.log("✅ Réticule créé");

    // Ajouter l'éclairage
    console.log("💡 Configuration de l'éclairage...");
    this.setupLighting();
    console.log("✅ Éclairage configuré");

    // Ajouter le canvas au DOM avec style approprié
    console.log("📱 Ajout du canvas au DOM...");
    const canvas = this.renderer.domElement;
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "1000";
    document.body.appendChild(canvas);
    console.log("✅ Canvas ajouté au DOM");
  }

  createReticle() {
    const { innerRadius, outerRadius, segments, color, opacity } =
      WEBXR_CONFIG.reticle;
    const geometry = new THREE.RingGeometry(
      innerRadius,
      outerRadius,
      segments
    ).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
    });

    this.reticle = new THREE.Mesh(geometry, material);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);
  }

  setupLighting() {
    const { hemisphere, directional } = WEBXR_CONFIG.lighting;

    // Éclairage hémisphérique
    const hemiLight = new THREE.HemisphereLight(
      hemisphere.skyColor,
      hemisphere.groundColor,
      hemisphere.intensity
    );
    this.scene.add(hemiLight);

    // Éclairage directionnel
    const dirLight = new THREE.DirectionalLight(
      directional.color,
      directional.intensity
    );
    dirLight.position.set(...directional.position);
    this.scene.add(dirLight);
  }

  async loadModel(modelURL) {
    console.log("📦 Chargement du modèle 3D...", modelURL);
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      console.log("🔧 Loader GLTF créé");

      loader.load(
        modelURL,
        (gltf) => {
          this.model = gltf.scene;

          // Redimensionner le modèle pour l'AR avec la configuration
          const box = new THREE.Box3().setFromObject(this.model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = WEBXR_CONFIG.model.defaultScale / maxDim;
          this.model.scale.setScalar(scale);

          // Centrer le modèle
          const center = box.getCenter(new THREE.Vector3());
          this.model.position.sub(center.multiplyScalar(scale));

          this.model.visible = false;
          this.scene.add(this.model);

          console.log("📦 Modèle 3D chargé pour AR");
          resolve(this.model);
        },
        (progress) => {
          console.log(
            "📥 Chargement modèle:",
            (progress.loaded / progress.total) * 100 + "%"
          );
        },
        (error) => {
          console.error("❌ Erreur chargement modèle:", error);
          reject(new Error(getErrorMessage("modelLoadFailed", this.language)));
        }
      );
    });
  }

  setupEventListeners() {
    // Gérer les taps pour placer le modèle
    this.session.addEventListener("select", this.onSelect.bind(this));

    // Gérer la fin de session
    this.session.addEventListener("end", this.onSessionEnd.bind(this));
  }

  onSelect() {
    if (this.reticle.visible && this.model) {
      // Placer le modèle à la position du réticule
      this.model.position.setFromMatrixPosition(this.reticle.matrix);
      this.model.visible = true;
      this.isPlaced = true;

      console.log("📍 Modèle placé en AR");
    }
  }

  onSessionEnd() {
    console.log("🔚 Fin de session AR détectée");
    this.cleanup();
  }

  cleanup() {
    // Arrêter le monitoring
    if (this._monitoringInterval) {
      clearInterval(this._monitoringInterval);
      this._monitoringInterval = null;
    }

    // Nettoyer les ressources
    if (
      this.renderer &&
      this.renderer.domElement &&
      this.renderer.domElement.parentNode
    ) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // Nettoyer le DOM overlay si il existe
    const overlayRoot = document.getElementById("ar-overlay-root");
    if (overlayRoot && overlayRoot.parentNode) {
      overlayRoot.parentNode.removeChild(overlayRoot);
      console.log("🧹 DOM Overlay nettoyé");
    }

    // Réinitialiser les propriétés
    this.session = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.reticle = null;
    this.model = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.isPlaced = false;
    this._frameCount = 0;
    this._firstFrameLogged = false;
    this._noFrameWarned = false;

    console.log("🔚 Nettoyage complet terminé");
  }

  render(timestamp, frame) {
    try {
      // Compter les frames reçues
      if (frame) {
        this._frameCount = (this._frameCount || 0) + 1;

        // Debug première frame avec plus de détails
        if (!this._firstFrameLogged) {
          console.log("🎬 PREMIÈRE FRAME WebXR reçue:", {
            timestamp,
            frameNumber: this._frameCount,
            session: !!this.session,
            sessionEnvBlendMode: this.session?.environmentBlendMode,
            sessionVisibility: this.session?.visibilityState,
            viewerPose: !!frame.getViewerPose,
            referenceSpace: !!this.renderer.xr.getReferenceSpace(),
          });
          this._firstFrameLogged = true;
        }

        // Log périodique des frames (moins fréquent)
        if (this._frameCount % 120 === 0) {
          console.log(
            `📊 Frame WebXR #${this._frameCount} - AR actif (${Math.round(
              (this._frameCount / (performance.now() - this._lastFrameTime)) *
                1000
            )}fps)`
          );
        }

        // Vérifier que la session est toujours active
        if (this.session?.visibilityState !== "visible") {
          console.warn(
            "⚠️ Session AR non visible:",
            this.session?.visibilityState
          );
        }

        // Gérer le hit testing pour le réticule
        this.handleHitTest(frame);
      } else {
        // Pas de frame WebXR - problème critique !
        if (!this._noFrameWarned) {
          console.error("❌ CRITIQUE: Aucune frame WebXR reçue!");
          console.error("🔍 Debug session:", {
            sessionExists: !!this.session,
            sessionState: this.session?.visibilityState,
            sessionInputSources: this.session?.inputSources?.length || 0,
            rendererXR: this.renderer?.xr?.enabled,
            environmentBlendMode: this.session?.environmentBlendMode,
            referenceSpace: !!this.renderer?.xr?.getReferenceSpace(),
          });
          this._noFrameWarned = true;
        }
        return; // Ne pas tenter de rendre sans frame
      }

      // Faire tourner le modèle s'il est placé
      if (this.model && this.model.visible) {
        this.model.rotation.y += WEBXR_CONFIG.model.rotationSpeed;
      }

      // Rendre la scène seulement si on a une frame valide
      if (frame && this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (renderError) {
      console.error("❌ Erreur dans la boucle de rendu:", renderError);
      console.error("🔍 Context:", {
        hasFrame: !!frame,
        hasRenderer: !!this.renderer,
        hasScene: !!this.scene,
        hasCamera: !!this.camera,
        sessionActive: !!this.session,
      });
    }
  }

  async handleHitTest(frame) {
    const referenceSpace = this.renderer.xr.getReferenceSpace();
    const session = this.renderer.xr.getSession();

    // Vérifier que nous avons bien un reference space
    if (!referenceSpace) {
      console.warn("⚠️ Pas de reference space pour hit test");
      return;
    }

    if (!this.hitTestSourceRequested) {
      try {
        // Essayer d'obtenir la source de hit test depuis les contrôleurs
        const inputSources = session.inputSources;
        if (inputSources.length > 0 && inputSources[0].targetRaySpace) {
          this.hitTestSource = await session.requestHitTestSource({
            space: inputSources[0].targetRaySpace,
          });
          console.log("✅ Hit test source créé depuis input source");
        } else {
          // Fallback : utiliser l'espace de référence du viewer
          this.hitTestSource = await session.requestHitTestSource({
            space: session.viewerSpace || referenceSpace,
          });
          console.log("✅ Hit test source créé depuis viewer space");
        }
        this.hitTestSourceRequested = true;
      } catch (error) {
        console.warn("⚠️ Hit test source non disponible:", error);
        this.hitTestSourceRequested = true; // Éviter de réessayer en boucle
      }
    }

    if (this.hitTestSource) {
      const hitTestResults = frame.getHitTestResults(this.hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        this.reticle.visible = true;
        this.reticle.matrix.fromArray(
          hit.getPose(referenceSpace).transform.matrix
        );
      } else {
        this.reticle.visible = false;
      }
    }
  }

  end() {
    if (this.session) {
      this.session.end();
    }
  }
}
