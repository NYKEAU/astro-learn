#!/usr/bin/env node

/**
 * Script de déploiement production avec gestion CORS
 * Usage: npm run deploy:production
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import chalk from "chalk";

const log = {
  info: (msg) => console.log(chalk.blue("ℹ"), msg),
  success: (msg) => console.log(chalk.green("✅"), msg),
  warning: (msg) => console.log(chalk.yellow("⚠️"), msg),
  error: (msg) => console.log(chalk.red("❌"), msg),
};

async function deployProduction() {
  try {
    log.info("🚀 Démarrage du déploiement production...");

    // 1. Vérifier les fichiers nécessaires
    const requiredFiles = [
      "firebase.json",
      "storage.cors.json",
      "storage.rules",
      "firestore.rules",
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        log.error(`Fichier manquant: ${file}`);
        process.exit(1);
      }
    }
    log.success("Tous les fichiers de configuration sont présents");

    // 2. Build production
    log.info("📦 Construction du build production...");
    execSync("npm run build:firebase", { stdio: "inherit" });
    log.success("Build terminé avec succès");

    // 3. Déployer les règles Firestore et Storage
    log.info("🔒 Déploiement des règles de sécurité...");
    execSync("firebase deploy --only firestore:rules,storage:rules", {
      stdio: "inherit",
    });
    log.success("Règles de sécurité déployées");

    // 4. Déployer l'application
    log.info("🌐 Déploiement de l'application...");
    execSync("firebase deploy --only hosting", { stdio: "inherit" });
    log.success("Application déployée");

    // 5. Instructions CORS
    log.warning("⚠️  IMPORTANT: Configuration CORS requise");
    log.info("Veuillez configurer CORS manuellement via la Console Firebase:");
    log.info("1. Allez sur https://console.firebase.google.com/");
    log.info("2. Sélectionnez votre projet");
    log.info("3. Storage > Configuration > CORS");
    log.info("4. Appliquez le fichier storage.cors.json");

    log.info("\nOu utilisez cette commande si gsutil est configuré:");
    log.info(
      "gsutil cors set storage.cors.json gs://space-learn-a2406.firebasestorage.app"
    );

    // 6. Vérification
    log.info("\n🔍 URLs de vérification:");
    log.info("- App: https://astrolearn.nicolaslhommeau.com");
    log.info("- Firebase: https://space-learn-a2406.web.app");

    log.success("🎉 Déploiement terminé avec succès!");
  } catch (error) {
    log.error("Erreur lors du déploiement:");
    console.error(error.message);
    process.exit(1);
  }
}

deployProduction();
