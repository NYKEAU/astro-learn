"use client";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { db, auth, isProduction } from "./config.js";

/**
 * Structure de progression recommandée dans Firestore:
 * users/{userId}/progress/{moduleId}
 * {
 *   moduleId: string,
 *   parts: {
 *     part1: {
 *       ex1: { userAnswer: string, isCorrect: boolean, timestamp: string },
 *       ex2: { userAnswer: string, isCorrect: boolean, timestamp: string }
 *     },
 *     part2: {
 *       ex3: { userAnswer: string, isCorrect: boolean, timestamp: string }
 *     }
 *   },
 *   completedExercises: ["ex1", "ex2", "ex3"],
 *   totalExercises: number,
 *   score: number,
 *   percentage: number,
 *   completed: boolean,
 *   startedAt: timestamp,
 *   lastUpdated: timestamp,
 *   completedAt: timestamp | null
 * }
 */

// Fonction de logging conditionnelle
const debugLog = (...args) => {
  if (!isProduction) {
    console.log(...args);
  }
};

/**
 * Initialise la progression d'un module pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} moduleId - ID du module
 * @param {number} totalExercises - Nombre total d'exercices dans le module
 * @returns {Promise<boolean>} - true si initialisé avec succès
 */
export async function initializeModuleProgress(
  userId,
  moduleId,
  totalExercises = 0
) {
  if (!userId || !moduleId) {
    debugLog("❌ Erreur: userId ou moduleId manquant");
    return false;
  }

  try {
    const progressRef = doc(db, `users/${userId}/progress/${moduleId}`);
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      const existingData = progressDoc.data();
      if (existingData.parts && typeof existingData.parts === "object") {
        debugLog(`📊 Progression du module ${moduleId} déjà initialisée`);
        return true;
      }
    }

    const initialProgress = {
      moduleId: moduleId,
      parts: {},
      completedExercises: [],
      totalExercises: totalExercises,
      score: 0,
      percentage: 0,
      completed: false,
      lastUpdated: new Date().toISOString(),
    };

    await setDoc(progressRef, initialProgress);
    debugLog(`✅ Progression du module ${moduleId} initialisée`);
    return true;
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation de la progression:",
      error
    );
    return false;
  }
}

/**
 * Nettoie et corrige la structure de progression si nécessaire
 * @param {Object} progressData - Données de progression à nettoyer
 * @returns {Object} - Données nettoyées
 */
function cleanProgressData(progressData) {
  if (!progressData) return null;

  // Si la structure contient des clés numériques (ancienne structure)
  const hasNumericKeys = Object.keys(progressData).some((key) => !isNaN(key));

  if (hasNumericKeys) {
    console.log("🧹 Nettoyage de l'ancienne structure détectée");

    // Extraire les données utiles de l'ancienne structure
    const cleanedData = {
      moduleId: progressData.moduleId || progressData["1"]?.moduleId || "1",
      parts: progressData.parts || {},
      completedExercises: progressData.completedExercises || [],
      totalExercises: progressData.totalExercises || 0,
      score: progressData.score || 0,
      percentage: progressData.percentage || 0,
      completed: progressData.completed || false,
      startedAt: progressData.startedAt || new Date().toISOString(),
      lastUpdated: progressData.lastUpdated || new Date().toISOString(),
      completedAt: progressData.completedAt || null,
    };

    // S'assurer que parts existe
    if (!cleanedData.parts || typeof cleanedData.parts !== "object") {
      cleanedData.parts = {};
    }

    // S'assurer que completedExercises est un tableau
    if (!Array.isArray(cleanedData.completedExercises)) {
      cleanedData.completedExercises = [];
    }

    console.log("✅ Structure nettoyée:", cleanedData);
    return cleanedData;
  }

  // Structure déjà correcte, juste s'assurer que tous les champs existent
  return {
    moduleId: progressData.moduleId,
    parts: progressData.parts || {},
    completedExercises: progressData.completedExercises || [],
    totalExercises: progressData.totalExercises || 0,
    score: progressData.score || 0,
    percentage: progressData.percentage || 0,
    completed: progressData.completed || false,
    startedAt: progressData.startedAt,
    lastUpdated: progressData.lastUpdated,
    completedAt: progressData.completedAt || null,
  };
}

/**
 * Sauvegarde la réponse d'un exercice
 * @param {string} userId - ID de l'utilisateur
 * @param {string} moduleId - ID du module
 * @param {string} partId - ID de la partie (ex: "part1")
 * @param {string} exerciseId - ID de l'exercice (ex: "ex1")
 * @param {string} userAnswer - Réponse de l'utilisateur
 * @param {boolean} isCorrect - Si la réponse est correcte
 * @param {number} totalExercisesInModule - Nombre total d'exercices dans le module (optionnel)
 * @returns {Promise<Object|null>} - Progression mise à jour ou null en cas d'erreur
 */
export async function saveExerciseAnswer(
  userId,
  moduleId,
  partId,
  exerciseId,
  userAnswer,
  isCorrect,
  totalExercisesInModule = null
) {
  if (!userId || !moduleId || !partId || !exerciseId) {
    console.error("❌ saveExerciseAnswer: Tous les paramètres sont requis");
    return null;
  }

  try {
    console.log(
      `🔍 Sauvegarde exercice: userId=${userId}, moduleId=${moduleId}, partId=${partId}, exerciseId=${exerciseId}`
    );
    console.log(
      `📊 Total exercices dans le module: ${
        totalExercisesInModule || "non spécifié"
      }`
    );

    const progressRef = doc(db, "users", userId, "progress", moduleId);

    // Récupérer la progression actuelle
    const progressDoc = await getDoc(progressRef);
    let rawProgressData = progressDoc.exists() ? progressDoc.data() : null;

    console.log(`📊 Progression brute:`, rawProgressData);

    // Nettoyer la structure si nécessaire
    let progressData = cleanProgressData(rawProgressData);

    // Initialiser si nécessaire
    if (!progressData) {
      console.log(`🔧 Initialisation du module ${moduleId}`);
      await initializeModuleProgress(userId, moduleId);
      const newProgressDoc = await getDoc(progressRef);
      rawProgressData = newProgressDoc.data();
      progressData = cleanProgressData(rawProgressData);
      console.log(`📊 Progression après initialisation:`, progressData);
    }

    // S'assurer que progressData.parts existe
    if (!progressData.parts) {
      console.log(`🔧 Initialisation de progressData.parts`);
      progressData.parts = {};
    }

    // S'assurer que les autres champs existent
    if (!progressData.completedExercises) {
      progressData.completedExercises = [];
    }
    if (typeof progressData.score !== "number") {
      progressData.score = 0;
    }

    // Préparer les données de l'exercice
    const exerciseData = {
      userAnswer,
      isCorrect,
      timestamp: new Date().toISOString(),
    };

    // Vérifier si c'est une nouvelle réponse ou une modification
    const wasAnsweredBefore =
      progressData.parts[partId] && progressData.parts[partId][exerciseId];
    const wasCorrectBefore =
      wasAnsweredBefore && progressData.parts[partId][exerciseId].isCorrect;

    console.log(
      `🔍 Exercice ${exerciseId}: wasAnsweredBefore=${wasAnsweredBefore}, wasCorrectBefore=${wasCorrectBefore}`
    );

    // Mettre à jour la structure des parties
    const updatedParts = {
      ...progressData.parts,
      [partId]: {
        ...progressData.parts[partId],
        [exerciseId]: exerciseData,
      },
    };

    // Mettre à jour la liste des exercices complétés
    const completedExercises = [...progressData.completedExercises];
    if (!wasAnsweredBefore && !completedExercises.includes(exerciseId)) {
      completedExercises.push(exerciseId);
    }

    // Calculer le nouveau score
    let newScore = progressData.score || 0;

    if (!wasAnsweredBefore) {
      // Nouvelle réponse
      if (isCorrect) {
        newScore += 1;
      }
    } else {
      // Modification d'une réponse existante
      if (isCorrect && !wasCorrectBefore) {
        newScore += 1; // Passage de faux à vrai
      } else if (!isCorrect && wasCorrectBefore) {
        newScore -= 1; // Passage de vrai à faux
      }
    }

    // Calculer le nombre total d'exercices
    let totalExercises;
    if (totalExercisesInModule !== null) {
      // Utiliser le nombre fourni par l'appelant (le vrai nombre d'exercices)
      totalExercises = totalExercisesInModule;
      console.log(`📊 Utilisation du nombre total fourni: ${totalExercises}`);
    } else {
      // Fallback vers l'ancien calcul
      totalExercises = Math.max(
        completedExercises.length,
        progressData.totalExercises || 0
      );
      console.log(`📊 Utilisation du calcul par défaut: ${totalExercises}`);
    }

    const percentage =
      totalExercises > 0 ? Math.round((newScore / totalExercises) * 100) : 0;
    const isModuleCompleted = percentage >= 80; // 80% requis pour compléter

    console.log(
      `📊 Calculs: newScore=${newScore}, totalExercises=${totalExercises}, percentage=${percentage}%`
    );

    // Préparer les données de mise à jour (structure propre)
    const updateData = {
      moduleId: moduleId,
      parts: updatedParts,
      completedExercises,
      totalExercises,
      score: newScore,
      percentage,
      completed: isModuleCompleted,
      lastUpdated: serverTimestamp(),
    };

    // Ajouter les champs manquants s'ils n'existent pas
    if (!progressData.startedAt) {
      updateData.startedAt = serverTimestamp();
    }

    // Ajouter completedAt si le module vient d'être complété
    if (isModuleCompleted && !progressData.completed) {
      updateData.completedAt = serverTimestamp();
      console.log(`🎉 Module ${moduleId} complété avec ${percentage}% !`);
    }

    // Sauvegarder dans Firestore avec setDoc pour écraser complètement l'ancienne structure
    try {
      console.log("🔄 Tentative de sauvegarde avec setDoc...");
      console.log("📄 Document ref:", progressRef.path);
      console.log("📊 Données à sauvegarder:", updateData);

      await setDoc(progressRef, updateData);

      console.log("✅ setDoc réussi !");

      // Vérification immédiate pour s'assurer que les données ont été sauvegardées
      const verificationDoc = await getDoc(progressRef);
      if (verificationDoc.exists()) {
        console.log("✅ Vérification: Document existe bien dans Firestore");
        console.log("📊 Données vérifiées:", verificationDoc.data());
      } else {
        console.error(
          "❌ Vérification: Document n'existe pas après sauvegarde !"
        );
      }
    } catch (firestoreError) {
      console.error("❌ Erreur setDoc:", firestoreError);
      console.error("❌ Code d'erreur:", firestoreError.code);
      console.error("❌ Message d'erreur:", firestoreError.message);
      throw firestoreError; // Re-lancer l'erreur pour qu'elle soit capturée par le catch principal
    }

    console.log(
      `💾 Exercice ${exerciseId} sauvegardé: ${
        isCorrect ? "✅" : "❌"
      } (Score: ${newScore}/${totalExercises})`
    );

    // Retourner la progression mise à jour
    return {
      ...updateData,
      // Convertir les timestamps pour la cohérence
      lastUpdated: new Date().toISOString(),
      completedAt: updateData.completedAt
        ? new Date().toISOString()
        : progressData.completedAt,
      startedAt: updateData.startedAt
        ? new Date().toISOString()
        : progressData.startedAt,
    };
  } catch (error) {
    console.error(
      `❌ Erreur lors de la sauvegarde de l'exercice ${exerciseId}:`,
      error
    );
    return null;
  }
}

/**
 * Récupère la progression d'un module
 * @param {string} userId - ID de l'utilisateur
 * @param {string} moduleId - ID du module
 * @returns {Promise<Object|null>} - Données de progression ou null
 */
export async function getModuleProgress(userId, moduleId) {
  if (!userId || !moduleId) {
    console.error("❌ getModuleProgress: userId et moduleId requis");
    return null;
  }

  try {
    const progressRef = doc(db, "users", userId, "progress", moduleId);
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      const data = progressDoc.data();
      console.log(`📊 Progression du module ${moduleId} récupérée:`, data);
      return data;
    } else {
      console.log(`📭 Aucune progression trouvée pour le module ${moduleId}`);
      return null;
    }
  } catch (error) {
    console.error(
      `❌ Erreur lors de la récupération du module ${moduleId}:`,
      error
    );
    return null;
  }
}

/**
 * Récupère la réponse d'un exercice spécifique
 * @param {string} userId - ID de l'utilisateur
 * @param {string} moduleId - ID du module
 * @param {string} partId - ID de la partie
 * @param {string} exerciseId - ID de l'exercice
 * @returns {Promise<Object|null>} - Données de l'exercice ou null
 */
export async function getExerciseAnswer(userId, moduleId, partId, exerciseId) {
  const progressData = await getModuleProgress(userId, moduleId);

  if (
    progressData &&
    progressData.parts[partId] &&
    progressData.parts[partId][exerciseId]
  ) {
    return progressData.parts[partId][exerciseId];
  }

  return null;
}

/**
 * Récupère toutes les réponses d'une partie
 * @param {string} userId - ID de l'utilisateur
 * @param {string} moduleId - ID du module
 * @param {string} partId - ID de la partie
 * @returns {Promise<Object|null>} - Réponses de la partie ou null
 */
export async function getPartAnswers(userId, moduleId, partId) {
  const progressData = await getModuleProgress(userId, moduleId);

  if (progressData && progressData.parts[partId]) {
    return progressData.parts[partId];
  }

  return null;
}

/**
 * Marque un module comme complété manuellement
 * @param {string} userId - ID de l'utilisateur
 * @param {string} moduleId - ID du module
 * @param {number} finalScore - Score final (optionnel)
 * @returns {Promise<boolean>} - Succès de l'opération
 */
export async function markModuleCompleted(userId, moduleId, finalScore = null) {
  if (!userId || !moduleId) {
    console.error("❌ markModuleCompleted: userId et moduleId requis");
    return false;
  }

  try {
    const progressRef = doc(db, "users", userId, "progress", moduleId);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      console.error(`❌ Aucune progression trouvée pour le module ${moduleId}`);
      return false;
    }

    const progressData = progressDoc.data();
    const updateData = {
      completed: true,
      percentage: 100,
      lastUpdated: serverTimestamp(),
      completedAt: serverTimestamp(),
    };

    if (finalScore !== null) {
      updateData.score = finalScore;
    }

    await updateDoc(progressRef, updateData);
    console.log(`✅ Module ${moduleId} marqué comme complété`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors du marquage du module ${moduleId}:`, error);
    return false;
  }
}

/**
 * Récupère la progression de tous les modules d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Progression de tous les modules
 */
export async function getAllModulesProgress(userId) {
  if (!userId) {
    console.error("❌ getAllModulesProgress: userId requis");
    return {};
  }

  try {
    const allProgress = {};

    // Récupérer la progression des modules 1 à 6
    for (let moduleId = 1; moduleId <= 6; moduleId++) {
      const progress = await getModuleProgress(userId, moduleId.toString());
      if (progress) {
        allProgress[moduleId.toString()] = progress;
      }
    }

    console.log(`📊 Progression de tous les modules récupérée:`, allProgress);
    return allProgress;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de tous les modules:",
      error
    );
    return {};
  }
}

/**
 * Utilitaire pour valider la structure de progression
 * @param {Object} progressData - Données de progression à valider
 * @returns {boolean} - True si la structure est valide
 */
export function validateProgressStructure(progressData) {
  if (!progressData || typeof progressData !== "object") {
    return false;
  }

  const requiredFields = [
    "moduleId",
    "parts",
    "completedExercises",
    "score",
    "percentage",
    "completed",
  ];

  for (const field of requiredFields) {
    if (!(field in progressData)) {
      console.warn(`⚠️ Champ manquant dans la progression: ${field}`);
      return false;
    }
  }

  // Vérifier que parts est un objet
  if (typeof progressData.parts !== "object") {
    console.warn("⚠️ Le champ 'parts' doit être un objet");
    return false;
  }

  // Vérifier que completedExercises est un tableau
  if (!Array.isArray(progressData.completedExercises)) {
    console.warn("⚠️ Le champ 'completedExercises' doit être un tableau");
    return false;
  }

  return true;
}
