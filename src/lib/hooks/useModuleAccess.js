"use client";

import { useAuth } from "@/app/providers";
import { useLanguage } from "@/lib/LanguageContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

/**
 * Hook pour gérer l'accès aux modules en fonction du rôle et de la progression de l'utilisateur
 */
export function useModuleAccess() {
  const { user, isPremium, unlockedModules, progression } = useAuth();
  const { language } = useLanguage();

  // Ajout : personalizedPath depuis Firestore
  const [personalizedPath, setPersonalizedPath] = useState([]);

  useEffect(() => {
    const fetchPersonalizedPath = async () => {
      if (user) {
        const profileRef = doc(db, "profilesInfos", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setPersonalizedPath(
            Array.isArray(data.personalizedPath)
              ? data.personalizedPath.map(String)
              : []
          );
        }
      } else {
        setPersonalizedPath([]);
      }
    };
    fetchPersonalizedPath();
  }, [user]);

  /**
   * Vérifie si un module est accessible pour l'utilisateur
   * @param {string} moduleId - L'identifiant du module à vérifier
   * @returns {boolean} - True si le module est accessible, false sinon
   */
  const canAccessModule = (moduleId) => {
    // Premium : tout débloqué
    if (isPremium) return true;
    // Module 1 toujours accessible
    if (moduleId === "1") return true;
    // Non connecté : rien sauf module 1
    if (!user) return false;
    // PersonalizedPath : débloque le premier, puis chaque suivant si le précédent est complété
    const order = getModuleOrder();
    const idx = order.indexOf(moduleId);
    if (idx === -1) return false;
    if (idx === 0) return true;
    const prevId = order[idx - 1];
    return isModuleCompleted(prevId);
  };

  /**
   * Détermine l'ordre des modules pour l'utilisateur actuel
   * @returns {Array<string>} - Tableau des IDs de modules ordonnés pour l'utilisateur
   */
  const getModuleOrder = () => {
    if (!user) return [];
    // Utilise personalizedPath si dispo, sinon unlockedModules
    return personalizedPath.length > 0
      ? personalizedPath.map(String)
      : unlockedModules || [];
  };

  /**
   * Vérifie si un module est complété
   * @param {string} moduleId - L'identifiant du module à vérifier
   * @returns {boolean} - True si le module est complété, false sinon
   */
  const isModuleCompleted = (moduleId) => {
    if (!user || !progression || !progression[moduleId]) return false;

    const moduleProgress = progression[moduleId];

    // Un module est considéré comme complété si le pourcentage est de 100%
    return moduleProgress.percentage === 100;
  };

  /**
   * Récupère le prochain module à débloquer
   * @returns {string|null} - L'ID du prochain module à débloquer ou null si tous sont débloqués
   */
  const getNextModuleToUnlock = () => {
    if (isPremium) return null; // Les utilisateurs premium ont déjà tout débloqué
    if (!user || !unlockedModules) return null;

    // Logique pour déterminer le prochain module à débloquer
    // Cette logique dépend de l'implémentation spécifique de l'application

    // Exemple: récupérer l'ordre des modules et trouver le premier non débloqué
    const moduleOrder = getModuleOrder();
    const nextModule = moduleOrder.find(
      (moduleId) => !unlockedModules.includes(moduleId)
    );

    return nextModule || null;
  };

  /**
   * Génère un message explicatif sur l'accès au module
   * @param {string} moduleId - L'identifiant du module
   * @param {boolean} isLocked - Indique si le module est verrouillé
   * @returns {string} - Message explicatif
   */
  const getModuleAccessMessage = (moduleId, isLocked) => {
    if (!isLocked) return "";

    // Le module 1 (la Terre) est accessible à tous - cette condition ne devrait jamais être atteinte
    if (moduleId === "1") return "";

    if (!user) {
      return language === "fr"
        ? "Connectez-vous pour accéder à ce module"
        : "Sign in to access this module";
    }

    if (!isPremium) {
      const previousModuleId = getPreviousModule(moduleId);
      if (previousModuleId && !isModuleCompleted(previousModuleId)) {
        return language === "fr"
          ? `Terminez le module précédent pour débloquer celui-ci`
          : `Complete the previous module to unlock this one`;
      }

      return language === "fr"
        ? "Passez à Premium pour accéder à tous les modules"
        : "Upgrade to Premium to access all modules";
    }

    return "";
  };

  /**
   * Récupère l'ID du module précédent dans l'ordre de l'utilisateur
   * @param {string} moduleId - L'ID du module actuel
   * @returns {string|null} - L'ID du module précédent ou null s'il n'y en a pas
   */
  const getPreviousModule = (moduleId) => {
    const moduleOrder = getModuleOrder();
    const currentIndex = moduleOrder.indexOf(moduleId);

    if (currentIndex <= 0) return null;
    return moduleOrder[currentIndex - 1];
  };

  return {
    canAccessModule,
    getModuleOrder,
    isModuleCompleted,
    getNextModuleToUnlock,
    getModuleAccessMessage,
    getPreviousModule,
  };
}
