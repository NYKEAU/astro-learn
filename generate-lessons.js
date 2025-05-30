const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Vérifier que le fichier de clé de service existe
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

// Données des leçons pour le module de la Terre (ID: 1)
const earthLessons = {
  part1: [
    {
      id: "lesson1",
      title: "Introduction à la structure terrestre",
      order: 1,
      content: `
        <h2>Aperçu général de la Terre</h2>
        <p>La Terre, troisième planète du Système solaire, possède une structure interne unique qui s'est formée lors de sa naissance il y a environ 4,5 milliards d'années.</p>
        
        <h3>Caractéristiques générales:</h3>
        <ul>
          <li>Diamètre moyen: 12 742 km</li>
          <li>Circonférence équatoriale: 40 075 km</li>
          <li>Masse: 5,97 × 10²⁴ kg</li>
          <li>Température de surface moyenne: 15°C</li>
          <li>Structure en couches concentriques</li>
        </ul>
        
        <p>La différenciation planétaire a conduit à une structure en couches distinctes, chacune ayant ses propres caractéristiques physiques et chimiques.</p>
      `,
    },
    {
      id: "lesson2",
      title: "Le noyau terrestre",
      order: 2,
      content: `
        <h2>Le cœur de notre planète</h2>
        <p>Le noyau terrestre représente environ 16% du volume de la planète mais 33% de sa masse. Il est divisé en deux parties distinctes.</p>
        
        <h3>Noyau interne:</h3>
        <ul>
          <li><strong>État</strong>: Solide malgré des températures très élevées, en raison de l'énorme pression</li>
          <li><strong>Composition</strong>: Principalement fer (85%) et nickel (10%), avec des éléments légers</li>
          <li><strong>Température</strong>: Environ 5 500°C, comparable à la surface du Soleil</li>
          <li><strong>Rayon</strong>: 1 220 km</li>
        </ul>
        
        <h3>Noyau externe:</h3>
        <ul>
          <li><strong>État</strong>: Liquide métallique en convection</li>
          <li><strong>Composition</strong>: Semblable au noyau interne, mais moins dense</li>
          <li><strong>Fonction</strong>: Génère le champ magnétique terrestre par effet dynamo</li>
          <li><strong>Épaisseur</strong>: Environ 2 260 km</li>
        </ul>
        
        <p>Cette structure unique du noyau est essentielle pour la génération du champ magnétique qui protège la vie sur Terre des radiations solaires nocives.</p>
      `,
    },
    {
      id: "lesson3",
      title: "Le manteau terrestre",
      order: 3,
      content: `
        <h2>La couche intermédiaire massive</h2>
        <p>Le manteau représente la plus grande partie du volume terrestre, s'étendant du noyau jusqu'à la croûte sur environ 2 900 km d'épaisseur.</p>
        
        <h3>Structure du manteau:</h3>
        <ul>
          <li><strong>Manteau inférieur</strong>: Plus dense et chaud, presque solide mais capable de fluer très lentement</li>
          <li><strong>Zone de transition</strong>: Changements minéralogiques importants entre 410 et 660 km de profondeur</li>
          <li><strong>Manteau supérieur</strong>: Moins dense, comprend l'asthénosphère partiellement fondue</li>
        </ul>
        
        <h3>Composition:</h3>
        <p>Principalement composé de roches silicatées riches en magnésium et en fer (péridotites). Sa composition minéralogique varie avec la profondeur en raison des changements de pression et de température.</p>
        
        <h3>Dynamique:</h3>
        <p>Les mouvements de convection dans le manteau sont le moteur de la tectonique des plaques, transportant la chaleur du noyau vers la surface. Cette "machine thermique" influence l'ensemble des phénomènes géologiques observables en surface.</p>
      `,
    },
    {
      id: "lesson4",
      title: "La croûte terrestre",
      order: 4,
      content: `
        <h2>L'enveloppe externe de la Terre</h2>
        <p>La croûte est la couche la plus fine de la structure terrestre mais aussi la plus accessible et la mieux connue.</p>
        
        <h3>Types de croûte:</h3>
        <ul>
          <li><strong>Croûte continentale</strong>:
            <ul>
              <li>Épaisseur: 30 à 70 km (moyenne 40 km)</li>
              <li>Composition: Principalement granitique, riche en silice et aluminium</li>
              <li>Densité moyenne: 2,7 g/cm³</li>
              <li>Âge: Peut atteindre 4 milliards d'années (archéen)</li>
            </ul>
          </li>
          <li><strong>Croûte océanique</strong>:
            <ul>
              <li>Épaisseur: 5 à 10 km</li>
              <li>Composition: Principalement basaltique, riche en magnésium et fer</li>
              <li>Densité moyenne: 3,0 g/cm³</li>
              <li>Âge: Généralement inférieur à 200 millions d'années (recyclée par subduction)</li>
            </ul>
          </li>
        </ul>
        
        <h3>La lithosphère:</h3>
        <p>La croûte et la partie supérieure du manteau forment ensemble la lithosphère, couche rigide d'environ 100 km d'épaisseur qui constitue les plaques tectoniques. Cette couche "flotte" sur l'asthénosphère plus plastique.</p>
        
        <p>La croûte terrestre contient la majorité des ressources minérales exploitées par l'humanité et constitue le support de la biosphère.</p>
      `,
    },
    {
      id: "lesson5",
      title: "Discontinuités et frontières internes",
      order: 5,
      content: `
        <h2>Les interfaces entre les couches terrestres</h2>
        <p>Les différentes couches de la Terre sont séparées par des discontinuités sismiques, zones où la vitesse de propagation des ondes sismiques change brutalement.</p>
        
        <h3>Principales discontinuités:</h3>
        <ul>
          <li><strong>Discontinuité de Mohorovičić (Moho)</strong>:
            <ul>
              <li>Sépare la croûte du manteau</li>
              <li>Profondeur: 5-10 km sous les océans, 30-70 km sous les continents</li>
              <li>Caractérisée par un changement de composition chimique et minéralogique</li>
            </ul>
          </li>
          <li><strong>Discontinuité de Gutenberg</strong>:
            <ul>
              <li>Sépare le manteau inférieur du noyau externe</li>
              <li>Profondeur: environ 2 900 km</li>
              <li>Marque le passage d'un milieu solide à un milieu liquide</li>
              <li>Les ondes S (cisaillement) ne peuvent pas traverser cette limite</li>
            </ul>
          </li>
          <li><strong>Discontinuité de Lehmann</strong>:
            <ul>
              <li>Sépare le noyau externe du noyau interne</li>
              <li>Profondeur: environ 5 150 km</li>
              <li>Marque le passage d'un milieu liquide à un milieu solide</li>
            </ul>
          </li>
        </ul>
        
        <h3>Importance des discontinuités:</h3>
        <p>L'étude des discontinuités par la sismologie a permis de comprendre la structure interne de la Terre inaccessible à l'observation directe. Ces interfaces sont des témoins de l'histoire de la formation et de l'évolution de notre planète.</p>
      `,
    },
  ],
  part2: [
    {
      id: "lesson1",
      title: "La Lune: notre satellite naturel",
      order: 1,
      content: `
        <h2>Le compagnon céleste de la Terre</h2>
        <p>La Lune est le seul satellite naturel de la Terre et le cinquième plus grand satellite du Système solaire.</p>
        
        <h3>Caractéristiques principales:</h3>
        <ul>
          <li><strong>Diamètre</strong>: 3 474 km (environ 1/4 de celui de la Terre)</li>
          <li><strong>Distance moyenne à la Terre</strong>: 384 400 km</li>
          <li><strong>Période de révolution</strong>: 27,3 jours (mois sidéral)</li>
          <li><strong>Période de rotation</strong>: Égale à sa période de révolution (rotation synchrone)</li>
          <li><strong>Masse</strong>: 7,35 × 10²² kg (1/81 de celle de la Terre)</li>
          <li><strong>Gravité de surface</strong>: 1,62 m/s² (1/6 de celle de la Terre)</li>
        </ul>
        
        <h3>Formation de la Lune:</h3>
        <p>L'hypothèse la plus acceptée aujourd'hui est celle de l'impact géant : un corps de la taille de Mars (nommé Théia) aurait percuté la Terre primitive il y a environ 4,5 milliards d'années. Les débris de cette collision se seraient ensuite agglomérés pour former la Lune.</p>
        
        <p>Cette origine explique de nombreuses propriétés de la Lune, comme sa composition chimique similaire à celle du manteau terrestre.</p>
      `,
    },
    {
      id: "lesson2",
      title: "Influence de la Lune sur la Terre",
      order: 2,
      content: `
        <h2>Les effets de notre satellite</h2>
        <p>Malgré sa taille modeste, la Lune exerce une influence considérable sur notre planète à travers plusieurs phénomènes.</p>
        
        <h3>Marées océaniques et terrestres:</h3>
        <ul>
          <li>La force gravitationnelle de la Lune (et dans une moindre mesure celle du Soleil) déforme les océans et même la croûte terrestre</li>
          <li>Le cycle des marées (deux marées hautes et deux marées basses par jour) est principalement dû à la rotation de la Terre sous le "renflement" créé par l'attraction lunaire</li>
          <li>L'amplitude des marées varie selon la position relative de la Lune et du Soleil (marées de vives-eaux et de mortes-eaux)</li>
        </ul>
        
        <h3>Stabilisation de l'axe de rotation terrestre:</h3>
        <p>La Lune joue un rôle de "stabilisateur gyroscopique" pour la Terre, limitant les variations de l'inclinaison de son axe de rotation. Sans la Lune, l'axe terrestre pourrait subir des basculements chaotiques, entraînant des changements climatiques drastiques.</p>
        
        <h3>Ralentissement de la rotation terrestre:</h3>
        <p>Les forces de marée créent un effet de friction qui ralentit progressivement la rotation de la Terre. La durée du jour s'allonge ainsi d'environ 2,3 millisecondes par siècle. En contrepartie, la Lune s'éloigne de la Terre d'environ 3,8 cm par an.</p>
      `,
    },
    {
      id: "lesson3",
      title: "Phases lunaires et éclipses",
      order: 3,
      content: `
        <h2>Les phénomènes cycliques de la Lune</h2>
        <p>La position relative de la Terre, de la Lune et du Soleil engendre des phénomènes observables depuis la Terre.</p>
        
        <h3>Cycle des phases lunaires:</h3>
        <ul>
          <li><strong>Nouvelle Lune</strong>: La face visible de la Lune n'est pas éclairée (Lune entre la Terre et le Soleil)</li>
          <li><strong>Premier croissant</strong>: Une petite partie de la face visible est éclairée</li>
          <li><strong>Premier quartier</strong>: La moitié droite (dans l'hémisphère nord) est éclairée</li>
          <li><strong>Gibbeuse croissante</strong>: Plus de la moitié est éclairée</li>
          <li><strong>Pleine Lune</strong>: Toute la face visible est éclairée (la Terre est entre le Soleil et la Lune)</li>
          <li><strong>Gibbeuse décroissante</strong>: La partie éclairée diminue</li>
          <li><strong>Dernier quartier</strong>: La moitié gauche (dans l'hémisphère nord) est éclairée</li>
          <li><strong>Dernier croissant</strong>: Une petite partie reste éclairée avant le retour à la nouvelle Lune</li>
        </ul>
        
        <h3>Les éclipses:</h3>
        <p><strong>Éclipse de Lune</strong>: Se produit quand la Lune traverse l'ombre de la Terre (uniquement à la pleine Lune). La Lune prend alors une teinte rougeâtre due à la réfraction de la lumière solaire par l'atmosphère terrestre.</p>
        
        <p><strong>Éclipse de Soleil</strong>: Se produit quand la Lune passe entre la Terre et le Soleil, projetant son ombre sur la surface terrestre (uniquement à la nouvelle Lune). Elle peut être totale, partielle ou annulaire selon l'alignement et les distances relatives.</p>
      `,
    },
    {
      id: "lesson4",
      title: "Les satellites artificiels",
      order: 4,
      content: `
        <h2>Les objets en orbite autour de la Terre</h2>
        <p>Depuis le lancement de Spoutnik 1 en 1957, l'humanité a placé des milliers de satellites artificiels en orbite terrestre pour diverses applications.</p>
        
        <h3>Types d'orbites:</h3>
        <ul>
          <li><strong>Orbite basse (LEO)</strong>: 160-2 000 km d'altitude, période de 90 minutes environ, utilisée pour l'observation terrestre, les télécommunications de proximité et les stations spatiales</li>
          <li><strong>Orbite moyenne (MEO)</strong>: 2 000-35 786 km, utilisée notamment pour les systèmes de navigation par satellite (GPS, Galileo)</li>
          <li><strong>Orbite géostationnaire (GEO)</strong>: 35 786 km, période égale à la rotation terrestre, le satellite apparaît fixe dans le ciel, utilisée pour les télécommunications et la météorologie</li>
          <li><strong>Orbites fortement elliptiques</strong>: Permettent une couverture prolongée de certaines régions (ex: orbites Molniya pour les hautes latitudes)</li>
        </ul>
        
        <h3>Applications principales:</h3>
        <ul>
          <li><strong>Communications</strong>: Télévision, téléphonie, internet</li>
          <li><strong>Navigation</strong>: Systèmes GPS, GLONASS, Galileo, BeiDou</li>
          <li><strong>Observation de la Terre</strong>: Météorologie, surveillance environnementale, cartographie</li>
          <li><strong>Recherche scientifique</strong>: Astronomie, étude de l'atmosphère, géophysique</li>
          <li><strong>Applications militaires</strong>: Renseignement, communications sécurisées</li>
        </ul>
        
        <h3>Enjeux actuels:</h3>
        <p>La multiplication des satellites et des débris spatiaux pose des problèmes croissants de gestion du trafic orbital et de pollution spatiale. Des technologies de désorbitation et de maintenance en orbite se développent pour répondre à ces défis.</p>
      `,
    },
  ],
};

// Fonction principale pour générer les leçons
async function generateLessons() {
  console.log(
    "Début de la génération des leçons pour le module Terre (ID: 1)..."
  );

  try {
    // Vérifier que le module existe
    const moduleRef = db.collection("modules").doc("1");
    const moduleDoc = await moduleRef.get();

    if (!moduleDoc.exists) {
      console.error(
        "Erreur: Le module avec l'ID 1 n'existe pas dans la base de données."
      );
      process.exit(1);
    }

    console.log("Module Terre trouvé. Génération des leçons...");

    // Parcourir les parties et leurs leçons
    for (const [partId, lessons] of Object.entries(earthLessons)) {
      console.log(`\nTraitement de la partie ${partId}...`);

      // Vérifier que la partie existe
      const partRef = db
        .collection("modules")
        .doc("1")
        .collection("parts")
        .doc(partId);
      const partDoc = await partRef.get();

      if (!partDoc.exists) {
        console.log(`La partie ${partId} n'existe pas encore. Création...`);
        await partRef.set({
          title:
            partId === "part1"
              ? "Structure de la Terre"
              : "Dynamiques terrestres",
          order: parseInt(partId.replace("part", "")),
        });
        console.log(`Partie ${partId} créée.`);
      }

      // Référence à la collection de leçons pour cette partie
      const lessonsRef = partRef.collection("lessons");

      // Ajouter ou mettre à jour chaque leçon
      for (const lesson of lessons) {
        console.log(`  Ajout de la leçon: ${lesson.title}`);
        await lessonsRef.doc(lesson.id).set({
          title: lesson.title,
          content: lesson.content,
          order: lesson.order,
        });
      }

      console.log(`${lessons.length} leçons ajoutées à la partie ${partId}`);
    }

    console.log("\nGénération des leçons terminée avec succès!");
  } catch (error) {
    console.error("Erreur lors de la génération des leçons:", error);
  }
}

// Exécuter la fonction principale
generateLessons()
  .then(() => {
    console.log("Script terminé.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur non gérée:", error);
    process.exit(1);
  });
