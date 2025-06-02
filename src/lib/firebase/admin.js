import { initializeApp, getApps, cert } from "firebase-admin/app";

/**
 * Initialise Firebase Admin SDK
 * @returns {FirebaseApp} L'instance de l'app Firebase Admin
 */
export function initFirebaseAdmin() {
  // Vérifier si une app existe déjà
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // Configuration pour production
  const config = {
    projectId: process.env.FIREBASE_PROJECT_ID || "space-learn-a2406",
  };

  // En développement ou si des credentials sont disponibles
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    config.credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "space-learn-a2406",
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }

  try {
    return initializeApp(config);
  } catch (error) {
    console.error("❌ Erreur initialisation Firebase Admin:", error);
    throw error;
  }
}
