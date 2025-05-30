#!/usr/bin/env node

/**
 * Script de build Firebase export cross-platform
 * Configure l'environnement et lance le build avec export statique
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔥 Building for Firebase Hosting...");

// Fonction pour renommer temporairement le dossier API
function hideApiRoutes() {
  const apiDir = path.resolve(__dirname, "..", "src", "app", "api");
  const apiBackupDir = path.resolve(__dirname, "..", "api.backup");

  if (fs.existsSync(apiDir)) {
    try {
      fs.renameSync(apiDir, apiBackupDir);
      console.log("📁 API routes temporarily hidden for static export");
      return true;
    } catch (error) {
      console.warn("⚠️ Could not hide API routes:", error.message);
      return false;
    }
  }

  console.log("📁 No API routes found");
  return false;
}

// Fonction pour restaurer le dossier API
function restoreApiRoutes(wasHidden) {
  if (!wasHidden) return;

  const apiDir = path.resolve(__dirname, "..", "src", "app", "api");
  const apiBackupDir = path.resolve(__dirname, "..", "api.backup");

  if (fs.existsSync(apiBackupDir)) {
    try {
      // Supprimer le dossier api s'il existe (ne devrait pas)
      if (fs.existsSync(apiDir)) {
        fs.rmSync(apiDir, { recursive: true, force: true });
      }

      fs.renameSync(apiBackupDir, apiDir);
      console.log("🔄 API routes restored");
    } catch (error) {
      console.error("❌ Could not restore API routes:", error.message);
      console.error(
        "⚠️ Manual restoration required: move api.backup to src/app/api"
      );
    }
  }
}

// Définir les variables d'environnement pour l'export Firebase
const env = {
  ...process.env,
  FIREBASE_EXPORT: "true",
};

// Étape 1: Cacher les routes API
console.log("📝 Hiding API routes for static export...");
const apiWasHidden = hideApiRoutes();

// Déterminer la commande selon l'OS
const isWindows = process.platform === "win32";
const nextCmd = isWindows ? "next.cmd" : "next";

// Chercher le binaire next dans node_modules
const nextPath = path.resolve(__dirname, "..", "node_modules", ".bin", nextCmd);

// Étape 2: Lancer le build Next.js avec l'export activé
const buildProcess = spawn(nextPath, ["build"], {
  env,
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
  shell: isWindows,
});

buildProcess.on("close", (code) => {
  // Étape 3: Restaurer les routes API
  console.log("🔄 Restoring API routes...");
  restoreApiRoutes(apiWasHidden);

  if (code === 0) {
    console.log("✅ Firebase build completed successfully!");
    console.log("📁 Static files exported to ./out directory");
    console.log("🚀 Ready for Firebase Hosting deployment");
  } else {
    console.error("❌ Firebase build failed with exit code:", code);
    process.exit(code);
  }
});

buildProcess.on("error", (error) => {
  console.error("❌ Failed to start build process:", error);
  console.error("Trying alternative method...");

  // Méthode alternative : utiliser npx
  const npxCmd = isWindows ? "npx.cmd" : "npx";
  const fallbackProcess = spawn(npxCmd, ["next", "build"], {
    env,
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
    shell: isWindows,
  });

  fallbackProcess.on("close", (code) => {
    // Restaurer les routes API même en cas d'erreur
    console.log("🔄 Restoring API routes...");
    restoreApiRoutes(apiWasHidden);

    if (code === 0) {
      console.log("✅ Firebase build completed successfully!");
      console.log("📁 Static files exported to ./out directory");
      console.log("🚀 Ready for Firebase Hosting deployment");
    } else {
      console.error("❌ Firebase build failed with exit code:", code);
      process.exit(code);
    }
  });

  fallbackProcess.on("error", (fallbackError) => {
    // Restaurer les routes API même en cas d'erreur
    console.log("🔄 Restoring API routes...");
    restoreApiRoutes(apiWasHidden);

    console.error("❌ All methods failed:", fallbackError);
    process.exit(1);
  });
});

// Gérer l'arrêt du processus pour nettoyer les fichiers
process.on("SIGINT", () => {
  console.log("\n🛑 Build interrupted, cleaning up...");
  restoreApiRoutes(apiWasHidden);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Build terminated, cleaning up...");
  restoreApiRoutes(apiWasHidden);
  process.exit(0);
});
