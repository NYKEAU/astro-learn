"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Sphere, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { get3DModelURL } from "@/lib/firebase/storage";

// Composant pour charger un modèle 3D depuis Storage
function Model3D({ modelId, fallbackComponent }) {
  const [modelUrl, setModelUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = await get3DModelURL(modelId);

        if (url) {
          setModelUrl(url);
          console.log(`✅ Modèle 3D chargé pour ${modelId}: ${url}`);
        } else {
          console.warn(
            `⚠️ Aucun modèle 3D trouvé pour ${modelId}, utilisation du fallback`
          );
          setError(true);
        }
      } catch (err) {
        console.error(
          `❌ Erreur lors du chargement du modèle 3D ${modelId}:`,
          err
        );
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [modelId]);

  if (loading) {
    return (
      <Sphere args={[0.5, 8, 8]}>
        <meshBasicMaterial color="#666666" wireframe />
      </Sphere>
    );
  }

  if (error || !modelUrl) {
    return fallbackComponent;
  }

  return <GLTFModel url={modelUrl} />;
}

// Composant pour rendre le modèle GLTF chargé
function GLTFModel({ url }) {
  const { scene } = useGLTF(url);

  // Cloner la scène pour éviter les conflits si le même modèle est utilisé plusieurs fois
  const clonedScene = scene.clone();

  useFrame(() => {
    if (clonedScene) {
      clonedScene.rotation.y += 0.005;
    }
  });

  // Ajuster la taille du modèle uniquement
  useEffect(() => {
    if (clonedScene) {
      const box = new THREE.Box3().setFromObject(clonedScene);
      const size = box.getSize(new THREE.Vector3());

      // Normaliser la taille pour qu'elle soit d'environ 1.5 unités
      const maxDimension = Math.max(size.x, size.y, size.z);
      if (maxDimension > 0) {
        const scale = 1.5 / maxDimension;
        clonedScene.scale.setScalar(scale);
      }
    }
  }, [clonedScene]);

  return <primitive object={clonedScene} />;
}

// Composant pour un objet 3D sélectionnable
function DraggableObject({
  object,
  position,
  scale,
  isSelected,
  interactionMode,
  onSelect,
  onMove,
  onInteractionStart,
  onInteractionEnd,
}) {
  const meshRef = useRef();
  const groupRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const initialPosition = useRef(position);

  // Position sécurisée - si undefined, utiliser position par défaut
  const safePosition = position || { x: 0, y: 0, z: 0 };
  const safeScale = scale || 1.0;

  // Mettre à jour la position directement via Three.js quand elle change
  useEffect(() => {
    if (groupRef.current && position) {
      // Forcer la mise à jour de la position Three.js
      groupRef.current.position.set(
        position.x || 0,
        position.y || 0,
        position.z || 0
      );
      initialPosition.current = position;
    }
  }, [position?.x, position?.y, position?.z]);

  // Mettre à jour le scale
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.set(safeScale, safeScale, safeScale);
    }
  }, [safeScale]);

  // Animation de rotation uniquement
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Fonction pour déplacer l'objet directement
  const moveObject = (axis, direction) => {
    if (!groupRef.current) return;

    const MOVE_STEP = 1;
    const currentPos = groupRef.current.position;
    const newPosition = {
      x: currentPos.x,
      y: currentPos.y,
      z: currentPos.z,
    };

    newPosition[axis] += direction * MOVE_STEP;

    // Contraintes
    const MOVEMENT_BOUNDS = {
      x: [-20, 20],
      y: [-8, 8],
      z: [-20, 20],
    };

    newPosition[axis] = Math.max(
      MOVEMENT_BOUNDS[axis][0],
      Math.min(MOVEMENT_BOUNDS[axis][1], newPosition[axis])
    );

    // Mettre à jour directement Three.js
    groupRef.current.position.set(newPosition.x, newPosition.y, newPosition.z);

    // Informer le parent pour la sauvegarde
    onMove(object.id, newPosition);
  };

  // Créer le modèle 3D selon le type
  const createModel = () => {
    // Fallback components pour chaque type
    const fallbackComponents = {
      sun: (
        <Sphere ref={meshRef} args={[1, 32, 32]}>
          <meshStandardMaterial
            color="#FDB813"
            emissive="#FDB813"
            emissiveIntensity={0.3}
          />
        </Sphere>
      ),
      earth: (
        <Sphere ref={meshRef} args={[0.8, 32, 32]}>
          <meshStandardMaterial
            color="#4A90E2"
            roughness={0.8}
            metalness={0.1}
          />
        </Sphere>
      ),
      jupiter: (
        <Sphere ref={meshRef} args={[1.2, 32, 32]}>
          <meshStandardMaterial
            color="#D8CA9D"
            roughness={0.6}
            metalness={0.1}
          />
        </Sphere>
      ),
      planets: (
        <group ref={meshRef}>
          {/* Soleil central */}
          <Sphere args={[0.3, 16, 16]} position={[0, 0, 0]}>
            <meshStandardMaterial
              color="#FDB813"
              emissive="#FDB813"
              emissiveIntensity={0.2}
            />
          </Sphere>

          {/* Planètes en orbite */}
          {[
            { color: "#8C7853", size: 0.05, distance: 0.6 },
            { color: "#FFC649", size: 0.08, distance: 0.8 },
            { color: "#4A90E2", size: 0.08, distance: 1.0 },
            { color: "#CD5C5C", size: 0.06, distance: 1.3 },
          ].map((planet, index) => (
            <Sphere
              key={index}
              args={[planet.size, 12, 12]}
              position={[
                Math.cos(index * 1.5) * planet.distance,
                0,
                Math.sin(index * 1.5) * planet.distance,
              ]}
            >
              <meshStandardMaterial color={planet.color} />
            </Sphere>
          ))}
        </group>
      ),
      nebula: (
        <group ref={meshRef}>
          <Sphere args={[1.5, 32, 32]}>
            <meshStandardMaterial
              color="#9D4EDD"
              transparent
              opacity={0.4}
              emissive="#9D4EDD"
              emissiveIntensity={0.2}
            />
          </Sphere>
        </group>
      ),
      star: (
        <Sphere ref={meshRef} args={[0.6, 32, 32]}>
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={0.5}
          />
        </Sphere>
      ),
    };

    // Essayer de charger le modèle 3D depuis Storage, sinon utiliser le fallback
    const fallback = fallbackComponents[object.id] || fallbackComponents.earth;

    // Utiliser l'ID du module correspondant pour charger le modèle
    const moduleId = object.moduleId || getModuleIdFromObjectId(object.id);

    return <Model3D modelId={moduleId} fallbackComponent={fallback} />;
  };

  // Fonction helper pour déduire l'ID du module depuis l'ID de l'objet
  const getModuleIdFromObjectId = (objectId) => {
    const objectToModule = {
      earth: "1",
      sun: "2",
      jupiter: "3",
      planets: "4",
      nebula: "5",
      star: "6",
    };

    return objectToModule[objectId] || objectId;
  };

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(object.id);
      }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Indicateur de survol */}
      {isHovered && !isSelected && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[2.2, 2.4, 32]} rotation={[-Math.PI / 2, 0, 0]} />
          <meshBasicMaterial
            color="#00CFFF"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Modèle 3D */}
      {createModel()}

      {/* Gizmos de déplacement (seulement pour l'objet sélectionné et en mode déplacement) */}
      {isSelected && interactionMode === "move" && (
        <SimpleGizmo
          onMove={moveObject}
          onInteractionStart={onInteractionStart}
          onInteractionEnd={onInteractionEnd}
        />
      )}
    </group>
  );
}

// Gizmo ultra-simple
function SimpleGizmo({ onMove, onInteractionStart, onInteractionEnd }) {
  const [hoveredAxis, setHoveredAxis] = useState(null);
  const GIZMO_DISTANCE = 2;

  const getArrowColor = (axis, direction) => {
    const arrowColors = { x: "#ff4444", y: "#44ff44", z: "#4444ff" };
    const isHovered = hoveredAxis === `${axis}_${direction}`;
    return isHovered ? "#ffffff" : arrowColors[axis];
  };

  return (
    <group>
      {/* Flèche X+ (droite) - pointe vers la droite */}
      <mesh
        position={[GIZMO_DISTANCE, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        onClick={(e) => {
          e.stopPropagation();
          onMove("x", 1);
        }}
        onPointerEnter={() => {
          setHoveredAxis("x_pos");
          onInteractionStart && onInteractionStart();
        }}
        onPointerLeave={() => {
          setHoveredAxis(null);
          onInteractionEnd && onInteractionEnd();
        }}
      >
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshBasicMaterial color={getArrowColor("x", "pos")} />
      </mesh>

      {/* Flèche X- (gauche) - pointe vers la gauche */}
      <mesh
        position={[-GIZMO_DISTANCE, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        onClick={(e) => {
          e.stopPropagation();
          onMove("x", -1);
        }}
        onPointerEnter={() => {
          setHoveredAxis("x_neg");
          onInteractionStart && onInteractionStart();
        }}
        onPointerLeave={() => {
          setHoveredAxis(null);
          onInteractionEnd && onInteractionEnd();
        }}
      >
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshBasicMaterial color={getArrowColor("x", "neg")} />
      </mesh>

      {/* Flèche Y+ (haut) - pointe vers le haut */}
      <mesh
        position={[0, GIZMO_DISTANCE, 0]}
        rotation={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onMove("y", 1);
        }}
        onPointerEnter={() => {
          setHoveredAxis("y_pos");
          onInteractionStart && onInteractionStart();
        }}
        onPointerLeave={() => {
          setHoveredAxis(null);
          onInteractionEnd && onInteractionEnd();
        }}
      >
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshBasicMaterial color={getArrowColor("y", "pos")} />
      </mesh>

      {/* Flèche Y- (bas) - pointe vers le bas */}
      <mesh
        position={[0, -GIZMO_DISTANCE, 0]}
        rotation={[0, 0, Math.PI]}
        onClick={(e) => {
          e.stopPropagation();
          onMove("y", -1);
        }}
        onPointerEnter={() => {
          setHoveredAxis("y_neg");
          onInteractionStart && onInteractionStart();
        }}
        onPointerLeave={() => {
          setHoveredAxis(null);
          onInteractionEnd && onInteractionEnd();
        }}
      >
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshBasicMaterial color={getArrowColor("y", "neg")} />
      </mesh>

      {/* Flèche Z+ (avant) - pointe vers l'avant (vers vous) */}
      <mesh
        position={[0, 0, GIZMO_DISTANCE]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onMove("z", 1);
        }}
        onPointerEnter={() => {
          setHoveredAxis("z_pos");
          onInteractionStart && onInteractionStart();
        }}
        onPointerLeave={() => {
          setHoveredAxis(null);
          onInteractionEnd && onInteractionEnd();
        }}
      >
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshBasicMaterial color={getArrowColor("z", "pos")} />
      </mesh>

      {/* Flèche Z- (arrière) - pointe vers l'arrière (loin de vous) */}
      <mesh
        position={[0, 0, -GIZMO_DISTANCE]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onMove("z", -1);
        }}
        onPointerEnter={() => {
          setHoveredAxis("z_neg");
          onInteractionStart && onInteractionStart();
        }}
        onPointerLeave={() => {
          setHoveredAxis(null);
          onInteractionEnd && onInteractionEnd();
        }}
      >
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshBasicMaterial color={getArrowColor("z", "neg")} />
      </mesh>
    </group>
  );
}

// Composant pour contrôler la caméra
function CameraController({ target, onTargetReached }) {
  const { camera } = useThree();
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (target && !isMoving) {
      setIsMoving(true);

      // Animation fluide vers la cible
      const startPosition = camera.position.clone();
      const targetPosition = new THREE.Vector3(
        target.x + 5,
        target.y + 3,
        target.z + 5
      );

      let progress = 0;
      const duration = 2000; // 2 secondes
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);

        // Interpolation fluide
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        camera.position.lerpVectors(
          startPosition,
          targetPosition,
          easeProgress
        );
        camera.lookAt(target.x, target.y, target.z);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsMoving(false);
          onTargetReached();
        }
      };

      animate();
    }
  }, [target, camera, isMoving, onTargetReached]);

  return null;
}

// Composant principal du Canvas
export function PersonalUniverseCanvas({
  objects,
  positions,
  scales,
  selectedObject,
  interactionMode,
  cameraTarget,
  onObjectSelect,
  onObjectMove,
  onCameraTargetReached,
}) {
  const orbitControlsRef = useRef();
  const [isInteracting, setIsInteracting] = useState(false);

  const handleInteractionStart = () => {
    setIsInteracting(true);
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
  };

  return (
    <Canvas
      camera={{
        position: [15, 10, 15],
        fov: 60,
        near: 0.1,
        far: 1000,
      }}
      style={{ background: "transparent" }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
    >
      {/* Éclairage */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <directionalLight
        position={[0, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Fond étoilé */}
      <Stars
        radius={300}
        depth={60}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.3}
      />

      {/* Objets 3D */}
      <Suspense fallback={null}>
        {objects.map(
          (object) =>
            positions[object.id] && (
              <DraggableObject
                key={object.id}
                object={object}
                position={positions[object.id]}
                scale={scales[object.id]}
                isSelected={selectedObject === object.id}
                interactionMode={interactionMode}
                onSelect={onObjectSelect}
                onMove={onObjectMove}
                onInteractionStart={handleInteractionStart}
                onInteractionEnd={handleInteractionEnd}
              />
            )
        )}
      </Suspense>

      {/* Contrôles de caméra */}
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      {/* Contrôleur de caméra pour le focus */}
      <CameraController
        target={cameraTarget}
        onTargetReached={onCameraTargetReached}
      />

      {/* Grille de référence et limites visuelles */}
      <gridHelper args={[40, 40, "#333333", "#222222"]} position={[0, -5, 0]} />

      {/* Indicateurs de limites (cube wireframe) - Limites générales */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[50, 20, 50]} />
        <meshBasicMaterial
          color="#444444"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Zone de déplacement autorisée pour les objets (plus petite et visible) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[40, 16, 40]} />
        <meshBasicMaterial
          color="#00CFFF"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Indicateur du sol de déplacement */}
      <mesh position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial
          color="#00CFFF"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Canvas>
  );
}
