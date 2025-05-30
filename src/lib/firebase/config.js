// Import des fonctions Firebase nécessaires
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Configuration Firebase via variables d'environnement
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialiser l'application Firebase une seule fois
let app;
let auth;
let db;
let storage;

// Optimisation performance basée sur l'environnement
let isProduction;
if (typeof window === "undefined") {
  // Côté serveur
  isProduction = process.env.NODE_ENV === "production";
} else {
  // Côté client
  isProduction = process.env.NODE_ENV === "production";
}

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]; // Utiliser l'app déjà initialisée
  }

  // Initialiser les services Firebase
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Connecter aux émulateurs Firebase si en développement local
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    // Vérifier si nous sommes sur localhost
    if (window.location.hostname === "localhost") {
      // Remplacer ces ports par ceux que vous utilisez pour vos émulateurs, si vous en utilisez
      // connectAuthEmulator(auth, 'http://localhost:9099');
      // connectFirestoreEmulator(db, 'localhost', 8080);
      // connectStorageEmulator(storage, 'localhost', 9199);
    }
  }

  // Appliquer les paramètres de persistance pour le stockage local
  // Cela ne se fait que côté client
  if (typeof window !== "undefined") {
    // Utilise browserLocalPersistence au lieu d'un objet personnalisé
    auth.setPersistence(browserLocalPersistence).catch((error) => {
      console.error(
        "Erreur lors de la configuration de la persistance:",
        error
      );
    });
  }
} catch (error) {
  console.error("Erreur lors de l'initialisation de Firebase:", error);

  // Créer des objets vides ou mocks en cas d'erreur
  if (!app) app = { name: "firebase-error-app" };
  if (!auth)
    auth = {
      currentUser: null,
      onAuthStateChanged: (callback) => {
        callback(null);
        return () => {};
      },
      signOut: () => Promise.resolve(),
    };
  if (!db)
    db = {
      collection: () => ({
        get: () => Promise.resolve({ docs: [] }),
        doc: () => ({
          get: () => Promise.resolve({ data: () => ({}) }),
          set: () => Promise.resolve(),
        }),
      }),
    };
  if (!storage)
    storage = {
      ref: () => ({
        getDownloadURL: () =>
          Promise.reject(new Error("Storage not available")),
        listAll: () => Promise.resolve({ items: [] }),
      }),
    };
}

// Export des instances Firebase
export { auth, db, storage, isProduction };
export default app;
