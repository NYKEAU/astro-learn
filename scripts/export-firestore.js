const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialiser Firebase Admin avec la clé de service
const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
  });
}

const db = admin.firestore();

// Fonction pour exporter une collection
async function exportCollection(collectionName) {
  try {
    console.log(`📦 Export de la collection: ${collectionName}`);
    const snapshot = await db.collection(collectionName).get();
    const documents = [];

    snapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        data: doc.data(),
        metadata: {
          exists: doc.exists,
          createTime: doc.createTime ? doc.createTime.toDate() : null,
          updateTime: doc.updateTime ? doc.updateTime.toDate() : null,
        },
      });
    });

    console.log(
      `✅ ${documents.length} documents trouvés dans ${collectionName}`
    );
    return documents;
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'export de ${collectionName}:`,
      error.message
    );
    return [];
  }
}

// Fonction pour lister toutes les collections
async function listAllCollections() {
  try {
    const collections = await db.listCollections();
    return collections.map((col) => col.id);
  } catch (error) {
    console.error("❌ Erreur lors de la liste des collections:", error.message);
    return [];
  }
}

// Fonction pour analyser le schéma d'une collection
function analyzeSchema(collectionName, documents) {
  const schema = {
    collectionName,
    documentCount: documents.length,
    fields: {},
    sampleDocument: documents[0] || null,
  };

  documents.forEach((doc) => {
    const data = doc.data;
    Object.keys(data).forEach((field) => {
      const value = data[field];
      let type = typeof value;

      if (Array.isArray(value)) {
        type = "array";
      } else if (
        value &&
        typeof value === "object" &&
        value.constructor.name === "Timestamp"
      ) {
        type = "timestamp";
      } else if (
        value &&
        typeof value === "object" &&
        value.constructor.name === "DocumentReference"
      ) {
        type = "reference";
      } else if (
        value &&
        typeof value === "object" &&
        value.constructor.name === "GeoPoint"
      ) {
        type = "geopoint";
      } else if (value === null) {
        type = "null";
      }

      if (!schema.fields[field]) {
        schema.fields[field] = {
          type: type,
          occurrences: 0,
          sampleValues: [],
        };
      }

      schema.fields[field].occurrences++;

      // Ajouter des exemples de valeurs (max 3)
      if (schema.fields[field].sampleValues.length < 3) {
        let sampleValue = value;
        if (type === "timestamp") {
          sampleValue = value.toDate().toISOString();
        } else if (type === "reference") {
          sampleValue = value.path;
        }
        schema.fields[field].sampleValues.push(sampleValue);
      }
    });
  });

  return schema;
}

// Fonction principale d'export
async function exportFirestore() {
  console.log("🚀 Début de l'export Firestore...\n");

  // Découvrir toutes les collections
  console.log("🔍 Découverte des collections...");
  const allCollections = await listAllCollections();
  console.log(`📋 Collections trouvées: ${allCollections.join(", ")}\n`);

  const exportData = {
    exportDate: new Date().toISOString(),
    projectId: serviceAccount.project_id,
    collections: {},
    schemas: {},
    summary: {
      totalCollections: 0,
      totalDocuments: 0,
      collectionsFound: [],
    },
  };

  // Exporter chaque collection
  for (const collectionName of allCollections) {
    try {
      const documents = await exportCollection(collectionName);

      if (documents.length > 0) {
        exportData.collections[collectionName] = documents;
        exportData.schemas[collectionName] = analyzeSchema(
          collectionName,
          documents
        );
        exportData.summary.totalDocuments += documents.length;
        exportData.summary.collectionsFound.push(collectionName);
      } else {
        console.log(`⚠️  Collection ${collectionName} est vide`);
      }
    } catch (error) {
      console.log(
        `❌ Erreur avec la collection ${collectionName}:`,
        error.message
      );
    }
  }

  exportData.summary.totalCollections =
    exportData.summary.collectionsFound.length;

  // Créer le dossier exports s'il n'existe pas
  const exportsDir = path.join(__dirname, "..", "exports");
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  // Sauvegarder l'export complet
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fullExportPath = path.join(
    exportsDir,
    `firestore-export-${timestamp}.json`
  );
  fs.writeFileSync(fullExportPath, JSON.stringify(exportData, null, 2));

  // Sauvegarder uniquement les schémas pour analyse
  const schemaPath = path.join(
    exportsDir,
    `firestore-schema-${timestamp}.json`
  );
  fs.writeFileSync(
    schemaPath,
    JSON.stringify(
      {
        exportDate: exportData.exportDate,
        projectId: exportData.projectId,
        summary: exportData.summary,
        schemas: exportData.schemas,
      },
      null,
      2
    )
  );

  // Créer un rapport lisible
  const reportPath = path.join(exportsDir, `firestore-report-${timestamp}.md`);
  let report = `# Rapport d'export Firestore\n\n`;
  report += `**Date d'export:** ${exportData.exportDate}\n`;
  report += `**Projet Firebase:** ${exportData.projectId}\n`;
  report += `**Collections trouvées:** ${exportData.summary.totalCollections}\n`;
  report += `**Documents totaux:** ${exportData.summary.totalDocuments}\n\n`;

  if (exportData.summary.totalCollections === 0) {
    report += `## ⚠️ Aucune donnée trouvée\n\n`;
    report += `Toutes les collections découvertes sont vides:\n`;
    allCollections.forEach((col) => {
      report += `- ${col}\n`;
    });
    report += `\nCela peut indiquer que:\n`;
    report += `1. La base de données est effectivement vide\n`;
    report += `2. Les règles de sécurité Firestore bloquent l'accès\n`;
    report += `3. Il y a un problème d'authentification\n\n`;
  } else {
    report += `## Collections avec données\n\n`;

    Object.values(exportData.schemas).forEach((schema) => {
      report += `### ${schema.collectionName}\n`;
      report += `- **Nombre de documents:** ${schema.documentCount}\n`;
      report += `- **Champs:**\n`;

      Object.entries(schema.fields).forEach(([fieldName, fieldInfo]) => {
        report += `  - \`${fieldName}\` (${fieldInfo.type}) - ${fieldInfo.occurrences} occurrences\n`;
        if (fieldInfo.sampleValues.length > 0) {
          report += `    - Exemples: ${fieldInfo.sampleValues
            .map((v) => JSON.stringify(v))
            .join(", ")}\n`;
        }
      });
      report += `\n`;
    });
  }

  fs.writeFileSync(reportPath, report);

  // Afficher le résumé
  console.log("\n📊 RÉSUMÉ DE L'EXPORT");
  console.log("========================");
  console.log(`Projet Firebase: ${exportData.projectId}`);
  console.log(`Collections découvertes: ${allCollections.length}`);
  console.log(
    `Collections avec données: ${exportData.summary.totalCollections}`
  );
  console.log(`Documents totaux: ${exportData.summary.totalDocuments}`);
  if (exportData.summary.collectionsFound.length > 0) {
    console.log(
      `Collections trouvées: ${exportData.summary.collectionsFound.join(", ")}`
    );
  }
  console.log("\n📁 FICHIERS GÉNÉRÉS");
  console.log("===================");
  console.log(`Export complet: ${fullExportPath}`);
  console.log(`Schémas uniquement: ${schemaPath}`);
  console.log(`Rapport lisible: ${reportPath}`);
  console.log("\n✅ Export terminé avec succès !");
}

// Exécuter l'export
if (require.main === module) {
  exportFirestore().catch(console.error);
}

module.exports = { exportFirestore, exportCollection, analyzeSchema };
