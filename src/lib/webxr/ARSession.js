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

      // FORCER la demande d'accès caméra AVANT WebXR (obligatoire!)
      console.log("📹 DEMANDE OBLIGATOIRE de permissions caméra...");
      let cameraStream = null;

      try {
        console.log("📹 getUserMedia avec facingMode environment...");
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Caméra arrière pour AR
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        console.log("✅ CAMÉRA AUTORISÉE !", {
          tracks: cameraStream.getVideoTracks().length,
          trackSettings: cameraStream.getVideoTracks()[0]?.getSettings(),
          trackLabel: cameraStream.getVideoTracks()[0]?.label,
        });

        // Tester le feed vidéo
        const videoTrack = cameraStream.getVideoTracks()[0];
        if (videoTrack) {
          console.log("📹 Test feed vidéo:", {
            enabled: videoTrack.enabled,
            readyState: videoTrack.readyState,
            muted: videoTrack.muted,
          });
        }
      } catch (mediaError) {
        console.error("❌ ERREUR CRITIQUE - Pas d'accès caméra:", mediaError);
        console.error("🔍 Type:", mediaError.name);
        console.error("🔍 Message:", mediaError.message);

        if (mediaError.name === "NotAllowedError") {
          throw new Error(
            "❌ Permission caméra REFUSÉE. Rechargez et autorisez l'accès à la caméra."
          );
        } else if (mediaError.name === "NotFoundError") {
          throw new Error("❌ Aucune caméra trouvée sur cet appareil.");
        } else if (mediaError.name === "NotReadableError") {
          throw new Error("❌ Caméra occupée par une autre application.");
        }
        throw new Error(`❌ Erreur caméra: ${mediaError.message}`);
      }

      // Créer la session AR avec la configuration
      let sessionOptions = { ...WEBXR_CONFIG.sessionOptions };

      // Créer un div dédié pour domOverlay (évite les références circulaires)
      if (sessionOptions.optionalFeatures.includes("dom-overlay")) {
        const overlayRoot = document.createElement("div");
        overlayRoot.id = "ar-overlay-root";
        overlayRoot.style.cssText =
          "position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;";
        document.body.appendChild(overlayRoot);

        sessionOptions.domOverlay = { root: overlayRoot };
        console.log("🎭 DOM Overlay configuré avec div dédié");
      }

      console.log("🚀 Demande de session AR (caméra pré-autorisée)...", {
        requiredFeatures: sessionOptions.requiredFeatures,
        optionalFeatures: sessionOptions.optionalFeatures,
        hasDomOverlay: !!sessionOptions.domOverlay,
        cameraStreamActive: !!cameraStream,
      });

      try {
        // Demander la session WebXR maintenant que la caméra est autorisée
        this.session = await navigator.xr.requestSession(
          "immersive-ar",
          sessionOptions
        );

        // Fermer notre stream manuel maintenant que WebXR prend le relais
        if (cameraStream) {
          console.log(
            "📹 Fermeture du stream manuel, WebXR prend le relais..."
          );
          cameraStream.getTracks().forEach((track) => track.stop());
          cameraStream = null;
        }
        console.log("✅ Session AR créée:", this.session);
        console.log("📱 Vérification état session:", {
          renderState: this.session.renderState,
          inputSources: this.session.inputSources,
          environmentBlendMode: this.session.environmentBlendMode,
        });
      } catch (sessionError) {
        console.error("❌ ERREUR demande session AR:", sessionError);
        console.error("🔍 Type erreur session:", typeof sessionError);
        console.error("🔍 Nom erreur session:", sessionError.name);
        console.error("🔍 Message erreur session:", sessionError.message);
        console.error("🔍 Stack erreur session:", sessionError.stack);
        console.error(
          "🔍 Erreur session complète:",
          JSON.stringify(sessionError, Object.getOwnPropertyNames(sessionError))
        );

        // Erreurs WebXR spécifiques
        if (sessionError.name === "NotSupportedError") {
          console.error("💡 Suggestion: Fonctionnalité WebXR non supportée");
        } else if (sessionError.name === "SecurityError") {
          console.error("💡 Suggestion: Problème de sécurité/permissions");
        } else if (sessionError.name === "NotAllowedError") {
          console.error("💡 Suggestion: Permission refusée par l'utilisateur");
        }

        throw sessionError;
      }

      // Configurer Three.js pour WebXR
      this.setupThreeJS();

      // Charger le modèle 3D
      await this.loadModel(modelURL);

      // Configurer les événements
      this.setupEventListeners();

      // Démarrer la boucle de rendu avec debug WebXR
      console.log("🔄 Démarrage de la boucle de rendu...");
      this._frameCount = 0;
      this.renderer.setAnimationLoop(this.render.bind(this));

      // Vérifier les frames WebXR après 2 secondes
      setTimeout(() => {
        console.log("🔍 État frames WebXR après 2s:", {
          frameCount: this._frameCount,
          sessionActive: !!this.session,
          rendererXREnabled: this.renderer.xr.enabled,
          sessionMode: this.session?.environmentBlendMode,
        });

        if (this._frameCount === 0) {
          console.error("❌ PROBLÈME: Aucune frame WebXR après 2s!");
          console.error("💡 Possible: ARCore/ARKit ne démarre pas");
        }
      }, 2000);

      // Vérifier que le canvas est visible
      setTimeout(() => {
        const canvas = this.renderer.domElement;
        console.log("🖥️ État du canvas:", {
          width: canvas.width,
          height: canvas.height,
          style: canvas.style.cssText,
          parentNode: canvas.parentNode ? "attaché" : "non attaché",
          visibility: getComputedStyle(canvas).visibility,
          display: getComputedStyle(canvas).display,
        });
      }, 1000);

      console.log("🥽 Session AR initialisée avec succès");
      return this.session;
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation AR:", error);
      console.error("🔍 Type erreur:", typeof error);
      console.error("🔍 Nom erreur:", error.name);
      console.error("🔍 Message erreur:", error.message);
      console.error("🔍 Stack erreur:", error.stack);
      console.error(
        "🔍 Erreur complète:",
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
      throw error;
    }
  }

  setupThreeJS() {
    console.log("🎨 Configuration Three.js pour WebXR...");

    // Créer le renderer WebXR avec la configuration
    console.log("🖥️ Création du renderer WebGL...");
    this.renderer = new THREE.WebGLRenderer(WEBXR_CONFIG.renderer);
    console.log("✅ Renderer créé");

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    console.log(
      "📐 Taille renderer définie:",
      window.innerWidth,
      "x",
      window.innerHeight
    );

    this.renderer.xr.enabled = true;
    console.log("🥽 XR activé sur le renderer");

    this.renderer.xr.setSession(this.session);
    console.log("🔗 Session XR liée au renderer");

    // Créer la scène
    console.log("🎬 Création de la scène 3D...");
    this.scene = new THREE.Scene();
    console.log("✅ Scène créée");

    // Créer la caméra avec la configuration
    console.log("📷 Création de la caméra...");
    const { fov, near, far } = WEBXR_CONFIG.camera;
    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far
    );
    console.log("✅ Caméra créée avec FOV:", fov);

    // Créer le réticule (indicateur de placement)
    console.log("🎯 Création du réticule...");
    this.createReticle();
    console.log("✅ Réticule créé");

    // Ajouter l'éclairage avec la configuration
    console.log("💡 Configuration de l'éclairage...");
    this.setupLighting();
    console.log("✅ Éclairage configuré");

    // Ajouter le canvas au DOM
    console.log("📱 Ajout du canvas au DOM...");
    document.body.appendChild(this.renderer.domElement);
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

    this.session = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.reticle = null;
    this.model = null;
    this.hitTestSource = null;
    this.hitTestSourceRequested = false;
    this.isPlaced = false;

    console.log("🔚 Session AR terminée");
  }

  render(timestamp, frame) {
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
          hasCamera: !!frame.session?.inputSources,
          viewerPose: !!frame.getViewerPose,
        });
        this._firstFrameLogged = true;
      }

      // Log périodique des frames
      if (this._frameCount % 60 === 0) {
        console.log(`📊 Frame WebXR #${this._frameCount} - AR actif`);
      }

      // Gérer le hit testing pour le réticule
      this.handleHitTest(frame);
    } else {
      // Pas de frame WebXR - problème critique !
      if (!this._noFrameWarned) {
        console.error("❌ CRITIQUE: Aucune frame WebXR reçue!");
        console.error("🔍 Debug session:", {
          sessionExists: !!this.session,
          sessionInputSources: this.session?.inputSources?.length || 0,
          rendererXR: this.renderer.xr.enabled,
          environmentBlendMode: this.session?.environmentBlendMode,
        });
        this._noFrameWarned = true;
      }
    }

    // Faire tourner le modèle s'il est placé
    if (this.model && this.model.visible) {
      this.model.rotation.y += WEBXR_CONFIG.model.rotationSpeed;
    }

    // Rendre la scène
    this.renderer.render(this.scene, this.camera);
  }

  async handleHitTest(frame) {
    const referenceSpace = this.renderer.xr.getReferenceSpace();
    const session = this.renderer.xr.getSession();

    if (!this.hitTestSourceRequested) {
      try {
        // Essayer d'obtenir la source de hit test depuis les contrôleurs
        const inputSources = session.inputSources;
        if (inputSources.length > 0 && inputSources[0].targetRaySpace) {
          this.hitTestSource = await session.requestHitTestSource({
            space: inputSources[0].targetRaySpace,
          });
        } else {
          // Fallback : utiliser l'espace de référence du viewer
          this.hitTestSource = await session.requestHitTestSource({
            space: session.viewerSpace,
          });
        }
        this.hitTestSourceRequested = true;
      } catch (error) {
        console.warn("Hit test source non disponible:", error);
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
