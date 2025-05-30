import { storage } from "./config";
import {
  ref,
  getDownloadURL,
  listAll,
  uploadBytes,
  getBytes,
} from "firebase/storage";

/**
 * Vérifie si un modèle 3D existe pour un module donné
 * @param {string} moduleId - L'ID du module
 * @returns {Promise<boolean>} - True si le modèle existe, false sinon
 */
export async function check3DModelExists(moduleId) {
  try {
    // Essayer d'abord .glb puis .gltf
    const extensions = ["glb", "gltf"];

    for (const ext of extensions) {
      try {
        const modelRef = ref(storage, `models/${moduleId}.${ext}`);
        await getDownloadURL(modelRef);
        return true;
      } catch (error) {
        if (error.code !== "storage/object-not-found") {
          console.warn(
            `Erreur lors de la vérification du modèle 3D ${moduleId}.${ext}:`,
            error
          );
        }
        // Continue avec l'extension suivante
      }
    }

    return false;
  } catch (error) {
    console.warn(
      `Erreur lors de la vérification du modèle 3D pour le module ${moduleId}:`,
      error
    );
    return false;
  }
}

/**
 * Récupère l'URL de téléchargement d'un modèle 3D directement depuis Firebase
 * @param {string} moduleId - L'ID du module
 * @returns {Promise<string|null>} - L'URL du modèle ou null si non trouvé
 */
export async function get3DModelURL(moduleId) {
  try {
    // Essayer d'abord .glb puis .gltf
    const extensions = ["glb", "gltf"];

    for (const ext of extensions) {
      try {
        const modelRef = ref(storage, `models/${moduleId}.${ext}`);
        const firebaseUrl = await getDownloadURL(modelRef);

        console.log(`🔄 URL Firebase directe: ${firebaseUrl}`);

        // Retourner directement l'URL Firebase (avec CORS activé)
        return firebaseUrl;
      } catch (error) {
        if (error.code !== "storage/object-not-found") {
          console.warn(
            `Erreur lors de la récupération du modèle 3D ${moduleId}.${ext}:`,
            error
          );
        }
        // Continue avec l'extension suivante
      }
    }

    return null;
  } catch (error) {
    console.warn(
      `Impossible de récupérer l'URL du modèle 3D pour le module ${moduleId}:`,
      error
    );
    return null;
  }
}

/**
 * Liste tous les modèles 3D disponibles
 * @returns {Promise<string[]>} - Liste des IDs de modules ayant un modèle 3D
 */
export async function listAvailable3DModels() {
  try {
    const modelsRef = ref(storage, "models/");
    const result = await listAll(modelsRef);

    // Extraire les IDs des modules à partir des noms de fichiers
    const moduleIds = result.items
      .filter(
        (item) => item.name.endsWith(".gltf") || item.name.endsWith(".glb")
      )
      .map((item) => item.name.replace(/\.(gltf|glb)$/, ""));

    // Supprimer les doublons (au cas où il y aurait .gltf ET .glb pour le même module)
    return [...new Set(moduleIds)];
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la liste des modèles 3D:",
      error
    );
    return [];
  }
}

/**
 * Sauvegarde l'univers personnel de l'utilisateur dans Firebase Storage
 * @param {string} userId - L'ID de l'utilisateur
 * @param {Array} universeData - Les données de l'univers à sauvegarder
 * @returns {Promise<boolean>} - True si succès, false si échec
 */
export async function savePersonalUniverse(userId, universeData) {
  try {
    console.log("💾 Sauvegarde de l'univers pour l'utilisateur:", userId);
    console.log("📦 Données à sauvegarder:", universeData);

    // Créer la référence du fichier
    const universeRef = ref(storage, `users/${userId}/universe.json`);

    // Sérialiser les données en JSON
    const jsonData = JSON.stringify(universeData, null, 2);
    const jsonBlob = new Blob([jsonData], { type: "application/json" });

    // Upload vers Firebase Storage
    await uploadBytes(universeRef, jsonBlob);

    console.log("✅ Univers sauvegardé avec succès!");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde de l'univers:", error);
    return false;
  }
}

/**
 * Charge l'univers personnel de l'utilisateur depuis Firebase Storage
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {Promise<Array|null>} - Les données de l'univers ou null si non trouvé
 */
export async function loadPersonalUniverse(userId) {
  try {
    console.log("📂 Chargement de l'univers pour l'utilisateur:", userId);

    // Créer la référence du fichier
    const universeRef = ref(storage, `users/${userId}/universe.json`);

    // Télécharger le fichier
    const arrayBuffer = await getBytes(universeRef);
    const jsonString = new TextDecoder().decode(arrayBuffer);
    const universeData = JSON.parse(jsonString);

    console.log("✅ Univers chargé avec succès:", universeData);
    return universeData;
  } catch (error) {
    if (error.code === "storage/object-not-found") {
      console.log("📝 Aucun univers sauvegardé trouvé pour cet utilisateur");
      return null;
    }

    console.error("❌ Erreur lors du chargement de l'univers:", error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur a un univers sauvegardé
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {Promise<boolean>} - True si l'univers existe, false sinon
 */
export async function hasPersonalUniverse(userId) {
  try {
    const universeRef = ref(storage, `users/${userId}/universe.json`);
    await getDownloadURL(universeRef);
    return true;
  } catch (error) {
    return false;
  }
}
