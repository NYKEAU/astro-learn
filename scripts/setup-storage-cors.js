/**
 * Script pour configurer CORS sur Firebase Storage
 * À exécuter une seule fois après le déploiement
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// Données pour CORS (sans fichier de service account en local)
const corsConfiguration = {
  cors: [
    {
      origin: ["*"],
      method: ["GET", "HEAD"],
      maxAgeSeconds: 3600,
    },
  ],
};

console.log("🔧 Configuration CORS pour Firebase Storage");
console.log("📝 Veuillez configurer CORS manuellement avec la commande :");
console.log("");
console.log(
  "gsutil cors set storage.cors.json gs://space-learn-a2406.appspot.com"
);
console.log("");
console.log("Ou dans la console Firebase :");
console.log("1. Allez dans Storage > Rules");
console.log("2. Ajoutez les règles CORS dans les métadonnées");
console.log("");
console.log("Configuration CORS recommandée :");
console.log(JSON.stringify(corsConfiguration, null, 2));

export default function setupStorageCors() {
  console.log(
    "✅ Instructions affichées. Veuillez configurer CORS manuellement."
  );
}
