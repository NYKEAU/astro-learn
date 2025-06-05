import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class ARSessionSimple {
  constructor() {
    this.session = null;
    this.gl = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.reticle = null;
    this.model = null;
    this.xrRefSpace = null;
    this.xrViewerSpace = null;
    this.xrHitTestSource = null;
    this.isPlaced = false;
    this.language = "fr";
    this._frameCount = 0;
  }

  async init(modelURL, language = "fr") {
    this.language = language;
    console.log("🔧 Initialisation ARSession simplifiée...");

    try {
      // Vérifier le support WebXR
      if (!navigator.xr) {
        throw new Error("WebXR non supporté");
      }

      // Vérifier le support AR
      const isSupported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!isSupported) {
        throw new Error("AR non supportée");
      }

      // Demander la session AR avec les bonnes options (comme la démo Hit Test)
      console.log("🚀 Demande session AR...");
      this.session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["local", "hit-test"], // Crucial : inclure 'local'
      });
      console.log("✅ Session AR créée");

      // Configurer les événements
      this.session.addEventListener("end", this.onSessionEnded.bind(this));

      // Créer le contexte WebGL compatible XR
      if (!this.gl) {
        console.log("🖥️ Création contexte WebGL...");
        this.gl = this.createWebGLContext({ xrCompatible: true });
        console.log("✅ Contexte WebGL créé");
      }

      // Configuration du render state AVANT les reference spaces
      this.session.updateRenderState({
        baseLayer: new XRWebGLLayer(this.session, this.gl),
      });
      console.log("✅ Render state configuré");

      // Configurer Three.js pour le rendu (mais pas XR)
      await this.setupThreeJS();

      // Charger le modèle 3D
      await this.loadModel(modelURL);

      // Configurer les reference spaces (comme la démo Hit Test)
      await this.setupReferenceSpaces();

      console.log("🥽 Session AR initialisée avec succès");
      return this.session;
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation AR:", error);
      this.cleanup();
      throw error;
    }
  }

  createWebGLContext(options = {}) {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", options) ||
      canvas.getContext("webgl", options);

    if (!gl) {
      throw new Error("WebGL non supporté");
    }

    // Ajouter le canvas au DOM avec style pour AR
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "1000";
    document.body.appendChild(canvas);

    // Stocker le canvas pour les gestionnaires d'événements
    this.canvas = canvas;

    return gl;
  }

  async setupThreeJS() {
    console.log("🎨 Configuration Three.js...");

    // Créer le renderer Three.js SANS XR
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.gl.canvas,
      context: this.gl,
      antialias: true,
      alpha: true,
    });

    // NE PAS activer XR dans Three.js - on va gérer manuellement
    this.renderer.xr.enabled = false;

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Créer la scène
    this.scene = new THREE.Scene();

    // Créer la caméra
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    // Créer le réticule
    this.createReticle();

    // Ajouter l'éclairage
    this.setupLighting();

    console.log("✅ Three.js configuré");
  }

  createReticle() {
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(
      -Math.PI / 2
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide, // Visible des deux côtés
    });

    this.reticle = new THREE.Mesh(geometry, material);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    // Ajouter un cercle central pour meilleure visibilité
    const centerGeometry = new THREE.CircleGeometry(0.05, 16).rotateX(
      -Math.PI / 2
    );
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide,
    });

    const centerDot = new THREE.Mesh(centerGeometry, centerMaterial);
    this.reticle.add(centerDot);

    console.log("🎯 Réticule créé avec indicateur central");
  }

  setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0.5, 1, 0.25);
    this.scene.add(dirLight);
  }

  async loadModel(modelURL) {
    console.log("📦 Chargement du modèle 3D...", modelURL);
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        modelURL,
        (gltf) => {
          this.model = gltf.scene;

          // Redimensionner le modèle
          const box = new THREE.Box3().setFromObject(this.model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 0.3 / maxDim;
          this.model.scale.setScalar(scale);

          // Centrer le modèle
          const center = box.getCenter(new THREE.Vector3());
          this.model.position.sub(center.multiplyScalar(scale));

          this.model.visible = false;
          this.scene.add(this.model);

          console.log("📦 Modèle 3D chargé");
          resolve(this.model);
        },
        undefined,
        reject
      );
    });
  }

  async setupReferenceSpaces() {
    console.log("🎯 Configuration des reference spaces...");

    // Configurer le viewer space pour le hit testing (comme la démo Hit Test)
    const viewerSpace = await this.session.requestReferenceSpace("viewer");
    this.xrViewerSpace = viewerSpace;

    const hitTestSource = await this.session.requestHitTestSource({
      space: this.xrViewerSpace,
    });
    this.xrHitTestSource = hitTestSource;
    console.log("✅ Hit test source créé");

    // Configurer le local reference space pour le rendu
    const localSpace = await this.session.requestReferenceSpace("local");
    this.xrRefSpace = localSpace;
    console.log("✅ Reference spaces configurés");

    // Configurer les événements de selection (tap)
    this.session.addEventListener("select", this.onSelect.bind(this));

    // Ajouter gestionnaire de clic/tap sur le canvas comme backup
    if (this.canvas) {
      this.canvas.addEventListener("click", () => {
        console.log("👆 Clic canvas détecté (backup)");
        this.placeModel();
      });

      this.canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        console.log("👆 Touch end canvas détecté (backup)");
        this.placeModel();
      });
    }

    // Démarrer la boucle de rendu
    this.session.requestAnimationFrame(this.onXRFrame.bind(this));
    console.log("🔄 Boucle de rendu démarrée");
  }

  onXRFrame(timestamp, frame) {
    try {
      this._frameCount++;

      if (this._frameCount === 1) {
        console.log("🎬 PREMIÈRE FRAME WebXR reçue !");
      }

      const session = frame.session;
      const pose = frame.getViewerPose(this.xrRefSpace);

      this.reticle.visible = false;

      // Gestion du hit testing (comme la démo Hit Test)
      if (this.xrHitTestSource && pose) {
        const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
        if (hitTestResults.length > 0) {
          const hitPose = hitTestResults[0].getPose(this.xrRefSpace);
          this.reticle.visible = true;
          this.reticle.matrix.fromArray(hitPose.transform.matrix);

          // Log la première détection de surface
          if (!this._surfaceDetected) {
            console.log("🎯 Surface détectée ! Réticule visible");
            this._surfaceDetected = true;
          }
        } else {
          this.reticle.visible = false;
        }
      }

      // Faire tourner le modèle s'il est placé
      if (this.model && this.model.visible) {
        this.model.rotation.y += 0.01;
      }

      // Rendu avec les vues XR
      if (pose) {
        const glLayer = session.renderState.baseLayer;
        this.renderer.setSize(
          glLayer.framebufferWidth,
          glLayer.framebufferHeight,
          false
        );

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        for (const view of pose.views) {
          const viewport = glLayer.getViewport(view);
          this.gl.viewport(
            viewport.x,
            viewport.y,
            viewport.width,
            viewport.height
          );

          // Configurer la caméra avec la matrice de vue XR
          this.camera.matrix.fromArray(view.transform.inverse.matrix);
          this.camera.projectionMatrix.fromArray(view.projectionMatrix);
          this.camera.updateMatrixWorld(true);

          // Rendu de la scène
          this.renderer.render(this.scene, this.camera);
        }
      }

      // Demander la prochaine frame
      session.requestAnimationFrame(this.onXRFrame.bind(this));
    } catch (error) {
      console.error("❌ Erreur dans onXRFrame:", error);
    }
  }

  // Gestionnaire d'événement de sélection WebXR (tap/click)
  onSelect(event) {
    console.log("👆 Événement select détecté");
    this.placeModel();
  }

  // Méthode pour placer le modèle au tap (à appeler depuis l'UI)
  placeModel() {
    if (this.reticle.visible && this.model) {
      // Extraire la position du réticule et placer le modèle légèrement au-dessus
      const reticlePosition = new THREE.Vector3();
      const reticleQuaternion = new THREE.Quaternion();
      const reticleScale = new THREE.Vector3();

      // Décomposer la matrice du réticule
      this.reticle.matrix.decompose(
        reticlePosition,
        reticleQuaternion,
        reticleScale
      );

      // Placer le modèle à la position du réticule mais légèrement surélevé
      this.model.position.copy(reticlePosition);
      this.model.position.y += 0.1; // Soulever de 10cm au-dessus de la surface

      // Appliquer la rotation du réticule
      this.model.quaternion.copy(reticleQuaternion);

      // S'assurer que le modèle a une taille appropriée
      this.model.scale.setScalar(0.3); // 30cm de taille

      this.model.visible = true;
      this.isPlaced = true;

      const action = this.isPlaced ? "repositionné" : "placé";
      console.log(`📍 Modèle ${action} à la position:`, {
        position: this.model.position,
        reticlePosition: reticlePosition,
        scale: this.model.scale,
        distance: reticlePosition.distanceTo(new THREE.Vector3(0, 0, 0)),
      });
    } else {
      console.log("⚠️ Impossible de placer le modèle:", {
        reticleVisible: this.reticle?.visible,
        hasModel: !!this.model,
        reason: !this.reticle?.visible
          ? "Aucune surface détectée"
          : "Modèle non chargé",
      });
    }
  }

  onSessionEnded() {
    console.log("🔚 Session AR terminée");
    this.cleanup();
  }

  cleanup() {
    if (this.xrHitTestSource) {
      this.xrHitTestSource.cancel();
      this.xrHitTestSource = null;
    }

    if (this.session) {
      this.session = null;
    }

    // Nettoyer le canvas
    const canvas = this.gl?.canvas;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }

  end() {
    if (this.session) {
      this.session.end();
    }
  }
}
