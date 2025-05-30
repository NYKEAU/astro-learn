"use client";

import { useAuth } from "@/app/providers";
import { useLanguage } from "@/lib/LanguageContext";

/**
 * Hook pour gérer l'accès aux modules en fonction du rôle et de la progression de l'utilisateur
 */
export function useModuleAccess() {
    const { user, isPremium, unlockedModules, progression } = useAuth();
    const { language } = useLanguage();

    /**
     * Vérifie si un module est accessible pour l'utilisateur
     * @param {string} moduleId - L'identifiant du module à vérifier
     * @returns {boolean} - True si le module est accessible, false sinon
     */
    const canAccessModule = (moduleId) => {
        // Les utilisateurs premium ont accès à tous les modules
        if (isPremium) return true;

        // Si l'utilisateur n'est pas connecté, il n'a accès à aucun module
        if (!user) return false;

        // Vérifier si le module est dans la liste des modules débloqués
        return unlockedModules?.includes(moduleId) || false;
    };

    /**
     * Détermine l'ordre des modules pour l'utilisateur actuel
     * @returns {Array<string>} - Tableau des IDs de modules ordonnés pour l'utilisateur
     */
    const getModuleOrder = () => {
        if (!user) return [];

        // L'ordre est déterminé par l'IA lors de l'inscription et stocké dans les données utilisateur
        // Si pas d'ordre spécifique, retourner la liste des modules débloqués
        return unlockedModules || [];
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
        const nextModule = moduleOrder.find(moduleId => !unlockedModules.includes(moduleId));

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

        if (!user) {
            return language === 'fr'
                ? "Connectez-vous pour accéder à ce module"
                : "Sign in to access this module";
        }

        if (!isPremium) {
            const previousModuleId = getPreviousModule(moduleId);
            if (previousModuleId && !isModuleCompleted(previousModuleId)) {
                return language === 'fr'
                    ? `Terminez le module précédent pour débloquer celui-ci`
                    : `Complete the previous module to unlock this one`;
            }

            return language === 'fr'
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
        getPreviousModule
    };
} 