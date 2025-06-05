"use client";

import { Suspense, useRef, useEffect, Component, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stars, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { MobileControls } from "./MobileControls";
import { DesktopControls } from "./DesktopControls";

/**
 * Error Boundary pour capturer et gérer les erreurs de chargement des modèles GLTF
 * Affiche un modèle de fallback en cas d'erreur CORS ou de chargement
 *
 * @class ModelErrorBoundary
 * @extends {Component}
 */
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ Erreur capturée par Error Boundary:", error);
    console.error("📍 Info erreur:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.log(
        "🔄 Affichage du modèle de fallback à cause de l'erreur:",
        this.state.error?.message
      );
      return <FallbackModel />;
    }

    return this.props.children;
  }
}

/**
 * Modèle 3D de fallback affiché en cas d'erreur de chargement
 * Affiche un système solaire simplifié avec animation
 *
 * @component
 * @returns {JSX.Element} Scène 3D de fallback avec animation
 */
function FallbackModel() {
  const meshRef = useRef();
  const earthRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
    if (earthRef.current) {
      // Terre en orbite autour du soleil
      const time = state.clock.elapsedTime;
      earthRef.current.position.x = Math.cos(time * 0.5) * 2;
      earthRef.current.position.z = Math.sin(time * 0.5) * 2;
      earthRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group>
      {/* Soleil central */}
      <Sphere ref={meshRef} args={[0.8, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#FDB813"
          emissive="#FDB813"
          emissiveIntensity={0.4}
        />
      </Sphere>

      {/* Terre en orbite */}
      <Sphere ref={earthRef} args={[0.3, 16, 16]} position={[2, 0, 0]}>
        <meshStandardMaterial color="#4A90E2" roughness={0.8} metalness={0.1} />
      </Sphere>

      {/* Mars statique */}
      <Sphere args={[0.2, 16, 16]} position={[3.5, 0.2, 0]}>
        <meshStandardMaterial color="#CD5C5C" roughness={0.8} metalness={0.1} />
      </Sphere>

      {/* Étoiles en arrière-plan */}
      <Stars
        radius={300}
        depth={60}
        count={2000}
        factor={3}
        saturation={0}
        fade
        speed={0.3}
      />
    </group>
  );
}

/**
 * Composant pour charger et afficher un modèle GLTF avec fallback
 * @param {Object} props - Propriétés du composant
 * @param {string} props.url - URL du modèle GLTF
 * @param {boolean} [props.autoRotate=true] - Active la rotation automatique
 * @param {number} [props.rotationSpeed=0.01] - Vitesse de rotation
 * @returns {JSX.Element} Modèle GLTF rendu avec skybox étoilée
 */
function GLTFModel({ url, autoRotate = true, rotationSpeed = 0.01 }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += rotationSpeed;
    }
  });

  useEffect(() => {
    if (scene) {
      // Centrer et redimensionner le modèle
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Centrer le modèle
      scene.position.sub(center);

      // Redimensionner pour qu'il soit bien visible sans être trop grand
      const maxDim = Math.max(size.x, size.y, size.z);
      // Échelle plus conservative pour éviter d'être trop zoomé
      const scale = Math.min(4 / maxDim, 2); // Maximum scale de 2, ou 4/maxDim si plus petit
      scene.scale.setScalar(scale);

      console.log(
        `📏 Modèle chargé avec succès! Taille originale: ${maxDim.toFixed(
          2
        )}, échelle appliquée: ${scale.toFixed(2)}`
      );
    }
  }, [scene]);

  return (
    <group>
      <primitive ref={meshRef} object={scene} />
      <Stars
        radius={300}
        depth={60}
        count={2000}
        factor={3}
        saturation={0}
        fade
        speed={0.3}
      />
    </group>
  );
}

/**
 * Composant pour afficher différents types de modèles 3D astronomiques
 * Supporte les modèles GLTF personnalisés et les modèles procéduraux intégrés
 *
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {string} props.modelType - Type de modèle ("sun", "earth", "planets")
 * @param {string} [props.modelURL] - URL optionnelle d'un modèle GLTF personnalisé
 * @param {boolean} [props.autoRotate=true] - Active la rotation automatique
 * @param {number} [props.rotationSpeed=0.01] - Vitesse de rotation
 * @returns {JSX.Element} Modèle 3D rendu selon le type spécifié
 *
 * @example
 * // Modèle GLTF personnalisé
 * <Model3D modelURL="/models/mars.glb" autoRotate={true} />
 *
 * @example
 * // Modèle procédural du système solaire
 * <Model3D modelType="planets" rotationSpeed={0.005} />
 */
function Model3D({
  modelType,
  modelURL,
  autoRotate = true,
  rotationSpeed = 0.01,
}) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += rotationSpeed;
    }
  });

  // Si une URL de modèle GLTF est fournie, l'utiliser
  if (modelURL) {
    // Précharger le modèle pour de meilleures performances
    useGLTF.preload(modelURL);

    return (
      <ModelErrorBoundary>
        <GLTFModel
          url={modelURL}
          autoRotate={autoRotate}
          rotationSpeed={rotationSpeed}
        />
      </ModelErrorBoundary>
    );
  }

  switch (modelType) {
    case "sun":
      return (
        <Sphere ref={meshRef} args={[2, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#FDB813"
            emissive="#FDB813"
            emissiveIntensity={0.3}
          />
        </Sphere>
      );

    case "earth":
    case "planets":
      return (
        <group>
          {/* Soleil central */}
          <Sphere args={[0.8, 32, 32]} position={[0, 0, 0]}>
            <meshStandardMaterial
              color="#FDB813"
              emissive="#FDB813"
              emissiveIntensity={0.3}
            />
          </Sphere>

          {/* Planètes en orbite */}
          {[
            { color: "#8C7853", size: 0.08, distance: 1.2, name: "Mercure" },
            { color: "#FFC649", size: 0.12, distance: 1.5, name: "Venus" },
            { color: "#4A90E2", size: 0.13, distance: 1.8, name: "Terre" },
            { color: "#CD5C5C", size: 0.1, distance: 2.2, name: "Mars" },
            { color: "#D8CA9D", size: 0.25, distance: 3.0, name: "Jupiter" },
            { color: "#FAD5A5", size: 0.22, distance: 3.8, name: "Saturne" },
            { color: "#4FD0E7", size: 0.18, distance: 4.5, name: "Uranus" },
            { color: "#4B70DD", size: 0.17, distance: 5.0, name: "Neptune" },
          ].map((planet, index) => (
            <Sphere
              key={index}
              args={[planet.size, 16, 16]}
              position={[
                Math.cos(index * 0.8 + Date.now() * 0.0001) * planet.distance,
                Math.sin(index * 0.3) * 0.1,
                Math.sin(index * 0.8 + Date.now() * 0.0001) * planet.distance,
              ]}
            >
              <meshStandardMaterial
                color={planet.color}
                roughness={0.8}
                metalness={0.1}
              />
            </Sphere>
          ))}

          {/* Anneaux de Saturne */}
          <mesh
            position={[
              Math.cos(5 * 0.8 + Date.now() * 0.0001) * 3.8,
              Math.sin(5 * 0.3) * 0.1,
              Math.sin(5 * 0.8 + Date.now() * 0.0001) * 3.8,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.25, 0.35, 32]} />
            <meshStandardMaterial
              color="#FAD5A5"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      );

    case "jupiter":
      return (
        <Sphere ref={meshRef} args={[2.5, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#D8CA9D"
            roughness={0.6}
            metalness={0.1}
          />
        </Sphere>
      );

    case "nebula":
      return (
        <group ref={meshRef}>
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[3, 32, 32]} />
            <meshStandardMaterial
              color="#9D4EDD"
              transparent
              opacity={0.3}
              emissive="#9D4EDD"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      );

    case "star":
      return (
        <Sphere ref={meshRef} args={[1, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={0.5}
          />
        </Sphere>
      );

    default:
      return (
        <Sphere ref={meshRef} args={[1.5, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#4A90E2"
            roughness={0.8}
            metalness={0.2}
          />
        </Sphere>
      );
  }
}

// Composant de chargement
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
    </div>
  );
}

// Composant principal ModelViewer
export default function ModelViewer({
  modelType = "default",
  className = "",
  modelURL,
  onClose,
  language = "fr",
  isMobile = false,
  title = "Modèle 3D",
  moduleTitle = "",
}) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(0.01);
  const [touchStart, setTouchStart] = useState(null);

  const handleAnimationChange = (speed) => {
    if (speed === 0) {
      setAutoRotate(false);
    } else {
      setAutoRotate(true);
      setRotationSpeed(speed);
    }
  };

  // Gestion du swipe pour fermer sur mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;

    // Si swipe vers le bas de plus de 100px, fermer
    if (diff < -100 && onClose) {
      onClose();
    }

    setTouchStart(null);
  };

  // Classes responsives
  const containerClasses = isMobile
    ? "fixed inset-0 z-50 bg-cosmic-black"
    : `w-full h-full relative ${className}`;

  return (
    <div
      className={containerClasses}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Contrôles selon la taille d'écran */}
      {isMobile ? (
        <MobileControls
          autoRotate={autoRotate}
          rotationSpeed={rotationSpeed}
          onAnimationChange={handleAnimationChange}
          onClose={onClose}
          language={language}
          modelURL={modelURL}
          title={title}
          moduleTitle={moduleTitle}
        />
      ) : (
        <DesktopControls
          autoRotate={autoRotate}
          rotationSpeed={rotationSpeed}
          onAnimationChange={handleAnimationChange}
          language={language}
          modelURL={modelURL}
          title={title}
          moduleTitle={moduleTitle}
        />
      )}

      <Suspense fallback={<LoadingSpinner />}>
        <Canvas
          camera={{
            position: [0, 0, 6], // Position plus éloignée par défaut pour éviter d'être trop zoomé
            fov: 60, // FOV légèrement réduit pour éviter la distortion
          }}
          style={{ background: "transparent" }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={[1, isMobile ? 1.5 : 2]}
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.8} />

          <Model3D
            modelType={modelType}
            modelURL={modelURL}
            autoRotate={autoRotate}
            rotationSpeed={rotationSpeed}
          />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={1.5} // Distance minimale augmentée pour éviter d'être trop proche
            maxDistance={20} // Distance maximale augmentée pour plus de flexibilité
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN,
            }}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN,
            }}
            rotateSpeed={isMobile ? 0.8 : 0.5}
            zoomSpeed={isMobile ? 1.2 : 0.8}
            panSpeed={isMobile ? 1.0 : 0.8}
          />

          {["sun", "jupiter", "star", "nebula"].includes(modelType) &&
            !modelURL && (
              <Stars
                radius={300}
                depth={60}
                count={1000}
                factor={2}
                saturation={0}
                fade
                speed={0.5}
              />
            )}
        </Canvas>
      </Suspense>
    </div>
  );
}
