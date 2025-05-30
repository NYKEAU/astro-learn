"use client";

import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLanguage } from "@/lib/LanguageContext";
import { PersonalUniverseCanvas } from "@/components/universe/PersonalUniverseCanvas";
import { ObjectPanel } from "@/components/universe/ObjectPanel";
import { UniverseControls } from "@/components/universe/UniverseControls";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SpaceBackground } from "@/components/universe/SpaceBackground";
import { useUnlockedModels } from "@/lib/hooks/useUnlockedModels";
import { useModuleCompletion } from "@/lib/hooks/useModuleCompletion";
import {
  savePersonalUniverse,
  loadPersonalUniverse,
} from "@/lib/firebase/storage";
import Link from "next/link";
import { ModelUnlockNotification } from "@/components/universe/ModelUnlockNotification";

export default function UniversePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { unlockedModels, loading } = useUnlockedModels(user?.uid);

  // Surveiller automatiquement les modules complétés
  useModuleCompletion(user?.uid);

  const [selectedObject, setSelectedObject] = useState(null);
  const [objectPositions, setObjectPositions] = useState({});
  const [objectScales, setObjectScales] = useState({});
  const [previousStates, setPreviousStates] = useState({});
  const [cameraTarget, setCameraTarget] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [interactionMode, setInteractionMode] = useState("move"); // 'move' ou 'scale'

  // Initialiser les positions des objets
  useEffect(() => {
    const loadUniverseData = async () => {
      if (unlockedModels.length > 0 && user?.uid) {
        console.log("🎯 Tentative de chargement de l'univers sauvegardé");

        try {
          // Essayer de charger l'univers sauvegardé
          const savedUniverse = await loadPersonalUniverse(user.uid);

          if (savedUniverse && Array.isArray(savedUniverse)) {
            console.log("📂 Univers sauvegardé trouvé:", savedUniverse);

            // Restaurer les positions et scales depuis la sauvegarde
            const positions = {};
            const scales = {};
            const previousStatesData = {};

            savedUniverse.forEach((objectData) => {
              // Trouver le modèle correspondant par moduleId
              const matchingModel = unlockedModels.find(
                (model) => (model.moduleId || model.id) === objectData.id
              );

              if (matchingModel && objectData.position) {
                const modelId = matchingModel.id;

                positions[modelId] = {
                  x: objectData.position[0] || 0,
                  y: objectData.position[1] || 0,
                  z: objectData.position[2] || 0,
                };

                scales[modelId] = objectData.scale || 1.0;

                // Restaurer previousPosition si disponible
                if (objectData.previousPosition) {
                  previousStatesData[modelId] = {
                    position: {
                      x: objectData.previousPosition[0] || 0,
                      y: objectData.previousPosition[1] || 0,
                      z: objectData.previousPosition[2] || 0,
                    },
                    scale: objectData.scale || 1.0,
                  };
                }
              }
            });

            setObjectPositions(positions);
            setObjectScales(scales);
            setPreviousStates(previousStatesData);

            console.log("✅ Univers chargé:", {
              positions,
              scales,
              previousStatesData,
            });
          } else {
            // Pas de sauvegarde trouvée, utiliser les positions par défaut
            console.log(
              "📝 Aucune sauvegarde trouvée, initialisation par défaut"
            );
            initializeDefaultPositions();
          }
        } catch (error) {
          console.error("❌ Erreur lors du chargement de l'univers:", error);
          // En cas d'erreur, utiliser les positions par défaut
          initializeDefaultPositions();
        }
      }
    };

    const initializeDefaultPositions = () => {
      console.log("🎯 Initialisation des positions par défaut");

      const initialPositions = {};
      const initialScales = {};

      unlockedModels.forEach((model, index) => {
        if (!model || !model.id) {
          console.warn("⚠️ Modèle invalide détecté:", model);
          return;
        }

        const angle = (index / unlockedModels.length) * Math.PI * 2;
        const radius = 8;
        const position = {
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius,
        };

        // Vérifier que la position calculée est valide
        if (
          isFinite(position.x) &&
          isFinite(position.y) &&
          isFinite(position.z)
        ) {
          initialPositions[model.id] = position;
          initialScales[model.id] = 1.0;
          console.log(`📍 Position initiale pour ${model.id}:`, position);
        } else {
          console.error(
            `❌ Position invalide calculée pour ${model.id}:`,
            position
          );
          // Position de fallback
          initialPositions[model.id] = { x: 0, y: 0, z: index * 3 };
          initialScales[model.id] = 1.0;
        }
      });

      if (Object.keys(initialPositions).length > 0) {
        setObjectPositions(initialPositions);
        setObjectScales(initialScales);
        console.log("✅ Positions par défaut définies:", initialPositions);
      }
    };

    // Lancer le chargement seulement si on a des modèles et un utilisateur
    if (
      unlockedModels.length > 0 &&
      user?.uid &&
      Object.keys(objectPositions).length === 0
    ) {
      loadUniverseData();
    }
  }, [unlockedModels, user?.uid, objectPositions]);

  const handleObjectSelect = (objectId) => {
    setSelectedObject(objectId);
    setInteractionMode("move"); // Reset au mode déplacement par défaut
    if (objectPositions[objectId]) {
      setCameraTarget(objectPositions[objectId]);
    }
  };

  const handleObjectMove = (objectId, newPosition) => {
    // Vérifier que la nouvelle position est valide avec des vérifications plus robustes
    if (
      !newPosition ||
      typeof newPosition.x !== "number" ||
      typeof newPosition.y !== "number" ||
      typeof newPosition.z !== "number" ||
      isNaN(newPosition.x) ||
      isNaN(newPosition.y) ||
      isNaN(newPosition.z) ||
      !isFinite(newPosition.x) ||
      !isFinite(newPosition.y) ||
      !isFinite(newPosition.z)
    ) {
      console.warn(`⚠️ Position invalide pour ${objectId}:`, newPosition);
      return;
    }

    // Sauvegarder l'état précédent avant le changement
    const currentPosition = objectPositions[objectId];
    const currentScale = objectScales[objectId] || 1.0;

    if (currentPosition && !previousStates[objectId]) {
      setPreviousStates((prev) => ({
        ...prev,
        [objectId]: {
          position: { ...currentPosition },
          scale: currentScale,
        },
      }));
    }

    const roundedPosition = {
      x: Math.round(newPosition.x * 100) / 100, // Arrondir à 2 décimales
      y: Math.round(newPosition.y * 100) / 100,
      z: Math.round(newPosition.z * 100) / 100,
    };

    setObjectPositions((prev) => ({
      ...prev,
      [objectId]: roundedPosition,
    }));
  };

  // Handler pour changer de mode d'interaction
  const handleModeChange = (mode) => {
    setInteractionMode(mode);
  };

  // Handler pour le scale
  const handleObjectScale = (objectId, newScale) => {
    // Sauvegarder l'état précédent si ce n'est pas déjà fait
    const currentPosition = objectPositions[objectId];
    const currentScale = objectScales[objectId] || 1.0;

    if (!previousStates[objectId]) {
      setPreviousStates((prev) => ({
        ...prev,
        [objectId]: {
          position: currentPosition
            ? { ...currentPosition }
            : { x: 0, y: 0, z: 0 },
          scale: currentScale,
        },
      }));
    }

    setObjectScales((prev) => ({
      ...prev,
      [objectId]: Math.round(newScale * 10) / 10, // Arrondir à 1 décimale
    }));
  };

  // Handler pour annuler les changements
  const handleUndo = (objectId) => {
    const previousState = previousStates[objectId];
    if (!previousState) {
      setSaveMessage({
        type: "error",
        text:
          language === "fr"
            ? "Aucun état précédent à restaurer"
            : "No previous state to restore",
      });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    // Restaurer la position et le scale précédents
    if (previousState.position) {
      setObjectPositions((prev) => ({
        ...prev,
        [objectId]: { ...previousState.position },
      }));
    }

    if (previousState.scale !== undefined) {
      setObjectScales((prev) => ({
        ...prev,
        [objectId]: previousState.scale,
      }));
    }

    // Supprimer l'état précédent après restauration
    setPreviousStates((prev) => {
      const newState = { ...prev };
      delete newState[objectId];
      return newState;
    });

    setSaveMessage({
      type: "success",
      text:
        language === "fr"
          ? "État précédent restauré"
          : "Previous state restored",
    });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleResetUniverse = () => {
    console.log("🔄 Réinitialisation de l'univers");

    const resetPositions = {};
    unlockedModels.forEach((model, index) => {
      const angle = (index / unlockedModels.length) * Math.PI * 2;
      const radius = 8;
      resetPositions[model.id] = {
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius,
      };
    });

    console.log("📍 Nouvelles positions:", resetPositions);
    setObjectPositions(resetPositions);
    setSelectedObject(null);
    setCameraTarget(null);
  };

  const handleFocusObject = (objectId) => {
    if (objectPositions[objectId]) {
      setCameraTarget(objectPositions[objectId]);
      setSelectedObject(objectId);
    }
  };

  // Fonction pour sauvegarder l'univers
  const handleSaveUniverse = async () => {
    if (!user?.uid) {
      setSaveMessage({
        type: "error",
        text:
          language === "fr" ? "Utilisateur non connecté" : "User not connected",
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Préparer les données à sauvegarder
      const universeData = unlockedModels.map((model) => {
        const position = objectPositions[model.id] || { x: 0, y: 0, z: 0 };
        const scale = objectScales[model.id] || 1.0;
        const previousState = previousStates[model.id];

        return {
          id: model.moduleId || model.id, // Utiliser moduleId si disponible, sinon id
          unlocked: true, // Si dans unlockedModels, forcément débloqué
          position: [position.x, position.y, position.z],
          previousPosition: previousState?.position
            ? [
                previousState.position.x,
                previousState.position.y,
                previousState.position.z,
              ]
            : [position.x, position.y, position.z],
          scale: scale,
        };
      });

      console.log("💾 Données à sauvegarder:", universeData);

      // Sauvegarder dans Firebase Storage
      const success = await savePersonalUniverse(user.uid, universeData);

      if (success) {
        setSaveMessage({
          type: "success",
          text:
            language === "fr"
              ? "Univers sauvegardé avec succès !"
              : "Universe saved successfully!",
        });
      } else {
        setSaveMessage({
          type: "error",
          text:
            language === "fr"
              ? "Erreur lors de la sauvegarde"
              : "Error during save",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setSaveMessage({
        type: "error",
        text:
          language === "fr"
            ? "Erreur lors de la sauvegarde"
            : "Error during save",
      });
    } finally {
      setIsSaving(false);
      // Effacer le message après 3 secondes
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Composant pour le menu contextuel de l'objet sélectionné
  const ObjectContextMenu = ({ object, onModeChange, onUndo, onScale }) => {
    if (!object) return null;

    const currentScale = objectScales[object.id] || 1.0;
    const canUndo = previousStates[object.id] !== undefined;

    return (
      <div className="bg-cosmic-black/90 backdrop-blur-md border border-neon-blue/20 rounded-lg p-4 h-full overflow-y-auto">
        <div className="space-y-4">
          {/* En-tête avec nom de l'objet */}
          <div className="border-b border-neon-blue/20 pb-3">
            <h3 className="text-lg font-bold text-lunar-white font-exo">
              {language === "fr" ? "Objet sélectionné" : "Selected Object"}
            </h3>
            <p className="text-sm text-lunar-white/70 capitalize">
              {object.name?.[language] || object.name?.fr || object.id}
            </p>
          </div>

          {/* Modes d'interaction */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-lunar-white/80">
              {language === "fr" ? "Mode d'interaction" : "Interaction Mode"}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onModeChange("move")}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    interactionMode === "move"
                      ? "bg-neon-blue text-cosmic-black"
                      : "bg-cosmic-black/40 text-lunar-white hover:bg-cosmic-black/60"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                  {language === "fr" ? "Déplacer" : "Move"}
                </div>
              </button>

              <button
                onClick={() => onModeChange("scale")}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    interactionMode === "scale"
                      ? "bg-neon-blue text-cosmic-black"
                      : "bg-cosmic-black/40 text-lunar-white hover:bg-cosmic-black/60"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  {language === "fr" ? "Redimensionner" : "Scale"}
                </div>
              </button>
            </div>
          </div>

          {/* Contrôles de taille */}
          {interactionMode === "scale" && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-lunar-white/80">
                {language === "fr" ? "Taille" : "Size"}
              </h4>

              {/* Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-lunar-white/60">
                  <span>0.5x</span>
                  <span className="text-neon-blue font-medium">
                    {currentScale.toFixed(1)}x
                  </span>
                  <span>3.0x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={currentScale}
                  onChange={(e) =>
                    onScale(object.id, parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-cosmic-black/60 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Boutons +/- */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onScale(object.id, Math.max(0.5, currentScale - 0.1))
                  }
                  className="flex-1 px-3 py-2 bg-cosmic-black/40 hover:bg-cosmic-black/60 text-lunar-white rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    onScale(object.id, Math.min(3.0, currentScale + 0.1))
                  }
                  className="flex-1 px-3 py-2 bg-cosmic-black/40 hover:bg-cosmic-black/60 text-lunar-white rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Bouton Annuler */}
          <div className="pt-3 border-t border-neon-blue/20">
            <button
              onClick={() => onUndo(object.id)}
              disabled={!canUndo}
              className={`
                w-full px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${
                  canUndo
                    ? "bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30"
                    : "bg-gray-600/20 text-gray-500 cursor-not-allowed border border-gray-600/20"
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                {language === "fr" ? "Annuler" : "Undo"}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Vérifier si l'utilisateur a des modèles débloqués
  const hasUnlockedModels = unlockedModels.length > 0;

  return (
    <div className="min-h-screen bg-cosmic-black relative overflow-hidden">
      {/* Fond spatial */}
      <SpaceBackground />

      {/* En-tête */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-cosmic-black/80 backdrop-blur-md border-b border-neon-blue/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-lunar-white font-exo">
            {language === "fr"
              ? "Mon Univers Personnel"
              : "My Personal Universe"}
          </h1>

          <div className="flex items-center gap-4">
            {/* Bouton panneau mobile */}
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="md:hidden bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue p-2 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </button>

            {/* Contrôles */}
            {hasUnlockedModels && (
              <div className="flex items-center gap-3">
                {/* Bouton de sauvegarde */}
                <button
                  onClick={handleSaveUniverse}
                  disabled={isSaving}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${
                      isSaving
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-neon-blue hover:bg-neon-blue/90 text-cosmic-black hover:scale-105"
                    }
                  `}
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v4m0 8v4m8-8h-4M4 12h4"
                        />
                      </svg>
                      {language === "fr" ? "Sauvegarde..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      {language === "fr"
                        ? "Enregistrer l'univers"
                        : "Save Universe"}
                    </>
                  )}
                </button>

                <UniverseControls
                  onReset={handleResetUniverse}
                  objectCount={unlockedModels.length}
                  language={language}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {!hasUnlockedModels ? (
        // Message d'encouragement quand aucun modèle n'est débloqué
        <div className="absolute inset-0 pt-20 flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-center p-8">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-neon-blue/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-neon-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-lunar-white font-exo mb-4">
                {language === "fr"
                  ? "Votre univers vous attend !"
                  : "Your universe awaits!"}
              </h2>

              <p className="text-lg text-lunar-white/70 mb-8 leading-relaxed">
                {language === "fr"
                  ? "Terminez des modules pour débloquer vos premiers objets 3D et commencer à construire votre univers personnel. Chaque module complété vous rapproche des étoiles !"
                  : "Complete modules to unlock your first 3D objects and start building your personal universe. Each completed module brings you closer to the stars!"}
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/modules"
                className="inline-flex items-center gap-3 bg-neon-blue hover:bg-neon-blue/90 text-cosmic-black font-medium px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {language === "fr"
                  ? "Commencer l'aventure"
                  : "Start the adventure"}
              </Link>

              <div className="text-sm text-lunar-white/50">
                {language === "fr"
                  ? "Explorez les mystères de l'univers et collectionnez des objets célestes"
                  : "Explore the mysteries of the universe and collect celestial objects"}
              </div>
            </div>

            {/* Aperçu des objets à débloquer */}
            <div className="mt-12 p-6 bg-cosmic-black/40 backdrop-blur-sm rounded-xl border border-neon-blue/20">
              <h3 className="text-xl font-bold text-lunar-white font-exo mb-4">
                {language === "fr" ? "Objets à débloquer" : "Objects to unlock"}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.values(
                  unlockedModels.length > 0
                    ? {}
                    : {
                        sun: {
                          name: { fr: "Soleil", en: "Sun" },
                          type: "star",
                        },
                        jupiter: {
                          name: { fr: "Jupiter", en: "Jupiter" },
                          type: "planet",
                        },
                        planets: {
                          name: { fr: "Système Solaire", en: "Solar System" },
                          type: "system",
                        },
                        star: {
                          name: { fr: "Étoile", en: "Star" },
                          type: "star",
                        },
                        nebula: {
                          name: { fr: "Nébuleuse", en: "Nebula" },
                          type: "nebula",
                        },
                      }
                ).map((obj, index) => (
                  <div
                    key={index}
                    className="p-3 bg-cosmic-black/60 rounded-lg border border-neon-blue/10 text-center"
                  >
                    <div className="w-8 h-8 mx-auto mb-2 bg-neon-blue/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-neon-blue"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <div className="text-xs text-lunar-white/70">
                      {obj.name[language] || obj.name.fr}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Interface normale avec les modèles 3D
        <>
          {/* Canvas 3D */}
          <div className="absolute inset-0 pt-20">
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              }
            >
              <PersonalUniverseCanvas
                objects={unlockedModels}
                positions={objectPositions}
                scales={objectScales}
                selectedObject={selectedObject}
                interactionMode={interactionMode}
                cameraTarget={cameraTarget}
                onObjectSelect={handleObjectSelect}
                onObjectMove={handleObjectMove}
                onCameraTargetReached={() => setCameraTarget(null)}
              />
            </Suspense>
          </div>

          {/* Panneau latéral desktop */}
          <div className="hidden md:block absolute top-20 right-0 bottom-0 w-80 z-10">
            {selectedObject ? (
              <ObjectContextMenu
                object={unlockedModels.find(
                  (model) => model.id === selectedObject
                )}
                onModeChange={handleModeChange}
                onUndo={handleUndo}
                onScale={handleObjectScale}
              />
            ) : (
              <ObjectPanel
                objects={unlockedModels}
                selectedObject={selectedObject}
                onObjectSelect={handleFocusObject}
                language={language}
              />
            )}
          </div>

          {/* Panneau mobile */}
          {showPanel && (
            <div className="md:hidden absolute inset-0 z-30 bg-cosmic-black/95 backdrop-blur-md pt-20">
              {selectedObject ? (
                <ObjectContextMenu
                  object={unlockedModels.find(
                    (model) => model.id === selectedObject
                  )}
                  onModeChange={handleModeChange}
                  onUndo={handleUndo}
                  onScale={handleObjectScale}
                />
              ) : (
                <ObjectPanel
                  objects={unlockedModels}
                  selectedObject={selectedObject}
                  onObjectSelect={(objectId) => {
                    handleFocusObject(objectId);
                    setShowPanel(false);
                  }}
                  language={language}
                  isMobile={true}
                />
              )}
            </div>
          )}

          {/* Instructions flottantes */}
          <div className="absolute bottom-4 left-4 right-4 md:right-84 z-10">
            <div className="bg-cosmic-black/80 backdrop-blur-md border border-neon-blue/20 rounded-lg p-4">
              <div className="space-y-2">
                <p className="text-lunar-white/70 text-sm text-center">
                  {language === "fr"
                    ? "Cliquez sur un objet pour le sélectionner"
                    : "Click on an object to select it"}
                </p>
                <p className="text-lunar-white/70 text-xs text-center">
                  {language === "fr"
                    ? "Utilisez les flèches colorées pour déplacer l'objet sélectionné • Rouge: X • Vert: Y • Bleu: Z"
                    : "Use colored arrows to move the selected object • Red: X • Green: Y • Blue: Z"}
                </p>
                <p className="text-lunar-white/50 text-xs text-center">
                  {language === "fr"
                    ? "Clic gauche: pivoter la vue • Molette: zoomer • Clic droit: déplacer la caméra"
                    : "Left click: rotate view • Scroll: zoom • Right click: pan camera"}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Notifications de débloquage */}
      <ModelUnlockNotification />

      {/* Toast de sauvegarde */}
      {saveMessage && (
        <div
          className={`
          fixed bottom-4 right-4 z-30 px-6 py-3 rounded-lg shadow-lg backdrop-blur-md border 
          animate-in slide-in-from-right-5 duration-300
          ${
            saveMessage.type === "success"
              ? "bg-green-500/90 border-green-400 text-white"
              : "bg-red-500/90 border-red-400 text-white"
          }
        `}
        >
          <div className="flex items-center gap-2">
            {saveMessage.type === "success" ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="font-medium">{saveMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
