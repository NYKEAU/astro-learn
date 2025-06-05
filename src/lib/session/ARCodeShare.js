"use client";

import { storage } from "@/lib/firebase/config";
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/**
 * Système de partage de codes AR via Firebase Storage
 * Les codes sont stockés dans /arcode/{code}.json
 */
export class ARCodeShare {
  constructor() {
    this.cleanup();
  }

  /**
   * Générer un code AR et le sauvegarder sur Firebase
   */
  async generateARCode(modelURL, title, moduleTitle) {
    try {
      // Générer un code unique
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Créer les données du code
      const codeData = {
        code,
        modele: this.extractModelId(modelURL), // ID du modèle (ex: "1" pour saturn_1.glb)
        modelURL,
        title,
        moduleTitle,
        timestamp: Date.now(),
        expires: Date.now() + 30 * 60 * 1000, // 30 minutes d'expiration
      };

      console.log(`🔗 Génération code AR ${code}:`, codeData);

      // Sauvegarder sur Firebase Storage
      const codeRef = ref(storage, `arcode/${code}.json`);
      await uploadString(codeRef, JSON.stringify(codeData), "raw", {
        contentType: "application/json",
      });

      console.log(`✅ Code AR ${code} sauvé sur Firebase Storage`);
      return code;
    } catch (error) {
      console.error("❌ Erreur génération code AR:", error);
      throw error;
    }
  }

  /**
   * Récupérer un code AR depuis Firebase
   */
  async getARCode(code) {
    try {
      console.log(`🔍 Recherche code AR: ${code}`);

      const codeRef = ref(storage, `arcode/${code}.json`);
      const url = await getDownloadURL(codeRef);

      // Télécharger et parser les données
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const codeData = await response.json();
      console.log(`✅ Code AR trouvé:`, codeData);

      // Vérifier l'expiration
      if (codeData.expires && codeData.expires < Date.now()) {
        console.log(`❌ Code AR ${code} expiré`);
        // Supprimer le code expiré en arrière-plan
        this.deleteARCode(code).catch(console.warn);
        return null;
      }

      return codeData;
    } catch (error) {
      console.log(`❌ Code AR ${code} non trouvé ou erreur:`, error.message);
      return null;
    }
  }

  /**
   * Supprimer un code AR
   */
  async deleteARCode(code) {
    try {
      const codeRef = ref(storage, `arcode/${code}.json`);
      await deleteObject(codeRef);
      console.log(`🗑️ Code AR ${code} supprimé`);
    } catch (error) {
      console.warn(
        `⚠️ Impossible de supprimer le code ${code}:`,
        error.message
      );
    }
  }

  /**
   * Extraire l'ID du modèle depuis l'URL
   * Ex: "/models/saturn_1.glb" → "1"
   */
  extractModelId(modelURL) {
    if (!modelURL) return "1";

    // Extraire le nom du fichier
    const filename = modelURL.split("/").pop();

    // Extraire le numéro (saturn_1.glb → 1)
    const match = filename.match(/_(\d+)\./);
    return match ? match[1] : "1";
  }

  /**
   * Générer l'URL de partage AR
   */
  generateARShareURL(code, baseURL = "") {
    const url = new URL(
      baseURL || (typeof window !== "undefined" ? window.location.origin : "")
    );
    url.pathname = `/ar/${code}`;
    return url.toString();
  }

  /**
   * Nettoyer les codes expirés (à faire périodiquement)
   * Note: Firebase Storage ne permet pas de lister facilement les fichiers côté client
   * Cette fonction sera principalement utile côté serveur
   */
  cleanup() {
    console.log("🧹 ARCodeShare cleanup démarré");
    // Programmer un nettoyage périodique si nécessaire
    // Pour l'instant, on nettoie à la demande lors de la récupération
  }
}

// Instance globale
export const arCodeShare = new ARCodeShare();
