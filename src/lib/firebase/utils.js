/**
 * Utilitaires Firebase pour vérifier et gérer l'initialisation
 */

import { getApps } from 'firebase/app';
import { db, auth } from './config';

/**
 * Vérifie si Firebase est correctement initialisé
 * @returns {boolean} true si Firebase est initialisé
 */
export const isFirebaseInitialized = () => {
    return getApps().length > 0;
};

/**
 * Vérifie si Firestore est disponible et initialisé
 * @returns {boolean} true si Firestore est initialisé
 */
export const isFirestoreAvailable = () => {
    return !!db;
};

/**
 * Vérifie si l'authentification Firebase est disponible
 * @returns {boolean} true si l'authentification est initialisée
 */
export const isAuthAvailable = () => {
    return !!auth;
};

/**
 * Retourne l'état d'initialisation de Firebase
 * @returns {Object} État d'initialisation des différents services Firebase
 */
export const getFirebaseStatus = () => {
    return {
        isInitialized: isFirebaseInitialized(),
        firestoreAvailable: isFirestoreAvailable(),
        authAvailable: isAuthAvailable()
    };
}; 