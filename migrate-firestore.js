const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Vérifiez que le fichier de clé de service existe
if (!fs.existsSync("./serviceAccountKey.json")) {
  console.error("Erreur: Le fichier serviceAccountKey.json est manquant.");
  console.log("Veuillez télécharger votre clé de service Firebase depuis:");
  console.log(
    "Firebase Console > Projet > Paramètres > Comptes de service > Générer une nouvelle clé privée"
  );
  console.log(
    'Et placez le fichier dans le répertoire racine sous le nom "serviceAccountKey.json"'
  );
  process.exit(1);
}

// Initialiser l'application Firebase Admin
try {
  const serviceAccount = require("./serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin SDK initialisé avec succès");
} catch (error) {
  console.error("Erreur lors de l'initialisation de Firebase Admin:", error);
  process.exit(1);
}

const db = admin.firestore();

// Fonction utilitaire pour extraire un titre de question
function extractQuestionTitle(content) {
  if (!content || typeof content !== "string") return `Question`;

  const maxLength = 60;
  let title = content;

  const questionMatch = content.match(/^[^?]+\?/);
  if (questionMatch) {
    title = questionMatch[0].trim();
  } else {
    const firstSentenceMatch = content.match(/^[^.!?]+[.!?]/);
    if (firstSentenceMatch) {
      title = firstSentenceMatch[0].trim();
    }
  }

  if (title.length > maxLength) {
    title = title.substring(0, maxLength) + "...";
  }

  return title;
}

// Fonction pour détecter le type de question
function detectQuestionType(content) {
  if (!content || typeof content !== "string") return "text";

  if (content.includes("[QCM]") || /^\d+\)/.test(content)) {
    return "qcm";
  } else if (content.includes("[___]") || content.includes("...")) {
    return "fill";
  } else {
    return "text";
  }
}

async function migrateModules() {
  console.log("Début de la migration des modules...");

  try {
    // Récupérer tous les modules
    const modulesSnapshot = await db.collection("modules").get();

    if (modulesSnapshot.empty) {
      console.log("Aucun module trouvé dans la base de données.");
      return;
    }

    console.log(`Nombre de modules trouvés: ${modulesSnapshot.size}`);

    let moduleCount = 0;

    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleData = moduleDoc.data();
      const moduleId = moduleDoc.id;

      console.log(
        `\nTraitement du module ${moduleId}: ${
          moduleData.title || "Sans titre"
        }`
      );

      // Créer un nouvel objet pour le module restructuré
      const newModuleData = {
        title: moduleData.title || "",
        titleEn: moduleData.titleEn || "",
        description: moduleData.description || "",
        descriptionEn: moduleData.descriptionEn || "",
        image: moduleData.image || "",
        imageUrl: moduleData.imageUrl || "",
        bgColor: moduleData.bgColor || "",
        level: moduleData.level || "",
        levelEn: moduleData.levelEn || "",
        tags: moduleData.tags || [],
        shortDesc: moduleData.shortDesc || "",
      };

      // Références pour les collections
      const moduleRef = db.collection("modules").doc(moduleId);
      const partsRef = moduleRef.collection("parts");

      // Extraire et regrouper les parties et les questions
      const parts = {};
      const partTitles = {};

      // Extraire d'abord les titres des parties
      Object.entries(moduleData).forEach(([key, value]) => {
        if (key.match(/^part\d+$/) && !key.includes(".")) {
          const partNumber = key.replace("part", "");
          partTitles[partNumber] = value;
          console.log(`  Titre de la partie ${partNumber}: ${value}`);
        }
      });

      console.log("  Extraction des questions par partie...");

      // Ensuite, extraire les questions et les regrouper par partie
      Object.entries(moduleData).forEach(([key, value]) => {
        // Vérifier si c'est un champ partX.Y (une question)
        if (key.match(/^part\d+\.\d+$/)) {
          const [partKey, questionNumber] = key.split(".");
          const partNumber = partKey.replace("part", "");

          // Initialiser la partie si elle n'existe pas encore
          if (!parts[partNumber]) {
            parts[partNumber] = {
              title: partTitles[partNumber] || `Partie ${partNumber}`,
              order: parseInt(partNumber),
              exercises: [],
            };
          }

          const questionType = detectQuestionType(value);
          const questionTitle = extractQuestionTitle(value);

          // Ajouter la question (considérée comme exercice pour l'instant)
          parts[partNumber].exercises.push({
            id: `ex${questionNumber}`,
            title: questionTitle,
            content: value,
            type: questionType,
            order: parseInt(questionNumber),
          });

          console.log(
            `    Question ${partNumber}.${questionNumber} - Type: ${questionType}`
          );
        }
      });

      // Vérifier qu'il y a des parties à migrer
      if (Object.keys(parts).length === 0) {
        console.log("  Aucune partie ou question trouvée pour ce module.");
        continue;
      }

      console.log(
        `  Nombre de parties identifiées: ${Object.keys(parts).length}`
      );

      // Mettre à jour le document du module avec les nouvelles données
      console.log("  Mise à jour du document principal du module...");
      await moduleRef.set(newModuleData);

      // Écrire chaque partie avec ses exercices
      for (const [partNumber, partData] of Object.entries(parts)) {
        console.log(`  Création de la partie ${partNumber}: ${partData.title}`);
        const partRef = partsRef.doc(`part${partNumber}`);

        // Écrire les infos de la partie
        await partRef.set({
          title: partData.title,
          order: partData.order,
        });

        if (partData.exercises && partData.exercises.length > 0) {
          console.log(`    Ajout de ${partData.exercises.length} exercices...`);

          // Écrire les exercices
          const exercisesRef = partRef.collection("exercises");
          for (const exercise of partData.exercises) {
            await exercisesRef.doc(exercise.id).set({
              title: exercise.title,
              content: exercise.content,
              type: exercise.type,
              order: exercise.order,
            });
          }
        }

        // Créer une collection vide pour les leçons avec une leçon de base
        console.log(
          "    Création de la collection de leçons avec une leçon de départ..."
        );
        const lessonsRef = partRef.collection("lessons");
        await lessonsRef.doc("lesson1").set({
          title: `Leçon 1: ${partData.title}`,
          content: "Contenu à ajouter",
          order: 1,
        });
      }

      moduleCount++;
      console.log(`Module ${moduleId} migré avec succès.`);
    }

    console.log(
      `\nMigration terminée: ${moduleCount} modules migrés avec succès!`
    );
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
  }
}

// Fonction pour valider la migration
async function validateMigration() {
  console.log("\nValidation de la migration...");

  try {
    // Récupérer tous les modules
    const modulesSnapshot = await db.collection("modules").get();

    if (modulesSnapshot.empty) {
      console.log("Aucun module trouvé pour la validation.");
      return;
    }

    let totalParts = 0;
    let totalLessons = 0;
    let totalExercises = 0;

    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleId = moduleDoc.id;
      console.log(`\nValidation du module ${moduleId}:`);

      // Vérifier les parties
      const partsRef = db
        .collection("modules")
        .doc(moduleId)
        .collection("parts");
      const partsSnapshot = await partsRef.get();

      if (partsSnapshot.empty) {
        console.log(`  Aucune partie trouvée pour le module ${moduleId}.`);
        continue;
      }

      console.log(`  Nombre de parties: ${partsSnapshot.size}`);
      totalParts += partsSnapshot.size;

      // Parcourir chaque partie
      for (const partDoc of partsSnapshot.docs) {
        const partId = partDoc.id;
        const partData = partDoc.data();

        console.log(
          `  Partie ${partId}: ${partData.title || "Sans titre"} (ordre: ${
            partData.order || 0
          })`
        );

        // Vérifier les leçons de cette partie
        const lessonsRef = partsRef.doc(partId).collection("lessons");
        const lessonsSnapshot = await lessonsRef.get();

        console.log(`    Nombre de leçons: ${lessonsSnapshot.size}`);
        totalLessons += lessonsSnapshot.size;

        // Vérifier les exercices de cette partie
        const exercisesRef = partsRef.doc(partId).collection("exercises");
        const exercisesSnapshot = await exercisesRef.get();

        console.log(`    Nombre d'exercices: ${exercisesSnapshot.size}`);
        totalExercises += exercisesSnapshot.size;

        // Ajouter un contenu par défaut si aucune leçon n'existe
        if (lessonsSnapshot.empty) {
          console.log(
            `    Ajout d'une leçon par défaut pour la partie ${partId}`
          );

          await lessonsRef.doc("lesson1").set({
            title: `Leçon 1: ${
              partData.title || `Partie ${partId.replace("part", "")}`
            }`,
            content: `<h2>Contenu à venir pour ${
              partData.title || `Partie ${partId.replace("part", "")}`
            }</h2><p>Cette section est en cours de développement.</p>`,
            order: 1,
          });

          totalLessons++;
        }
      }
    }

    console.log("\nRésumé de la validation:");
    console.log(`Nombre total de modules: ${modulesSnapshot.size}`);
    console.log(`Nombre total de parties: ${totalParts}`);
    console.log(`Nombre total de leçons: ${totalLessons}`);
    console.log(`Nombre total d'exercices: ${totalExercises}`);

    console.log("\nValidation terminée avec succès!");
  } catch (error) {
    console.error("Erreur lors de la validation:", error);
  }
}

// Exécuter la migration puis la validation
migrateModules()
  .then(() => {
    console.log("Migration terminée. Lancement de la validation...");
    return validateMigration();
  })
  .then(() => {
    console.log("Script de migration et validation terminés.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
