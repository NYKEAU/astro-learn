const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialiser Firebase Admin
const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
  });
}

const db = admin.firestore();

// Configuration de la migration
const MIGRATION_CONFIG = {
  backupDir: path.join(__dirname, "..", "migration-backups"),
  dryRun: process.argv.includes("--dry-run"),
  step: process.argv.find((arg) => arg.startsWith("--step="))?.split("=")[1],
  rollback: process.argv.includes("--rollback"),
  verbose: process.argv.includes("--verbose"),
};

// Utilitaires de logging
function log(message, level = "info") {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: "📝",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    debug: "🔍",
  }[level];

  console.log(`${prefix} [${timestamp}] ${message}`);
}

function debugLog(message) {
  if (MIGRATION_CONFIG.verbose) {
    log(message, "debug");
  }
}

// Fonction de sauvegarde
async function createBackup() {
  log("Création du backup avant migration...");

  if (!fs.existsSync(MIGRATION_CONFIG.backupDir)) {
    fs.mkdirSync(MIGRATION_CONFIG.backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    MIGRATION_CONFIG.backupDir,
    `backup-${timestamp}.json`
  );

  // Exporter toutes les collections
  const collections = await db.listCollections();
  const backup = {
    timestamp,
    projectId: serviceAccount.project_id,
    collections: {},
  };

  for (const collection of collections) {
    const snapshot = await collection.get();
    backup.collections[collection.id] = [];

    snapshot.forEach((doc) => {
      backup.collections[collection.id].push({
        id: doc.id,
        data: doc.data(),
      });
    });

    log(
      `Backup collection ${collection.id}: ${
        backup.collections[collection.id].length
      } documents`
    );
  }

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  log(`Backup créé: ${backupPath}`, "success");

  return backupPath;
}

// Migration des modules
async function migrateModules() {
  log("🔄 Migration des modules...");

  const modulesSnapshot = await db.collection("modules").get();
  const migratedModules = [];

  for (const doc of modulesSnapshot.docs) {
    const oldData = doc.data();
    debugLog(`Migration du module ${doc.id}: ${oldData.title}`);

    // Nouveau schéma pour les modules
    const newModule = {
      id: oldData.id || doc.id,
      title: oldData.title || "",
      description: oldData.description || "",
      tags: oldData.tags || [],
      metadata: {
        level: oldData.level || "beginner",
        imageUrl: oldData.imageUrl || "",
        bgColor: oldData.bgColor || "#1a1a2e",
      },
      parts: [
        {
          id: "1",
          title: "Introduction",
          lessons: [
            {
              id: "1",
              title: "Leçon principale",
              content: {
                easy: oldData.easyDesc || oldData.EasyDesc || "",
                intermediate: oldData.interDesc || oldData.InterDesc || "",
                advanced: oldData.hardDesc || oldData.HardDesc || "",
              },
              type: "text",
            },
          ],
          exercises: [
            {
              id: "1",
              title: "Quiz de compréhension",
              type: "quiz",
              maxScore: 10,
              questions: [], // À remplir plus tard
            },
          ],
        },
      ],
    };

    migratedModules.push({ id: doc.id, data: newModule });
    debugLog(`Module ${doc.id} migré avec succès`);
  }

  // Écriture des nouveaux modules
  if (!MIGRATION_CONFIG.dryRun) {
    const batch = db.batch();

    for (const module of migratedModules) {
      const moduleRef = db.collection("modules").doc(module.id);
      batch.set(moduleRef, module.data);
    }

    await batch.commit();
    log(`${migratedModules.length} modules migrés avec succès`, "success");
  } else {
    log(
      `[DRY RUN] ${migratedModules.length} modules seraient migrés`,
      "warning"
    );
  }

  return migratedModules;
}

// Migration des utilisateurs
async function migrateUsers() {
  log("🔄 Migration des utilisateurs...");

  // Récupérer les données existantes
  const [usersSnapshot, profilesSnapshot, userModulesSnapshot] =
    await Promise.all([
      db.collection("users").get(),
      db.collection("profilesInfos").get(),
      db.collection("usersModules").get(),
    ]);

  // Créer des maps pour faciliter les jointures
  const profilesMap = new Map();
  profilesSnapshot.forEach((doc) => {
    profilesMap.set(doc.id, doc.data());
  });

  const userModulesMap = new Map();
  userModulesSnapshot.forEach((doc) => {
    userModulesMap.set(doc.id, doc.data());
  });

  const migratedUsers = [];

  for (const userDoc of usersSnapshot.docs) {
    const oldUserData = userDoc.data();
    debugLog(`Migration de l'utilisateur ${userDoc.id}`);

    // Trouver le profil associé
    let profileData = null;
    if (oldUserData.infosId) {
      const profileId = oldUserData.infosId.path.split("/")[1];
      profileData = profilesMap.get(profileId);
    }

    // Trouver les modules associés
    let modulesData = null;
    if (oldUserData.modulesId) {
      const modulesId = oldUserData.modulesId.path.split("/")[1];
      modulesData = userModulesMap.get(modulesId);
    }

    // Nouveau schéma utilisateur
    const newUser = {
      profile: {
        firstName: profileData?.firstName || "Utilisateur",
        age: profileData?.age || 18,
        educationLevel: profileData?.educationLevel || "undergraduate",
        knowledgeLevel: profileData?.knowledgeLevel || "intermediate",
        learningPreference: profileData?.learningPreference || "videos",
        interests: profileData?.interests || [],
        knownSubjects: profileData?.knownSubjects || [],
        learningGoals: profileData?.learningGoals || [],
        usedApps: profileData?.usedApps || false,
      },
      stats: {
        totalTimeSpent: 0,
        modulesCompleted: 0,
        averageScore: 0,
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    migratedUsers.push({
      id: userDoc.id,
      data: newUser,
      modulesData: modulesData,
    });

    debugLog(`Utilisateur ${userDoc.id} migré avec succès`);
  }

  // Écriture des nouveaux utilisateurs
  if (!MIGRATION_CONFIG.dryRun) {
    const batch = db.batch();

    for (const user of migratedUsers) {
      const userRef = db.collection("users").doc(user.id);
      batch.set(userRef, user.data);
    }

    await batch.commit();
    log(`${migratedUsers.length} utilisateurs migrés avec succès`, "success");
  } else {
    log(
      `[DRY RUN] ${migratedUsers.length} utilisateurs seraient migrés`,
      "warning"
    );
  }

  return migratedUsers;
}

// Migration de la progression
async function migrateProgress(migratedUsers) {
  log("🔄 Migration de la progression...");

  let totalProgressDocs = 0;

  for (const user of migratedUsers) {
    if (!user.modulesData) continue;

    debugLog(`Migration progression pour utilisateur ${user.id}`);

    // Convertir les données de modules en progression
    const moduleIds = Object.keys(user.modulesData).filter(
      (key) => !isNaN(key)
    );

    for (const moduleId of moduleIds) {
      const moduleProgress = user.modulesData[moduleId];

      // Déterminer le format des données (array vs object)
      let progress = 0;
      let difficulty = "intermediate";

      if (Array.isArray(moduleProgress)) {
        // Format ancien: ["1", "25"] ou ["3", "50"]
        progress = parseInt(moduleProgress[1]) || 0;
        difficulty =
          ["easy", "intermediate", "advanced"][
            parseInt(moduleProgress[0]) - 1
          ] || "intermediate";
      } else if (typeof moduleProgress === "object") {
        // Format nouveau: {"difficulty": "3", "progress": "0"}
        progress = parseInt(moduleProgress.progress) || 0;
        difficulty =
          ["easy", "intermediate", "advanced"][
            parseInt(moduleProgress.difficulty) - 1
          ] || "intermediate";
      }

      const progressDoc = {
        moduleId: moduleId,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        finished: progress >= 100,
        globalScore: Math.min(progress, 100),
        currentPosition: {
          partId: "1",
          lessonId: "1",
          exerciseId: null,
        },
        parts: [
          {
            id: "1",
            finished: progress >= 100,
            lessons: [{ id: "1", done: progress >= 100 }],
            exercises: [
              {
                id: "1",
                done: progress >= 100,
                score: progress >= 100 ? 10 : 0,
                maxScore: 10,
              },
            ],
          },
        ],
      };

      if (!MIGRATION_CONFIG.dryRun) {
        const progressRef = db
          .collection("users")
          .doc(user.id)
          .collection("progress")
          .doc(moduleId);
        await progressRef.set(progressDoc);
      }

      totalProgressDocs++;
      debugLog(
        `Progression module ${moduleId} créée pour utilisateur ${user.id}`
      );
    }
  }

  if (!MIGRATION_CONFIG.dryRun) {
    log(`${totalProgressDocs} documents de progression créés`, "success");
  } else {
    log(
      `[DRY RUN] ${totalProgressDocs} documents de progression seraient créés`,
      "warning"
    );
  }
}

// Nettoyage des anciennes collections
async function cleanupOldCollections() {
  log("🧹 Nettoyage des anciennes collections...");

  const collectionsToDelete = ["profilesInfos", "usersModules"];

  for (const collectionName of collectionsToDelete) {
    if (!MIGRATION_CONFIG.dryRun) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      log(`Collection ${collectionName} supprimée`, "success");
    } else {
      log(`[DRY RUN] Collection ${collectionName} serait supprimée`, "warning");
    }
  }
}

// Validation post-migration
async function validateMigration() {
  log("🔍 Validation de la migration...");

  const [modulesSnapshot, usersSnapshot] = await Promise.all([
    db.collection("modules").get(),
    db.collection("users").get(),
  ]);

  log(`Modules après migration: ${modulesSnapshot.size}`);
  log(`Utilisateurs après migration: ${usersSnapshot.size}`);

  // Vérifier la structure des modules
  let validModules = 0;
  modulesSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.parts && Array.isArray(data.parts) && data.parts.length > 0) {
      validModules++;
    }
  });

  log(`Modules avec structure valide: ${validModules}/${modulesSnapshot.size}`);

  // Vérifier les sous-collections de progression
  let totalProgressDocs = 0;
  for (const userDoc of usersSnapshot.docs) {
    const progressSnapshot = await userDoc.ref.collection("progress").get();
    totalProgressDocs += progressSnapshot.size;
  }

  log(`Documents de progression total: ${totalProgressDocs}`);

  if (validModules === modulesSnapshot.size && totalProgressDocs > 0) {
    log("Migration validée avec succès ! ✨", "success");
  } else {
    log("Problèmes détectés dans la migration", "error");
  }
}

// Fonction principale de migration
async function runMigration() {
  try {
    log("🚀 Début de la migration Firestore");
    log(`Mode: ${MIGRATION_CONFIG.dryRun ? "DRY RUN" : "PRODUCTION"}`);

    if (MIGRATION_CONFIG.rollback) {
      log("Rollback non implémenté dans cette version", "error");
      return;
    }

    // Créer un backup
    if (!MIGRATION_CONFIG.dryRun) {
      await createBackup();
    }

    // Migration par étapes
    const step = MIGRATION_CONFIG.step;

    if (!step || step === "modules") {
      await migrateModules();
      if (step === "modules") return;
    }

    if (!step || step === "users") {
      const migratedUsers = await migrateUsers();
      if (step === "users") return;

      if (!step || step === "progress") {
        await migrateProgress(migratedUsers);
        if (step === "progress") return;
      }
    }

    if (!step || step === "cleanup") {
      await cleanupOldCollections();
      if (step === "cleanup") return;
    }

    // Validation finale
    if (!MIGRATION_CONFIG.dryRun) {
      await validateMigration();
    }

    log("🎉 Migration terminée avec succès !", "success");
  } catch (error) {
    log(`Erreur durant la migration: ${error.message}`, "error");
    console.error(error);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
