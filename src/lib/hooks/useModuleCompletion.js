"use client";

import { useEffect, useRef } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useUnlockedModels } from "./useUnlockedModels";

/**
 * Hook pour détecter automatiquement la completion des modules
 * et débloquer les modèles 3D correspondants
 */
export function useModuleCompletion(userId) {
  const { unlockModel } = useUnlockedModels(userId);
  const previousProgressRef = useRef({});

  useEffect(() => {
    if (!userId) return;

    console.log(
      "🔄 Initialisation de la surveillance des modules pour:",
      userId
    );

    // Écouter les changements dans la collection progress de l'utilisateur
    const unsubscribers = [];

    // Surveiller les modules principaux (1 à 6)
    for (let moduleId = 1; moduleId <= 6; moduleId++) {
      const moduleIdStr = moduleId.toString();
      const progressRef = doc(db, "users", userId, "progress", moduleIdStr);

      const unsubscribe = onSnapshot(
        progressRef,
        (doc) => {
          if (doc.exists()) {
            const progressData = doc.data();
            const previousProgress = previousProgressRef.current[moduleIdStr];

            console.log(
              `📊 Changement détecté pour le module ${moduleIdStr}:`,
              progressData
            );

            // Vérifier si le module vient d'être complété
            const isNowCompleted = checkModuleCompletion(progressData);
            const wasCompleted = previousProgress
              ? checkModuleCompletion(previousProgress)
              : false;

            if (isNowCompleted && !wasCompleted) {
              console.log(`🎉 Module ${moduleIdStr} vient d'être complété !`);

              // Débloquer le modèle 3D correspondant
              unlockModel(moduleIdStr).then((success) => {
                if (success) {
                  console.log(
                    `✨ Modèle 3D débloqué pour le module ${moduleIdStr}`
                  );

                  // Optionnel: Afficher une notification à l'utilisateur
                  if (
                    typeof window !== "undefined" &&
                    window.showModuleCompletionNotification
                  ) {
                    window.showModuleCompletionNotification(moduleIdStr);
                  }
                } else {
                  console.warn(
                    `⚠️ Échec du débloquage du modèle pour le module ${moduleIdStr}`
                  );
                }
              });
            }

            // Mettre à jour la référence précédente
            previousProgressRef.current[moduleIdStr] = progressData;
          }
        },
        (error) => {
          console.error(
            `❌ Erreur lors de l'écoute du module ${moduleIdStr}:`,
            error
          );
        }
      );

      unsubscribers.push(unsubscribe);
    }

    // Nettoyer les listeners lors du démontage
    return () => {
      console.log("🧹 Nettoyage des listeners de progression");
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [userId, unlockModel]);

  return null; // Ce hook ne retourne rien, il agit en arrière-plan
}

/**
 * Fonction utilitaire pour vérifier si un module est complété
 * @param {Object} progressData - Les données de progression du module
 * @returns {boolean} - True si le module est complété
 */
function checkModuleCompletion(progressData) {
  if (!progressData) return false;

  // Méthode 1: Vérifier le champ 'completed' (nouvelle structure)
  if (progressData.completed === true) {
    return true;
  }

  // Méthode 2: Vérifier le pourcentage (>= 80% considéré comme complété)
  if (progressData.percentage && progressData.percentage >= 80) {
    return true;
  }

  // Méthodes de compatibilité avec l'ancienne structure
  // Méthode 3: Vérifier le champ 'finished'
  if (progressData.finished === true) {
    return true;
  }

  // Méthode 4: Vérifier le score global (>= 80% considéré comme complété)
  if (progressData.globalScore && progressData.globalScore >= 80) {
    return true;
  }

  // Méthode 5: Vérifier si toutes les parties sont terminées (ancienne structure)
  if (progressData.parts && Array.isArray(progressData.parts)) {
    const allPartsFinished = progressData.parts.every(
      (part) => part.finished === true
    );
    if (allPartsFinished && progressData.parts.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Fonction utilitaire pour marquer un module comme complété
 * (à utiliser dans les composants d'exercices/leçons)
 */
export async function markModuleAsCompleted(userId, moduleId, score = 100) {
  if (!userId || !moduleId) return false;

  try {
    const progressRef = doc(
      db,
      "users",
      userId,
      "progress",
      moduleId.toString()
    );

    await setDoc(
      progressRef,
      {
        moduleId: moduleId.toString(),
        finished: true,
        globalScore: score,
        completedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(
      `✅ Module ${moduleId} marqué comme complété avec un score de ${score}%`
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Erreur lors du marquage du module ${moduleId} comme complété:`,
      error
    );
    return false;
  }
}
