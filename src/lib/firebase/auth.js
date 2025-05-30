"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";

// Fournisseur Google
const googleProvider = new GoogleAuthProvider();

/**
 * Se connecter avec Google via Firebase Authentication en utilisant une redirection
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Vérifier si l'utilisateur existe déjà dans Firestore
    const userDoc = await getDoc(doc(db, "users", result.user.uid));

    // Si l'utilisateur n'existe pas, créer un nouveau document utilisateur
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role: "free", // Par défaut, les nouveaux utilisateurs ont un rôle gratuit
        unlockedModules: [], // Aucun module débloqué initialement
        progression: {}, // Progression vide initialement
        createdAt: new Date(),
      });
    }

    return { user: result.user, error: null };
  } catch (error) {
    console.error("Erreur lors de la connexion avec Google:", error);
    return { user: null, error: error.message };
  }
};

/**
 * Récupère le résultat de l'authentification après une redirection
 */
export const getGoogleAuthResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    console.error("Error getting redirect result", error);
    throw error;
  }
};

/**
 * S'inscrire avec Google et enregistrer les données du formulaire
 */
export const signUpWithGoogle = async (formData) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Enregistrer les données du formulaire dans Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      formData: formData,
      role: "free", // Par défaut, les nouveaux utilisateurs ont un rôle gratuit
      unlockedModules: [], // Aucun module débloqué initialement
      progression: {}, // Progression vide initialement
      createdAt: new Date(),
    });

    return user;
  } catch (error) {
    console.error("Erreur lors de l'inscription avec Google:", error);
    throw error;
  }
};

/**
 * Se déconnecter de Firebase Authentication
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Observer les changements d'état d'authentification et enrichir avec les données utilisateur
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Récupérer les données utilisateur depuis Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          // Combiner les données d'authentification avec les données Firestore
          const userData = userDoc.data();
          const enhancedUser = {
            ...user,
            role: userData.role || "free",
            premiumUntil: userData.premiumUntil || null,
            unlockedModules: userData.unlockedModules || [],
            progression: userData.progression || {},
            formData: userData.formData || {},
          };

          callback(enhancedUser);
        } else {
          // Si aucun document utilisateur n'existe, créer un nouveau
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: "free",
            unlockedModules: [],
            progression: {},
            createdAt: new Date(),
          });

          const enhancedUser = {
            ...user,
            role: "free",
            premiumUntil: null,
            unlockedModules: [],
            progression: {},
          };

          callback(enhancedUser);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
        callback(user); // Retourne l'utilisateur sans données enrichies en cas d'erreur
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Obtenir l'utilisateur actuel
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Fonction pour vérifier si l'utilisateur est connecté
export const isUserLoggedIn = () => {
  return !!auth.currentUser;
};

/**
 * Mise à jour du rôle utilisateur vers premium
 */
export const upgradeToPremiun = async (userId, expiryDate) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      role: "premium",
      premiumUntil: expiryDate,
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à niveau vers premium:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Déverrouiller un module pour un utilisateur
 */
export const unlockModule = async (userId, moduleId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const unlockedModules = userData.unlockedModules || [];

      // Ajouter le module s'il n'est pas déjà déverrouillé
      if (!unlockedModules.includes(moduleId)) {
        await setDoc(userRef, {
          unlockedModules: [...unlockedModules, moduleId]
        }, { merge: true });
      }

      return { success: true };
    }

    return { success: false, error: "Utilisateur non trouvé" };
  } catch (error) {
    console.error("Erreur lors du déverrouillage du module:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Mettre à jour la progression d'un utilisateur sur un module
 */
export const updateModuleProgression = async (userId, moduleId, progressionData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      progression: {
        [moduleId]: progressionData
      }
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression:", error);
    return { success: false, error: error.message };
  }
};

export { auth, db };
