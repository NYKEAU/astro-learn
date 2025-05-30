"use client";

import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { check3DModelExists, get3DModelURL } from "@/lib/firebase/storage";
import { getAllModulesProgress } from "@/lib/firebase/progress";

// Mapping des modules vers leurs modèles 3D associés
const MODULE_TO_MODEL_MAPPING = {
  1: "earth", // Module Terre -> Modèle Terre
  2: "sun", // Module Soleil -> Modèle Soleil
  3: "jupiter", // Module Jupiter -> Modèle Jupiter
  4: "planets", // Module Système Solaire -> Modèle Système Solaire
  5: "star", // Module Étoiles -> Modèle Étoile
  6: "nebula", // Module Nébuleuses -> Modèle Nébuleuse
};

// Modèles 3D disponibles avec leurs métadonnées
const AVAILABLE_MODELS = {
  earth: {
    id: "earth",
    name: { fr: "Terre", en: "Earth" },
    type: "planet",
    moduleId: "1",
    modelURL: null,
    thumbnail: "/images/models/earth-thumb.jpg",
    description: {
      fr: "Notre planète bleue, berceau de la vie",
      en: "Our blue planet, cradle of life",
    },
  },
  sun: {
    id: "sun",
    name: { fr: "Soleil", en: "Sun" },
    type: "star",
    moduleId: "2",
    modelURL: null,
    thumbnail: "/images/models/sun-thumb.jpg",
    description: {
      fr: "Notre étoile, source de vie et de lumière",
      en: "Our star, source of life and light",
    },
  },
  jupiter: {
    id: "jupiter",
    name: { fr: "Jupiter", en: "Jupiter" },
    type: "planet",
    moduleId: "3",
    modelURL: null,
    thumbnail: "/images/models/jupiter-thumb.jpg",
    description: {
      fr: "La géante gazeuse du système solaire",
      en: "The gas giant of the solar system",
    },
  },
  planets: {
    id: "planets",
    name: { fr: "Système Solaire", en: "Solar System" },
    type: "system",
    moduleId: "4",
    modelURL: null,
    thumbnail: "/images/models/solar-system-thumb.jpg",
    description: {
      fr: "Notre système solaire complet",
      en: "Our complete solar system",
    },
  },
  star: {
    id: "star",
    name: { fr: "Étoile", en: "Star" },
    type: "star",
    moduleId: "5",
    modelURL: null,
    thumbnail: "/images/models/star-thumb.jpg",
    description: {
      fr: "Une étoile brillante dans l'espace",
      en: "A bright star in space",
    },
  },
  nebula: {
    id: "nebula",
    name: { fr: "Nébuleuse", en: "Nebula" },
    type: "nebula",
    moduleId: "6",
    modelURL: null,
    thumbnail: "/images/models/nebula-thumb.jpg",
    description: {
      fr: "Nuage cosmique de gaz et de poussières",
      en: "Cosmic cloud of gas and dust",
    },
  },
};

export function useUnlockedModels(userId) {
  const [unlockedModels, setUnlockedModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      // Si pas d'utilisateur, retourner un modèle de base pour la démo
      setUnlockedModels([AVAILABLE_MODELS.earth]);
      setLoading(false);
      return;
    }

    const fetchCompletedModules = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(
          "🔍 Récupération des modules complétés pour l'utilisateur:",
          userId
        );

        // Utiliser la nouvelle fonction pour récupérer toute la progression
        const allProgress = await getAllModulesProgress(userId);

        const completedModuleIds = [];
        const unlockedModelsList = [];

        // Analyser chaque module
        Object.entries(allProgress).forEach(([moduleId, progressData]) => {
          console.log(`📊 Progression module ${moduleId}:`, progressData);

          // Vérifier si le module est complété avec la nouvelle structure
          let isCompleted = false;

          // Méthode 1: Vérifier le champ 'completed'
          if (progressData.completed === true) {
            isCompleted = true;
          }
          // Méthode 2: Vérifier le pourcentage (>= 80% considéré comme complété)
          else if (progressData.percentage && progressData.percentage >= 80) {
            isCompleted = true;
          }
          // Méthode 3: Vérifier l'ancien format pour la compatibilité
          else if (progressData.finished === true) {
            isCompleted = true;
          } else if (
            progressData.globalScore &&
            progressData.globalScore >= 80
          ) {
            isCompleted = true;
          }

          if (isCompleted) {
            console.log(`✅ Module ${moduleId} complété`);
            completedModuleIds.push(moduleId);

            // Récupérer le modèle 3D associé à ce module
            const modelId = MODULE_TO_MODEL_MAPPING[moduleId];
            if (modelId && AVAILABLE_MODELS[modelId]) {
              unlockedModelsList.push(AVAILABLE_MODELS[modelId]);
            }
          } else {
            console.log(
              `⏳ Module ${moduleId} en cours (${
                progressData.percentage || 0
              }%)`
            );
          }
        });

        console.log("🎯 Modules complétés:", completedModuleIds);
        console.log(
          "🎨 Modèles 3D débloqués:",
          unlockedModelsList.map((m) => m.id)
        );

        // Si aucun module complété, donner le modèle de base (Terre)
        if (unlockedModelsList.length === 0) {
          console.log(
            "🎁 Aucun module complété, attribution du modèle de base"
          );
          setUnlockedModels([AVAILABLE_MODELS.earth]);
        } else {
          // Charger les URLs des modèles 3D depuis Firebase Storage
          const modelsWithURLs = await Promise.all(
            unlockedModelsList.map(async (model) => {
              try {
                const modelExists = await check3DModelExists(model.moduleId);
                if (modelExists) {
                  const modelURL = await get3DModelURL(model.moduleId);
                  return { ...model, modelURL };
                }
                return model;
              } catch (error) {
                console.warn(
                  `⚠️ Erreur lors du chargement du modèle ${model.id}:`,
                  error
                );
                return model;
              }
            })
          );

          setUnlockedModels(modelsWithURLs);
        }
      } catch (err) {
        console.error(
          "❌ Erreur lors de la récupération des modules complétés:",
          err
        );
        setError(err);

        // En cas d'erreur, donner le modèle de base
        setUnlockedModels([AVAILABLE_MODELS.earth]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedModules();
  }, [userId]);

  // Fonction pour débloquer un nouveau modèle (appelée quand un module est complété)
  const unlockModel = async (moduleId) => {
    if (!userId || !MODULE_TO_MODEL_MAPPING[moduleId]) return false;

    try {
      const modelId = MODULE_TO_MODEL_MAPPING[moduleId];
      const newModel = AVAILABLE_MODELS[modelId];

      if (!newModel) return false;

      // Vérifier si le modèle n'est pas déjà débloqué
      const isAlreadyUnlocked = unlockedModels.some(
        (model) => model.id === modelId
      );
      if (isAlreadyUnlocked) return true;

      // Charger l'URL du modèle 3D
      try {
        const modelExists = await check3DModelExists(moduleId);
        if (modelExists) {
          const modelURL = await get3DModelURL(moduleId);
          newModel.modelURL = modelURL;
        }
      } catch (error) {
        console.warn(
          `⚠️ Erreur lors du chargement du modèle ${modelId}:`,
          error
        );
      }

      // Mettre à jour l'état local
      setUnlockedModels((prev) => [...prev, newModel]);

      console.log(
        `🎉 Nouveau modèle débloqué: ${modelId} pour le module ${moduleId}`
      );
      return true;
    } catch (err) {
      console.error("❌ Erreur lors du débloquage du modèle:", err);
      return false;
    }
  };

  return {
    unlockedModels,
    loading,
    error,
    unlockModel,
    availableModels: AVAILABLE_MODELS,
    moduleToModelMapping: MODULE_TO_MODEL_MAPPING,
  };
}
