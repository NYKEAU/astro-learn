import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WEBXR_CONFIG, getErrorMessage } from './config.js';

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
        this.language = 'fr';
    }

    async init(modelURL, language = 'fr') {
        this.language = language;

        try {
            // Vérifier le support WebXR
            if (!navigator.xr) {
                throw new Error(getErrorMessage('webxrNotSupported', language));
            }

            // Vérifier le support AR
            const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
            if (!isSupported) {
                throw new Error(getErrorMessage('arNotSupported', language));
            }

            // Créer la session AR avec la configuration
            this.session = await navigator.xr.requestSession('immersive-ar', WEBXR_CONFIG.sessionOptions);

            // Configurer Three.js pour WebXR
            this.setupThreeJS();

            // Charger le modèle 3D
            await this.loadModel(modelURL);

            // Configurer les événements
            this.setupEventListeners();

            // Démarrer la boucle de rendu
            this.renderer.setAnimationLoop(this.render.bind(this));

            console.log('🥽 Session AR initialisée avec succès');
            return this.session;

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation AR:', error);
            throw error;
        }
    }

    setupThreeJS() {
        // Créer le renderer WebXR avec la configuration
        this.renderer = new THREE.WebGLRenderer(WEBXR_CONFIG.renderer);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.renderer.xr.setSession(this.session);

        // Créer la scène
        this.scene = new THREE.Scene();

        // Créer la caméra avec la configuration
        const { fov, near, far } = WEBXR_CONFIG.camera;
        this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);

        // Créer le réticule (indicateur de placement)
        this.createReticle();

        // Ajouter l'éclairage avec la configuration
        this.setupLighting();

        // Ajouter le canvas au DOM
        document.body.appendChild(this.renderer.domElement);
    }

    createReticle() {
        const { innerRadius, outerRadius, segments, color, opacity } = WEBXR_CONFIG.reticle;
        const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments).rotateX(-Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity
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
        const dirLight = new THREE.DirectionalLight(directional.color, directional.intensity);
        dirLight.position.set(...directional.position);
        this.scene.add(dirLight);
    }

    async loadModel(modelURL) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();

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

                    console.log('📦 Modèle 3D chargé pour AR');
                    resolve(this.model);
                },
                (progress) => {
                    console.log('📥 Chargement modèle:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    console.error('❌ Erreur chargement modèle:', error);
                    reject(new Error(getErrorMessage('modelLoadFailed', this.language)));
                }
            );
        });
    }

    setupEventListeners() {
        // Gérer les taps pour placer le modèle
        this.session.addEventListener('select', this.onSelect.bind(this));

        // Gérer la fin de session
        this.session.addEventListener('end', this.onSessionEnd.bind(this));
    }

    onSelect() {
        if (this.reticle.visible && this.model) {
            // Placer le modèle à la position du réticule
            this.model.position.setFromMatrixPosition(this.reticle.matrix);
            this.model.visible = true;
            this.isPlaced = true;

            console.log('📍 Modèle placé en AR');
        }
    }

    onSessionEnd() {
        // Nettoyer les ressources
        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
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

        console.log('🔚 Session AR terminée');
    }

    render(timestamp, frame) {
        if (frame) {
            // Gérer le hit testing pour le réticule
            this.handleHitTest(frame);
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
                        space: inputSources[0].targetRaySpace
                    });
                } else {
                    // Fallback : utiliser l'espace de référence du viewer
                    this.hitTestSource = await session.requestHitTestSource({
                        space: session.viewerSpace
                    });
                }
                this.hitTestSourceRequested = true;
            } catch (error) {
                console.warn('Hit test source non disponible:', error);
                this.hitTestSourceRequested = true; // Éviter de réessayer en boucle
            }
        }

        if (this.hitTestSource) {
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                this.reticle.visible = true;
                this.reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
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