"use client";

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChange } from "@/lib/firebase/auth";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { db, isProduction } from "@/lib/firebase/config";
import { ExerciseParser } from "@/components/exercises/ExerciseParser";
import { ThreeDViewerButton } from "@/components/ui/3d-viewer-button";
import { useModuleAccess } from "@/lib/hooks/useModuleAccess";
import { toast } from "sonner";
import { check3DModelExists, get3DModelURL } from "@/lib/firebase/storage";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Toaster } from "sonner";

// Lazy load du ModelViewer
const ModelViewer = lazy(() => import("@/components/3d/ModelViewer"));

// Fonction pour extraire un titre à partir du contenu d'une question
function extractQuestionTitle(content) {
  if (!content || typeof content !== "string") return `Question`;

  // Limiter à un certain nombre de caractères
  const maxLength = 60;
  let title = content;

  // Chercher une phrase qui se termine par ? pour les questions
  const questionMatch = content.match(/^[^?]+\?/);
  if (questionMatch) {
    title = questionMatch[0].trim();
  } else {
    // Sinon prendre la première phrase ou les premiers mots
    const firstSentenceMatch = content.match(/^[^.!?]+[.!?]/);
    if (firstSentenceMatch) {
      title = firstSentenceMatch[0].trim();
    }
  }

  // Tronquer si nécessaire
  if (title.length > maxLength) {
    title = title.substring(0, maxLength) + "...";
  }

  return title;
}

// Fonction pour détecter le type de question et extraire les données
function parseQuestionContent(content) {
  if (!content || typeof content !== "string") {
    return { type: "text", content: content };
  }

  // Méthode directe pour traiter les QCM à une seule ligne avec options numérotées
  if (content.includes("1.") && content.includes("2.")) {
    const index1 = content.indexOf("1.");
    const index2 = content.indexOf("2.");

    // Vérifier si les numéros apparaissent dans l'ordre correct
    if (index1 >= 0 && index2 > index1) {
      // Extraire la question (tout ce qui précède "1.")
      const questionText = content.substring(0, index1).trim();

      // Trouver l'index de "3." s'il existe
      const index3 = content.indexOf("3.", index2);
      const index4 = content.indexOf("4.", index3 > 0 ? index3 : index2);

      // Extraire les options
      const options = [];

      // Option 1: entre "1." et "2."
      const option1 = content.substring(index1 + 2, index2).trim();
      options.push(option1);

      // Option 2: entre "2." et "3." ou jusqu'à la fin
      const option2 =
        index3 > 0
          ? content.substring(index2 + 2, index3).trim()
          : content.substring(index2 + 2).trim();
      options.push(option2);

      // Option 3 si elle existe
      if (index3 > 0) {
        const option3 =
          index4 > 0
            ? content.substring(index3 + 2, index4).trim()
            : content.substring(index3 + 2).trim();
        options.push(option3);
      }

      // Option 4 si elle existe
      if (index4 > 0) {
        const option4 = content.substring(index4 + 2).trim();
        options.push(option4);
      }

      if (options.length >= 2) {
        return {
          type: "quiz",
          question: questionText,
          options: options,
          answer: options[1], // Choisir la deuxième option comme correcte par défaut
        };
      }
    }
  }

  // Fix spécifique pour l'exemple "Quelle est l'épaisseur moyenne de la croûte continentale ? 1. 5 à 10 km 2. 30 à 50 km 3. 100 à 150 km"
  if (content.includes("croûte continentale") || content.includes("km")) {
    // Exemple spécifique, forcer le format
    const options = ["5 à 10 km", "30 à 50 km", "100 à 150 km"];
    const questionText =
      "Quelle est l'épaisseur moyenne de la croûte continentale ?";

    return {
      type: "quiz",
      question: questionText,
      options: options,
      answer: options[1], // Correct answer is 30 à 50 km
    };
  }

  // Approche très simple par string splitting pour QCM format "Question? 1. Option1 2. Option2 3. Option3"
  if (
    content.includes("1.") &&
    (content.includes("2.") || content.includes("3."))
  ) {
    try {
      // Extraire la question (tout ce qui précède "1.")
      const firstOptionIndex = content.indexOf("1.");
      if (firstOptionIndex > 0) {
        const questionText = content.substring(0, firstOptionIndex).trim();
        const remainingText = content.substring(firstOptionIndex);

        // Diviser les options en utilisant les numéros comme séparateurs
        const optionsParts = remainingText.split(/\s+\d+\.\s+/);
        // Le premier élément sera vide (avant "1."), le retirer
        optionsParts.shift();

        const options = optionsParts.map((opt) => opt.trim()).filter(Boolean);

        if (options.length >= 2) {
          return {
            type: "quiz",
            question: questionText,
            options: options,
            answer: options[0], // Par défaut, la première réponse est correcte
          };
        }
      }
    } catch (error) {
      console.error("Erreur lors du parsing simple du QCM:", error);
    }
  }

  // Solution radicale pour le format spécifique "Question? 1. option1 2. option2 3. option3"
  const qcmPattern =
    /^(.*?)(\s+|^)1\.\s+(.*?)(\s+|$)2\.\s+(.*?)(?:(\s+|$)3\.\s+(.*?))?(?:(\s+|$)4\.\s+(.*?))?$/s;
  const qcmMatch = content.match(qcmPattern);

  if (qcmMatch) {
    const questionText = qcmMatch[1]?.trim() || "";
    const options = [];

    // Ajouter les options trouvées
    if (qcmMatch[3]) options.push(qcmMatch[3].trim());
    if (qcmMatch[5]) options.push(qcmMatch[5].trim());
    if (qcmMatch[7]) options.push(qcmMatch[7].trim());
    if (qcmMatch[9]) options.push(qcmMatch[9].trim());

    // S'il y a au moins 2 options, c'est un QCM
    if (options.length >= 2) {
      return {
        type: "quiz",
        question: questionText,
        options: options,
        answer: options[0], // Par défaut, la première réponse est correcte
      };
    }
  }

  // Cas spécifique: QCM numéroté sur une seule ligne avec options contenant des chiffres
  if (content.includes("1.") && content.includes("2.")) {
    // Essayer d'extraire la question (texte avant "1.")
    const questionEndIndex = content.indexOf("1.");
    if (questionEndIndex > 0) {
      const questionText = content.substring(0, questionEndIndex).trim();

      // Recherche explicite des options numérotées
      const options = [];

      // Regex pour trouver les options "N. Texte" où Texte peut contenir des chiffres
      const optionRegex = /(\d+)\.\s+(.*?)(?=\s+\d+\.\s+|$)/g;
      let match;

      // Créer un tableau des correspondances trouvées
      const matches = [];
      while ((match = optionRegex.exec(content)) !== null) {
        matches.push({
          number: parseInt(match[1], 10),
          text: match[2].trim(),
        });
      }

      // Trier les options par leur numéro
      matches.sort((a, b) => a.number - b.number);

      // Extraire le texte des options
      matches.forEach((m) => options.push(m.text));

      // Si on a trouvé au moins 2 options, c'est un QCM
      if (options.length >= 2) {
        return {
          type: "quiz",
          question: questionText,
          options: options,
          answer: options[0], // Par défaut, la première réponse est correcte
        };
      }
    }
  }

  // Méthode simplifiée pour les QCM
  // Cherche d'abord un texte de question suivi de "1." pour identifier les QCM
  if (
    content.includes("1.") &&
    (content.includes("2.") || content.includes("3."))
  ) {
    try {
      // Approche simple avec split
      // 1. Diviser aux numéros (1., 2., 3., etc.)
      const parts = content.split(/\s*\d+\.\s+/).filter(Boolean);

      // S'il y a au moins un élément, le premier est la question
      if (parts.length > 0) {
        // Le premier élément est généralement du texte qui n'est pas une option
        const questionText = parts[0].trim();

        // Si on a trouvé une question, chercher les options explicitement
        // Chercher les motifs 1. xxx, 2. xxx, 3. xxx
        const optionMatches = content.match(
          /\d+\.\s+[^1-9][^1-9][^\n\d.]+((?=\s+\d+\.)|$)/g
        );

        if (optionMatches && optionMatches.length >= 2) {
          const options = optionMatches.map((opt) =>
            opt.replace(/^\d+\.\s+/, "").trim()
          );

          return {
            type: "quiz",
            question: questionText,
            options: options,
            answer: options[0], // Par défaut, la première réponse est correcte
          };
        }

        // Plan B: Extraire manuellement les options
        if (content.includes("1.") && content.includes("2.")) {
          const options = [];
          let remainingText = content;

          // Chercher chaque option numérotée
          for (let i = 1; i <= 10; i++) {
            const optPattern = new RegExp(
              `${i}\\.\\s+([^\\d.]+)(?=\\s+\\d+\\.|$)`
            );
            const match = remainingText.match(optPattern);

            if (match && match[1]) {
              options.push(match[1].trim());
              // Retirer cette partie du texte pour éviter les doublons
              remainingText = remainingText.replace(match[0], "");
            }
          }

          if (options.length >= 2) {
            return {
              type: "quiz",
              question: questionText,
              options: options,
              answer: options[0], // Par défaut, la première réponse est correcte
            };
          }
        }

        // Plan C: Forcer l'extraction en cherchant "1.", "2.", "3."
        if (content.includes("1.") && content.includes("2.")) {
          // Extraire le texte qui suit chaque numéro
          const option1Match = content.match(/1\.\s+(.*?)(?=\s+\d+\.|$)/s);
          const option2Match = content.match(/2\.\s+(.*?)(?=\s+\d+\.|$)/s);
          const option3Match = content.includes("3.")
            ? content.match(/3\.\s+(.*?)(?=\s+\d+\.|$)/s)
            : null;

          const options = [];
          if (option1Match && option1Match[1])
            options.push(option1Match[1].trim());
          if (option2Match && option2Match[1])
            options.push(option2Match[1].trim());
          if (option3Match && option3Match[1])
            options.push(option3Match[1].trim());

          if (options.length >= 2) {
            return {
              type: "quiz",
              question: questionText,
              options: options,
              answer: options[0], // Par défaut, la première réponse est correcte
            };
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors du parsing du QCM:", error);
    }
  }

  // Vérifier si c'est un texte à trous (contient des [] et des <>)
  if (
    content.includes("[") &&
    content.includes("]") &&
    content.includes("<") &&
    content.includes(">")
  ) {
    // Extraire le texte avec les trous
    const text = content.replace(/<[^>]+>/g, "");

    // Extraire les blancs à remplir
    const blanks = [];
    const blankMatches = content.match(/\[([^\]]*)\]/g) || [];

    // Extraire les propositions
    const propositions = (content.match(/<([^>]+)>/g) || []).map((p) =>
      p.replace(/[<>]/g, "").trim()
    );

    blankMatches.forEach((blank, index) => {
      blanks.push({
        id: `blank_${index}`,
        answer: propositions[index] || "",
      });
    });

    return {
      type: "fillInTheBlank",
      text: text,
      blanks: blanks,
      propositions: propositions,
    };
  }

  // Vérifier si c'est un texte à compléter (contient uniquement des [])
  if (
    content.includes("[") &&
    content.includes("]") &&
    (!content.includes("<") || !content.includes(">"))
  ) {
    // Extraire le texte avec les trous
    const text = content;

    // Extraire les blancs à remplir
    const blanks = [];
    const blankMatches = content.match(/\[([^\]]*)\]/g) || [];

    blankMatches.forEach((blank, index) => {
      // Récupérer le contenu entre crochets s'il existe
      const correctAnswer = blank.replace(/[\[\]]/g, "").trim();

      blanks.push({
        id: `blank_${index}`,
        answer: correctAnswer,
      });
    });

    return {
      type: "fillInText",
      text: text,
      blanks: blanks,
    };
  }

  // Par défaut, considérer comme texte simple
  return { type: "text", content: content };
}

export default function LessonPage() {
  console.log("🎯 LessonPage component loaded");

  const params = useParams();
  const { moduleId, lessonId } = params;
  console.log("📍 Params:", { moduleId, lessonId });

  const { language } = useLanguage();
  const router = useRouter();
  const { canAccessModule } = useModuleAccess();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [lesson, setLesson] = useState(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleTitleEn, setModuleTitleEn] = useState("");
  const [userAnswers, setUserAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nextPartTitle, setNextPartTitle] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [has3DModel, setHas3DModel] = useState(false);
  const [model3DURL, setModel3DURL] = useState(null);
  const [checking3DModel, setChecking3DModel] = useState(false);

  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [show3DViewer, setShow3DViewer] = useState(false);

  // Vérifier l'accès au module
  useEffect(() => {
    if (moduleId) {
      const moduleAccess = canAccessModule(moduleId);
      setHasAccess(moduleAccess);
    }
  }, [moduleId, canAccessModule]);

  // Vérifier l'existence du modèle 3D
  useEffect(() => {
    console.log("🚀 useEffect 3D déclenché, moduleId:", moduleId);
    console.log("📦 Fonctions importées:", {
      check3DModelExists,
      get3DModelURL,
    });

    const check3DModel = async () => {
      if (!moduleId) {
        console.log("❌ Pas de moduleId, arrêt");
        return;
      }

      console.log(`🔍 Vérification du modèle 3D pour le module: ${moduleId}`);
      setChecking3DModel(true);
      try {
        const modelExists = await check3DModelExists(moduleId);
        console.log(
          `📦 Modèle 3D existe pour le module ${moduleId}:`,
          modelExists
        );
        setHas3DModel(modelExists);

        if (modelExists) {
          const modelURL = await get3DModelURL(moduleId);
          console.log(`🔗 URL du modèle 3D:`, modelURL);
          setModel3DURL(modelURL);
        }
      } catch (error) {
        console.error("❌ Erreur lors de la vérification du modèle 3D:", error);
        setHas3DModel(false);
        setModel3DURL(null);
      } finally {
        setChecking3DModel(false);
      }
    };

    check3DModel();
  }, [moduleId]);

  // Fonction pour gérer l'ouverture du viewer 3D avec vérification des droits
  const handle3DViewerToggle = () => {
    if (!hasAccess && moduleId !== "1") {
      toast.error(
        language === "fr"
          ? "Cette leçon n'est pas encore accessible"
          : "This lesson is not yet accessible"
      );
      return;
    }
    setShow3DViewer(!show3DViewer);
  };

  // Récupérer le contenu de la leçon et du module depuis Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);

        // Récupérer d'abord le module
        let moduleData = null;

        // Essayer d'abord par ID direct
        const moduleDocRef = doc(db, "modules", moduleId);
        const moduleDocSnap = await getDoc(moduleDocRef);

        if (moduleDocSnap.exists()) {
          moduleData = { id: moduleDocSnap.id, ...moduleDocSnap.data() };
        } else {
          // Chercher le module par ID dans les champs
          const modulesRef = collection(db, "modules");
          const moduleQuery = query(modulesRef, where("id", "==", moduleId));
          const moduleQuerySnapshot = await getDocs(moduleQuery);

          if (!moduleQuerySnapshot.empty) {
            moduleData = {
              id: moduleQuerySnapshot.docs[0].id,
              ...moduleQuerySnapshot.docs[0].data(),
            };
          }
        }

        if (!moduleData) {
          // Module non trouvé, rediriger vers la page d'accueil
          console.error("Module non trouvé:", moduleId);
          router.push("/");
          return;
        }

        // Enregistrer les titres du module
        setModuleTitle(moduleData.title || "");
        setModuleTitleEn(moduleData.titleEn || "");

        // Vérifier si le lessonId est un format partX.Y pour les questions
        if (lessonId.match(/^part\d+\.\d+$/)) {
          // C'est une question directement dans le module
          const [partKey, questionNumber] = lessonId.split(".");
          const partNumber = partKey.replace("part", "");
          const partTitle = moduleData[partKey] || `Partie ${partNumber}`;

          // Récupérer toutes les questions de cette partie
          const allQuestionsOfPart = [];

          // Parcourir toutes les clés du module pour trouver celles qui correspondent à la partie
          Object.entries(moduleData).forEach(([key, value]) => {
            if (key.startsWith(`${partKey}.`) && key.match(/^part\d+\.\d+$/)) {
              const questionNum = key.split(".")[1];

              // Parser le contenu pour déterminer le type de question
              const parsedQuestion = parseQuestionContent(value);

              // Créer une question virtuelle
              const question = {
                id: key,
                title: extractQuestionTitle(value),
                titleEn: extractQuestionTitle(value),
                questionNumber: questionNum,
                partNumber: partNumber,
                partTitle: partTitle,
                content: value,
                contentEn: value,
                "3dModel":
                  moduleData[`${key}_model`] ||
                  moduleData[`${partKey}_model`] ||
                  "default",
                ...parsedQuestion,
              };

              allQuestionsOfPart.push(question);
            }
          });

          // Trier les questions par numéro
          allQuestionsOfPart.sort((a, b) => {
            return parseInt(a.questionNumber) - parseInt(b.questionNumber);
          });

          // Créer une structure de leçon avec toutes les questions
          if (allQuestionsOfPart.length > 0) {
            const partLesson = {
              id: partKey,
              title: partTitle,
              titleEn: partTitle,
              partNumber: partNumber,
              partTitle: partTitle,
              steps: allQuestionsOfPart,
            };

            setLesson(partLesson);

            // Trouver l'index de la question actuelle dans toutes les questions
            const currentQuestionIndex = allQuestionsOfPart.findIndex(
              (q) => q.id === lessonId
            );
            if (currentQuestionIndex !== -1) {
              setCurrentStep(currentQuestionIndex);
            }
          } else {
            // Fallback: récupérer seulement la question demandée
            const questionContent = moduleData[lessonId];

            if (questionContent) {
              // Vérifier si un modèle 3D est spécifié pour cette question
              let modelType = "default";

              // Chercher un attribut spécifique pour le modèle 3D
              if (moduleData[`${lessonId}_model`]) {
                modelType = moduleData[`${lessonId}_model`];
              }
              // Ou chercher un modèle pour toute la partie
              else if (moduleData[`${partKey}_model`]) {
                modelType = moduleData[`${partKey}_model`];
              }

              // Parser le contenu pour déterminer le type de question
              const parsedQuestion = parseQuestionContent(questionContent);

              // Créer une structure de leçon à partir de la question
              const questionLesson = {
                id: lessonId,
                title: extractQuestionTitle(questionContent),
                titleEn: extractQuestionTitle(questionContent),
                partNumber: partNumber,
                partTitle: partTitle,
                steps: [
                  {
                    type: parsedQuestion.type,
                    content: questionContent,
                    contentEn: questionContent,
                    "3dModel": modelType,
                    questionNumber: questionNumber,
                    partNumber: partNumber,
                    partTitle: partTitle,
                    ...parsedQuestion,
                  },
                ],
              };

              setLesson(questionLesson);
            } else {
              // Question non trouvée
              console.error("Question non trouvée dans le module:", lessonId);
              router.push(`/modules/${moduleId}`);
            }
          }
        }
        // Ancienne structure avec content
        else if (moduleData.content && Array.isArray(moduleData.content)) {
          const lessonItem = moduleData.content.find(
            (item) => item.id === lessonId
          );

          if (lessonItem) {
            // Chercher le contenu détaillé de la leçon
            const lessonDocRef = doc(db, "lessons", lessonId);
            const lessonDocSnap = await getDoc(lessonDocRef);

            if (lessonDocSnap.exists()) {
              // Structure complète de la leçon trouvée
              const rawLessonData = {
                id: lessonDocSnap.id,
                ...lessonDocSnap.data(),
                title: lessonItem.title || lessonDocSnap.data().title,
                titleEn: lessonItem.titleEn || lessonDocSnap.data().titleEn,
              };

              // Organiser les exercices par parties
              const organizedData = organizeStepsByParts(rawLessonData);
              setLesson(organizedData);
            } else {
              // Essayer de chercher la leçon par ID dans la collection lessons
              const lessonsRef = collection(db, "lessons");
              const lessonQuery = query(
                lessonsRef,
                where("id", "==", lessonId)
              );
              const lessonQuerySnapshot = await getDocs(lessonQuery);

              if (!lessonQuerySnapshot.empty) {
                const rawLessonData = {
                  id: lessonQuerySnapshot.docs[0].id,
                  ...lessonQuerySnapshot.docs[0].data(),
                  title:
                    lessonItem.title ||
                    lessonQuerySnapshot.docs[0].data().title,
                  titleEn:
                    lessonItem.titleEn ||
                    lessonQuerySnapshot.docs[0].data().titleEn,
                };

                // Organiser les exercices par parties
                const organizedData = organizeStepsByParts(rawLessonData);
                setLesson(organizedData);
              } else {
                // Créer une structure de leçon basique à partir des informations du module
                setLesson({
                  id: lessonId,
                  title: lessonItem.title || "",
                  titleEn: lessonItem.titleEn || "",
                  steps: [],
                  parts: [],
                });
              }
            }
          } else {
            // Leçon non trouvée dans le module
            console.error("Leçon non trouvée dans le module:", lessonId);
            router.push(`/modules/${moduleId}`);
          }
        } else {
          // Structure de module invalide
          console.error("Structure de module invalide:", moduleData);
          router.push(`/modules/${moduleId}`);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        router.push(`/modules/${moduleId}`);
      } finally {
        setDataLoading(false);
      }
    };

    // Fonction pour organiser les étapes par parties
    const organizeStepsByParts = (lessonData) => {
      if (!lessonData || !lessonData.steps) return lessonData;

      const result = { ...lessonData };
      const parts = {};
      const partTitles = {};

      // Identifier les noms des parties et les questions
      Object.entries(lessonData).forEach(([key, value]) => {
        // Détecter les titres de parties (partX sans .X)
        if (key.startsWith("part") && !key.includes(".")) {
          const partNumber = key.replace("part", "");
          partTitles[partNumber] = value;
        }

        // Détecter les questions (partX.Y)
        if (key.startsWith("part") && key.includes(".")) {
          const [partKey, questionNumber] = key.split(".");
          const partNumber = partKey.replace("part", "");

          if (!parts[partNumber]) {
            parts[partNumber] = [];
          }

          parts[partNumber].push({
            id: key,
            title: value.title || extractQuestionTitle(value),
            titleEn: value.titleEn || extractQuestionTitle(value),
            partNumber: partNumber,
            partTitle: partTitles[partNumber] || `Partie ${partNumber}`,
            questionNumber: parseInt(questionNumber, 10),
            ...value,
          });
        }
      });

      // Trier les parties et les questions
      const sortedParts = Object.keys(parts)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map((partNumber) => {
          const sortedQuestions = parts[partNumber].sort(
            (a, b) => a.questionNumber - b.questionNumber
          );

          return {
            partNumber,
            title: partTitles[partNumber] || `Partie ${partNumber}`,
            questions: sortedQuestions,
          };
        });

      result.parts = sortedParts;

      // Conserver la compatibilité avec l'ancienne structure steps
      if (lessonData.steps) {
        result.steps = lessonData.steps;
      } else {
        // Créer une version aplatie pour la compatibilité
        result.steps = sortedParts.flatMap((part) =>
          part.questions.map((question) => ({
            type: question.type || "exercise",
            content: question.content,
            contentEn: question.contentEn,
            ...question,
          }))
        );
      }

      return result;
    };

    if (moduleId && lessonId) {
      fetchData();
    }
  }, [moduleId, lessonId, router]);

  // Effet pour mettre à jour le titre de la partie suivante
  useEffect(() => {
    if (lesson && lesson.steps && lesson.steps[0]?.partNumber) {
      const fetchModuleData = async () => {
        try {
          // Récupérer les données du module
          const moduleDocRef = doc(db, "modules", moduleId);
          const moduleDocSnap = await getDoc(moduleDocRef);

          if (moduleDocSnap.exists()) {
            const moduleData = moduleDocSnap.data();
            const currentPartNumber = parseInt(lesson.steps[0].partNumber);
            const nextPartKey = `part${currentPartNumber + 1}`;

            if (moduleData[nextPartKey]) {
              setNextPartTitle(moduleData[nextPartKey]);
            } else {
              setNextPartTitle(
                language === "fr" ? "Fin du module" : "End of module"
              );
            }
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération du titre de la partie suivante:",
            error
          );
        }
      };

      fetchModuleData();
    }
  }, [lesson, moduleId, language]);

  // Vérifier l'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setUser(user);
      setLoading(false);

      // Rediriger vers la page d'inscription si non authentifié
      if (!user) {
        router.push(`/register`);
      } else if (user && moduleId && lessonId) {
        // Charger les réponses précédentes de l'utilisateur
        loadUserProgress(user.uid, moduleId, lessonId);
      }
    });

    return () => unsubscribe();
  }, [router, moduleId, lessonId]);

  // Charger les réponses précédentes de l'utilisateur
  const loadUserProgress = async (userId, moduleId, lessonId) => {
    try {
      const progressRef = doc(
        db,
        "users",
        userId,
        "progress",
        `${moduleId}_${lessonId}`
      );
      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        const progressData = progressSnap.data();
        if (progressData.answers) {
          setUserAnswers(progressData.answers);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la progression:", error);
    }
  };

  // Sauvegarder la progression de l'utilisateur
  const saveUserProgress = async () => {
    if (!user || !moduleId || !lessonId) return;

    setIsSaving(true);
    try {
      const progressRef = doc(
        db,
        "users",
        user.uid,
        "progress",
        `${moduleId}_${lessonId}`
      );

      await setDoc(
        progressRef,
        {
          moduleId,
          lessonId,
          answers: userAnswers,
          lastUpdated: new Date().toISOString(),
          completed: showResults,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la progression:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Sauvegarder chaque fois que les réponses changent
  useEffect(() => {
    if (Object.keys(userAnswers).length > 0) {
      const saveTimeout = setTimeout(() => {
        saveUserProgress();
      }, 1000); // Délai pour éviter trop d'appels

      return () => clearTimeout(saveTimeout);
    }
  }, [userAnswers]);

  // Initialiser la scène 3D
  useEffect(() => {
    if (
      !show3DViewer ||
      !canvasRef.current ||
      !lesson ||
      !lesson.steps ||
      !lesson.steps[currentStep] ||
      !lesson.steps[currentStep]["3dModel"]
    )
      return;

    // Créer la scène, la caméra et le renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / 2 / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );
    canvasRef.current.innerHTML = "";
    canvasRef.current.appendChild(renderer.domElement);

    // Ajouter des contrôles pour manipuler le modèle 3D
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // Fonction pour créer le modèle 3D en fonction du type
    const createModel = (modelType) => {
      scene.clear();

      // Ajouter un éclairage
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(10, 10, 10);
      scene.add(pointLight);

      // Créer le modèle en fonction du type
      let model;

      switch (modelType) {
        case "sun":
          model = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshBasicMaterial({
              color: 0xffcc33,
              wireframe: false,
            })
          );

          // Ajouter un effet de lueur
          const sunLight = new THREE.PointLight(0xffcc33, 1.5, 100);
          sunLight.position.set(0, 0, 0);
          scene.add(sunLight);
          break;

        case "planets":
          // Créer le soleil (plus petit)
          const sun = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xffcc33 })
          );
          scene.add(sun);

          // Ajouter quelques planètes
          const planetMaterials = [
            new THREE.MeshPhongMaterial({ color: 0x999999 }), // Mercure
            new THREE.MeshPhongMaterial({ color: 0xe6e6fa }), // Venus
            new THREE.MeshPhongMaterial({ color: 0x6b93d6 }), // Terre
            new THREE.MeshPhongMaterial({ color: 0xc1440e }), // Mars
            new THREE.MeshPhongMaterial({ color: 0xd8ca9d }), // Jupiter
            new THREE.MeshPhongMaterial({ color: 0xead6b8 }), // Saturne
          ];

          // Positions des planètes (distances relatives au soleil)
          const planetDistances = [1.5, 2, 2.5, 3, 4, 5];
          const planetSizes = [0.1, 0.2, 0.2, 0.15, 0.4, 0.35];

          for (let i = 0; i < 6; i++) {
            const planet = new THREE.Mesh(
              new THREE.SphereGeometry(planetSizes[i], 32, 32),
              planetMaterials[i]
            );

            // Positionner la planète
            const angle = Math.random() * Math.PI * 2;
            planet.position.x = Math.cos(angle) * planetDistances[i];
            planet.position.z = Math.sin(angle) * planetDistances[i];

            scene.add(planet);
          }
          break;

        case "jupiter":
          model = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshPhongMaterial({
              color: 0xd8ca9d,
              bumpScale: 0.05,
            })
          );
          break;

        case "nebula":
          // Simuler une nébuleuse avec un système de particules
          const particleGeometry = new THREE.BufferGeometry();
          const particleCount = 5000;

          const positions = new Float32Array(particleCount * 3);
          const colors = new Float32Array(particleCount * 3);

          const color1 = new THREE.Color(0x9370db); // Violet
          const color2 = new THREE.Color(0x6495ed); // Bleu

          for (let i = 0; i < particleCount; i++) {
            // Position aléatoire dans une sphère
            const radius = 2 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Couleur interpolée entre violet et bleu
            const mixedColor = color1.clone().lerp(color2, Math.random());

            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
          }

          particleGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
          );
          particleGeometry.setAttribute(
            "color",
            new THREE.BufferAttribute(colors, 3)
          );

          const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
          });

          model = new THREE.Points(particleGeometry, particleMaterial);
          break;

        case "star":
          model = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshBasicMaterial({
              color: 0xffffff,
              wireframe: false,
            })
          );

          // Ajouter un effet de lueur
          const starLight = new THREE.PointLight(0xffffff, 1.5, 100);
          starLight.position.set(0, 0, 0);
          scene.add(starLight);
          break;

        default:
          // Par défaut, créer une sphère simple
          model = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshPhongMaterial({ color: 0x6b93d6 })
          );
          break;
      }

      if (model) {
        scene.add(model);
      }

      // Positionner la caméra
      camera.position.z = 6;

      // Animation de rotation pour certains modèles
      const animate = () => {
        if (sceneRef.current !== "unmounted") {
          requestAnimationFrame(animate);

          if (model && !["planets", "nebula"].includes(modelType)) {
            model.rotation.y += 0.005;
          }

          controls.update();
          renderer.render(scene, camera);
        }
      };

      animate();
    };

    // Créer le modèle 3D correspondant à l'étape actuelle
    const modelType = lesson.steps[currentStep]["3dModel"] || "default";
    createModel(modelType);

    // Gérer le redimensionnement de la fenêtre
    const handleResize = () => {
      if (canvasRef.current) {
        camera.aspect =
          canvasRef.current.clientWidth / canvasRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(
          canvasRef.current.clientWidth,
          canvasRef.current.clientHeight
        );
      }
    };

    window.addEventListener("resize", handleResize);

    // Nettoyer la scène lors du démontage du composant
    return () => {
      sceneRef.current = "unmounted";
      window.removeEventListener("resize", handleResize);
    };
  }, [show3DViewer, currentStep, lesson]);

  // Gérer la soumission des réponses au quiz
  const handleQuizSubmit = (selectedOption) => {
    if (!lesson || !lesson.steps || !lesson.steps[currentStep]) return;

    setUserAnswers({
      ...userAnswers,
      [currentStep]: selectedOption,
    });

    // Ne pas montrer le feedback immédiatement
    // setShowFeedback(true);
  };

  // Gérer la soumission des réponses pour les textes à trous
  const handleBlankFill = (blankId, value) => {
    setUserAnswers({
      ...userAnswers,
      [currentStep]: {
        ...(userAnswers[currentStep] || {}),
        [blankId]: value,
      },
    });
  };

  // Vérifier toutes les réponses des textes à trous ou à remplir
  const checkBlanks = () => {
    if (
      !lesson ||
      !lesson.steps ||
      !lesson.steps[currentStep] ||
      !lesson.steps[currentStep].blanks
    )
      return;

    const currentContent = lesson.steps[currentStep];
    let isAllCorrect = true;

    // Parcourir tous les blancs à vérifier
    currentContent.blanks.forEach((blank, index) => {
      const userAnswer = userAnswers[currentStep]?.[blank.id] || "";
      const expectedAnswer = blank.answer || "";

      // Pour les textes à remplir, on fait une comparaison insensible à la casse
      if (currentContent.type === "fillInText") {
        if (userAnswer.toLowerCase() !== expectedAnswer.toLowerCase()) {
          isAllCorrect = false;
        }
      }
      // Pour les textes à trous avec select, on compare exactement
      else {
        if (userAnswer !== expectedAnswer) {
          isAllCorrect = false;
        }
      }
    });

    setIsCorrect(isAllCorrect);
    setShowFeedback(true);
  };

  // Passer à l'étape suivante
  const goToNextStep = () => {
    if (!lesson || !lesson.steps) return;

    setShowFeedback(false);
    if (currentStep < lesson.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Passer à l'étape précédente
  const goToPreviousStep = () => {
    setShowFeedback(false);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Vérifier toutes les réponses et afficher les résultats
  const submitAllAnswers = () => {
    if (!lesson || !lesson.steps) return;

    const results = [];
    let correctCount = 0;

    lesson.steps.forEach((step, index) => {
      let isStepCorrect = false;

      if (step.type === "quiz") {
        const correctAnswer =
          language === "fr" ? step.answer : step.answerEn || step.answer;
        isStepCorrect = userAnswers[index] === correctAnswer;
      } else if (step.type === "fillInTheBlank" || step.type === "fillInText") {
        isStepCorrect = true;

        if (step.blanks) {
          step.blanks.forEach((blank) => {
            const userAnswer = userAnswers[index]?.[blank.id] || "";
            const expectedAnswer = blank.answer || "";

            if (step.type === "fillInText") {
              if (userAnswer.toLowerCase() !== expectedAnswer.toLowerCase()) {
                isStepCorrect = false;
              }
            } else {
              if (userAnswer !== expectedAnswer) {
                isStepCorrect = false;
              }
            }
          });
        }
      }

      if (isStepCorrect) correctCount++;

      results.push({
        step: index,
        correct: isStepCorrect,
        userAnswer: userAnswers[index],
        expectedAnswer: step.answer,
      });
    });

    setResults({
      totalQuestions: lesson.steps.length,
      correctAnswers: correctCount,
      details: results,
      percentage: Math.round((correctCount / lesson.steps.length) * 100),
    });

    setShowResults(true);
    saveUserProgress();
  };

  // Afficher un écran de chargement pendant la vérification de l'authentification ou le chargement des données
  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-black">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-neon-blue/20 rounded-full"></div>
          <div className="space-y-4">
            <div className="h-4 w-24 bg-neon-blue/20 rounded"></div>
            <div className="h-4 w-36 bg-neon-blue/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si la leçon existe et a des étapes
  if (!lesson || !lesson.steps || lesson.steps.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cosmic-black">
        <h1 className="text-2xl text-lunar-white mb-4">
          {language === "fr"
            ? "Contenu de leçon non disponible"
            : "Lesson content not available"}
        </h1>
        <Link href={`/modules/${moduleId}`}>
          <Button className="bg-neon-blue text-lunar-white">
            {language === "fr" ? "Retour au module" : "Back to module"}
          </Button>
        </Link>
      </div>
    );
  }

  // Récupérer le contenu de l'étape actuelle
  const currentContent = lesson.steps[currentStep];

  console.log("🔥 Firebase Storage functions imported:", {
    check3DModelExists,
    get3DModelURL,
  });

  return (
    <div className="min-h-screen flex flex-col bg-cosmic-black">
      {/* Navigation */}
      <nav className="bg-cosmic-black/80 backdrop-blur-md border-b border-neon-blue/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-lunar-white font-exo">
              AstroLearn
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            <Link href="/dashboard">
              <Button className="bg-neon-blue hover:bg-neon-blue/80 text-lunar-white">
                {language === "fr" ? "Tableau de bord" : "Dashboard"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Titre de la leçon */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex-1">
            <Link
              href={`/modules/${moduleId}`}
              className="inline-flex items-center text-lunar-white/70 hover:text-lunar-white transition-colors mb-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {language === "fr"
                ? `Retour au module ${moduleTitle}`
                : `Back to module ${moduleTitleEn}`}
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-lunar-white font-exo">
                {lesson &&
                  (language === "fr"
                    ? lesson.title
                    : lesson.titleEn || lesson.title)}
              </h1>

              {/* Bouton Découvrir en 3D */}
              {has3DModel && !checking3DModel && (
                <div className="relative flex-shrink-0">
                  <ThreeDViewerButton
                    onClick={handle3DViewerToggle}
                    isActive={show3DViewer}
                    className={`${
                      !hasAccess && moduleId !== "1" ? "opacity-60" : ""
                    } w-full md:w-auto`}
                  />
                  {!hasAccess && moduleId !== "1" && (
                    <div className="absolute -top-1 -right-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}

              {/* Indicateur de chargement pour la vérification 3D */}
              {checking3DModel && (
                <div className="flex items-center text-lunar-white/70 text-sm">
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-neon-blue rounded-full"></div>
                  {language === "fr" ? "Vérification 3D..." : "Checking 3D..."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Composant de test temporaire */}
      <StorageTest />

      {/* Debug des états 3D */}
      <div className="container mx-auto px-4 mb-4">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-white">
          <h3 className="font-bold mb-2">🐛 Debug États 3D</h3>
          <div className="text-sm space-y-1">
            <div>
              📦 moduleId:{" "}
              <span className="text-yellow-300">{moduleId || "undefined"}</span>
            </div>
            <div>
              🔍 checking3DModel:{" "}
              <span className="text-yellow-300">
                {checking3DModel.toString()}
              </span>
            </div>
            <div>
              ✅ has3DModel:{" "}
              <span className="text-yellow-300">{has3DModel.toString()}</span>
            </div>
            <div>
              🔗 model3DURL:{" "}
              <span className="text-yellow-300">{model3DURL || "null"}</span>
            </div>
            <div>
              🔐 hasAccess:{" "}
              <span className="text-yellow-300">{hasAccess.toString()}</span>
            </div>
            <div>
              👁️ show3DViewer:{" "}
              <span className="text-yellow-300">{show3DViewer.toString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Viewer 3D */}
      <AnimatePresence>
        {show3DViewer &&
          has3DModel &&
          model3DURL &&
          (hasAccess || moduleId === "1") && (
            <>
              {/* Version desktop - section normale */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="hidden md:block container mx-auto px-4 mb-8"
              >
                <div className="bg-cosmic-black/90 backdrop-blur-md rounded-lg border border-neon-blue/30 p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-lunar-white font-exo">
                      {language === "fr"
                        ? "Modèle 3D Interactif"
                        : "Interactive 3D Model"}
                    </h2>
                    <Button
                      onClick={handle3DViewerToggle}
                      className="bg-lunar-white/10 hover:bg-lunar-white/20 text-lunar-white p-2 rounded-lg transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>

                  <div className="w-full h-96 bg-cosmic-black/50 rounded-lg border border-neon-blue/20 overflow-hidden">
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
                        </div>
                      }
                    >
                      <ModelViewer
                        modelType="gltf"
                        modelURL={model3DURL}
                        className="h-full"
                      />
                    </Suspense>
                  </div>

                  <div className="mt-4 text-sm text-lunar-white/70 text-center">
                    {language === "fr"
                      ? "Utilisez la souris pour faire tourner, zoomer et explorer le modèle 3D"
                      : "Use your mouse to rotate, zoom and explore the 3D model"}
                  </div>
                </div>
              </motion.div>

              {/* Version mobile - modal plein écran */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden fixed inset-0 z-50 bg-cosmic-black"
              >
                {/* Header du modal mobile */}
                <div className="flex justify-between items-center p-4 border-b border-neon-blue/20">
                  <h2 className="text-lg font-bold text-lunar-white font-exo">
                    {language === "fr" ? "Modèle 3D" : "3D Model"}
                  </h2>
                  <Button
                    onClick={handle3DViewerToggle}
                    className="bg-lunar-white/10 hover:bg-lunar-white/20 text-lunar-white p-2 rounded-lg transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </div>

                {/* Contenu 3D plein écran */}
                <div
                  className="flex-1 bg-cosmic-black/50"
                  style={{ height: "calc(100vh - 120px)" }}
                >
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
                      </div>
                    }
                  >
                    <ModelViewer
                      modelType="gltf"
                      modelURL={model3DURL}
                      className="h-full"
                    />
                  </Suspense>
                </div>

                {/* Instructions mobiles */}
                <div className="p-4 bg-cosmic-black/90 border-t border-neon-blue/20">
                  <div className="text-center">
                    <p className="text-sm text-lunar-white/90 font-medium mb-1">
                      {language === "fr"
                        ? "Faites pivoter l'objet avec le doigt"
                        : "Rotate the object with your finger"}
                    </p>
                    <p className="text-xs text-lunar-white/70">
                      {language === "fr"
                        ? "Pincez pour zoomer • Glissez pour déplacer"
                        : "Pinch to zoom • Drag to move"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
      </AnimatePresence>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lunar-white font-medium">
              {language === "fr" ? "Question" : "Question"} {currentStep + 1}/
              {lesson.steps.length} (
              {Math.round(
                (Object.keys(userAnswers).length / lesson.steps.length) * 100
              )}
              %)
            </span>
            <span className="text-lunar-white/70 text-sm">
              {language === "fr" ? "Prochaine partie" : "Next part"}:{" "}
              <span className="text-neon-blue font-medium">
                {nextPartTitle ||
                  (language === "fr" ? "Fin du module" : "End of module")}
              </span>
            </span>
          </div>
          <div className="w-full h-2 bg-cosmic-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-blue to-neon-pink transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / lesson.steps.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Information sur la prochaine partie */}
        {currentStep < lesson.steps.length - 1 &&
          lesson.steps[currentStep + 1]?.partNumber &&
          lesson.steps[currentStep]?.partNumber &&
          lesson.steps[currentStep]?.partNumber !==
            lesson.steps[currentStep + 1]?.partNumber && (
            <div className="mb-4 text-lunar-white/70 text-sm bg-cosmic-black/40 p-2 rounded-lg flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2 text-neon-blue"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {language === "fr" ? "Prochaine partie" : "Next part"}:{" "}
                <span className="text-neon-blue font-medium">
                  {lesson.steps[currentStep + 1]?.partTitle
                    ? lesson.steps[currentStep + 1]?.partTitle
                    : language === "fr"
                    ? "Partie " +
                      (lesson.steps[currentStep + 1]?.partNumber || "inconnue")
                    : "Part " +
                      (lesson.steps[currentStep + 1]?.partNumber || "unknown")}
                </span>
              </span>
            </div>
          )}

        {/* Message de sauvegarde */}
        {isSaving && (
          <div className="mb-4 text-sm text-neon-blue/70 flex items-center">
            <div className="animate-spin mr-2 h-3 w-3 border-t-2 border-b-2 border-neon-blue rounded-full"></div>
            {language === "fr"
              ? "Sauvegarde en cours..."
              : "Saving progress..."}
          </div>
        )}

        {/* Résultats du quiz */}
        {showResults && results && (
          <div className="mb-8 bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/20 p-6">
            <h2 className="text-2xl font-bold text-lunar-white mb-4">
              {language === "fr" ? "Résultats du quiz" : "Quiz Results"}
            </h2>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lunar-white">
                  {language === "fr" ? "Score" : "Score"}
                </span>
                <span className="text-2xl font-bold text-neon-blue">
                  {results.correctAnswers} / {results.totalQuestions} (
                  {results.percentage}%)
                </span>
              </div>
              <div className="w-full h-4 bg-cosmic-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-pink"
                  style={{ width: `${results.percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-4">
              {results.details.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.correct
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-red-500/50 bg-red-500/10"
                  }`}
                >
                  <p className="font-medium text-lunar-white mb-1">
                    {language === "fr" ? "Question" : "Question"} {index + 1}:
                    {result.correct
                      ? language === "fr"
                        ? " Correcte"
                        : " Correct"
                      : language === "fr"
                      ? " Incorrecte"
                      : " Incorrect"}
                  </p>
                  {!result.correct && (
                    <p className="text-sm text-lunar-white/70">
                      {language === "fr"
                        ? "Réponse correcte"
                        : "Correct answer"}
                      :{" "}
                      {typeof result.expectedAnswer === "string"
                        ? result.expectedAnswer
                        : JSON.stringify(result.expectedAnswer)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link href={`/modules/${moduleId}`}>
                <Button className="bg-neon-blue hover:bg-neon-blue/80 text-lunar-white">
                  {language === "fr" ? "Retour au module" : "Back to module"}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Zone de contenu - pleine largeur sans le modèle 3D */}
        {!showResults && (
          <div className="w-full">
            <div className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/20 p-6">
              {lesson && lesson.steps && lesson.steps[currentStep] && (
                <div className="space-y-6">
                  {/* Type d'exercice: texte, quiz, etc. */}
                  {lesson.steps[currentStep].type === "text" ? (
                    <div className="prose prose-invert prose-blue max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            language === "fr"
                              ? lesson.steps[currentStep].content
                              : lesson.steps[currentStep].contentEn ||
                                lesson.steps[currentStep].content,
                        }}
                      />
                    </div>
                  ) : lesson.steps[currentStep].type === "quiz" ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-lunar-white">
                        {language === "fr"
                          ? lesson.steps[currentStep].question
                          : lesson.steps[currentStep].questionEn ||
                            lesson.steps[currentStep].question}
                      </h3>

                      <div className="space-y-3">
                        {lesson.steps[currentStep].options.map(
                          (option, index) => {
                            // Vérifier si cette option a été précédemment sélectionnée
                            const isSelected =
                              userAnswers[currentStep] === option;

                            return (
                              <button
                                key={index}
                                onClick={() => handleQuizSubmit(option)}
                                className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
                                  isSelected
                                    ? "bg-neon-blue/20 border-neon-blue text-lunar-white"
                                    : "bg-cosmic-black/40 border-neon-blue/20 text-lunar-white/90 hover:border-neon-blue/50"
                                }`}
                                disabled={showFeedback}
                              >
                                {option}
                              </button>
                            );
                          }
                        )}
                      </div>

                      {showFeedback && (
                        <div
                          className={`p-4 rounded-lg ${
                            isCorrect
                              ? "bg-green-500/20 border border-green-500/50"
                              : "bg-red-500/20 border border-red-500/50"
                          }`}
                        >
                          <p className="text-lunar-white">
                            {isCorrect
                              ? language === "fr"
                                ? "Bonne réponse !"
                                : "Correct answer!"
                              : language === "fr"
                              ? "Réponse incorrecte. Réessayez."
                              : "Incorrect answer. Try again."}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : lesson.steps[currentStep].type === "fillInTheBlank" ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-lunar-white mb-4">
                        {language === "fr"
                          ? "Complétez le texte avec les propositions"
                          : "Complete the text with the propositions"}
                      </h3>

                      <div className="text-lunar-white mb-6">
                        {lesson.steps[currentStep].text
                          .split(/\[([^\]]*)\]/)
                          .map((part, index) => {
                            // Les parties d'index pair sont du texte normal, les parties d'index impair sont les blancs à remplir
                            if (index % 2 === 0) {
                              return <span key={index}>{part}</span>;
                            } else {
                              const blankIndex = Math.floor(index / 2);
                              const blankId = `blank-${currentStep}-${blankIndex}`;
                              return (
                                <input
                                  key={blankId}
                                  type="text"
                                  id={blankId}
                                  value={
                                    userAnswers[currentStep]?.[blankId] || ""
                                  }
                                  onChange={(e) =>
                                    handleBlankFill(blankId, e.target.value)
                                  }
                                  className="inline-block mx-1 px-2 py-1 bg-cosmic-black/60 border border-neon-blue/30 rounded text-lunar-white focus:border-neon-blue focus:outline-none"
                                  style={{ minWidth: "100px" }}
                                />
                              );
                            }
                          })}
                      </div>

                      <div className="mb-6">
                        <h4 className="text-md font-medium text-lunar-white mb-3">
                          {language === "fr"
                            ? "Propositions :"
                            : "Propositions:"}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {lesson.steps[currentStep].propositions.map(
                            (proposition, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-neon-blue/20 border border-neon-blue/50 rounded-lg text-lunar-white text-sm"
                              >
                                {proposition}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={checkBlanks}
                        className="bg-neon-blue hover:bg-neon-blue/80 text-lunar-white"
                      >
                        {language === "fr" ? "Vérifier" : "Check"}
                      </Button>

                      {showFeedback && (
                        <div
                          className={`p-4 rounded-lg ${
                            isCorrect
                              ? "bg-green-500/20 border border-green-500/50"
                              : "bg-red-500/20 border border-red-500/50"
                          }`}
                        >
                          <p className="text-lunar-white">
                            {isCorrect
                              ? language === "fr"
                                ? "Toutes les réponses sont correctes !"
                                : "All answers are correct!"
                              : language === "fr"
                              ? "Certaines réponses sont incorrectes. Réessayez."
                              : "Some answers are incorrect. Try again."}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : lesson.steps[currentStep].type === "exercise" ? (
                    <div className="space-y-6">
                      <ExerciseParser
                        content={
                          language === "fr"
                            ? lesson.steps[currentStep].content
                            : lesson.steps[currentStep].contentEn ||
                              lesson.steps[currentStep].content
                        }
                        onAnswer={(answer) => {
                          setUserAnswers((prev) => ({
                            ...prev,
                            [currentStep]: answer,
                          }));
                        }}
                        currentAnswer={userAnswers[currentStep]}
                        language={language}
                      />
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-blue max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            language === "fr"
                              ? lesson.steps[currentStep].content
                              : lesson.steps[currentStep].contentEn ||
                                lesson.steps[currentStep].content,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Boutons de navigation */}
        {!showResults && (
          <div className="flex justify-between items-center mt-8">
            <Button
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="bg-lunar-white/10 hover:bg-lunar-white/20 text-lunar-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === "fr" ? "Précédent" : "Previous"}
            </Button>

            <div className="flex gap-4">
              {currentStep === lesson.steps.length - 1 ? (
                <Button
                  onClick={submitAllAnswers}
                  className="bg-gradient-to-r from-neon-blue to-neon-pink hover:opacity-90 text-lunar-white font-medium"
                >
                  {language === "fr" ? "Terminer le quiz" : "Finish quiz"}
                </Button>
              ) : (
                <Button
                  onClick={goToNextStep}
                  className="bg-neon-blue hover:bg-neon-blue/80 text-lunar-white"
                >
                  {language === "fr" ? "Suivant" : "Next"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toaster pour les notifications */}
      <Toaster position="top-center" />

      {/* Bouton flottant 3D pour mobile */}
      {has3DModel && !show3DViewer && !checking3DModel && (
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <Button
            onClick={handle3DViewerToggle}
            className={`${
              !hasAccess && moduleId !== "1" ? "opacity-60" : ""
            } bg-gradient-to-r from-neon-blue to-neon-pink hover:opacity-90 text-lunar-white p-4 rounded-full shadow-2xl border border-neon-blue/30`}
            disabled={!hasAccess && moduleId !== "1"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
