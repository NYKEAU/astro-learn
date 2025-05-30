// Import des fonctions Firebase nécessaires
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Configuration Firebase
// Remplacez ces valeurs par vos propres identifiants Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyForTesting",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "astro-learn.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "astro-learn",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "astro-learn.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:123456789012:web:abcdef1234567890",
};

// Vérifier si la configuration contient des valeurs par défaut
const isUsingDemoConfig =
  firebaseConfig.apiKey === "AIzaSyDemoKeyForTesting" ||
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.includes("demo") ||
  firebaseConfig.apiKey.includes("test");

if (isUsingDemoConfig && typeof window !== "undefined") {
  console.warn(
    "Attention: Vous utilisez des identifiants Firebase de démonstration. " +
    "Les fonctionnalités de base de données ne fonctionneront pas correctement."
  );
}

// Initialiser l'application Firebase une seule fois
let app;
let auth;
let db;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]; // Utiliser l'app déjà initialisée
  }

  // Initialiser les services Firebase
  auth = getAuth(app);

  // Si nous ne sommes pas en mode démo, initialiser Firestore
  if (!isUsingDemoConfig) {
    db = getFirestore(app);

    // Connecter aux émulateurs Firebase si en développement local
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      // Vérifier si nous sommes sur localhost
      if (window.location.hostname === "localhost") {
        // Remplacer ces ports par ceux que vous utilisez pour vos émulateurs, si vous en utilisez
        // connectAuthEmulator(auth, 'http://localhost:9099');
        // connectFirestoreEmulator(db, 'localhost', 8080);
      }
    }
  }

  // Appliquer les paramètres de persistance pour le stockage local
  // Cela ne se fait que côté client
  if (typeof window !== "undefined") {
    // Utilise browserLocalPersistence au lieu d'un objet personnalisé
    auth.setPersistence(browserLocalPersistence).catch((error) => {
      console.error("Erreur lors de la configuration de la persistance:", error);
    });
  }
} catch (error) {
  console.error("Erreur lors de l'initialisation de Firebase:", error);

  // Créer des objets vides ou mocks en cas d'erreur
  if (!app) app = { name: "firebase-error-app" };
  if (!auth) auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => { callback(null); return () => { }; },
    signOut: () => Promise.resolve()
  };
  if (!db) db = {
    collection: () => ({
      get: () => Promise.resolve({ docs: [] }),
      doc: () => ({
        get: () => Promise.resolve({ data: () => ({}) }),
        set: () => Promise.resolve()
      })
    })
  };
}

// Export des instances Firebase
export { auth, db };
export default app;
