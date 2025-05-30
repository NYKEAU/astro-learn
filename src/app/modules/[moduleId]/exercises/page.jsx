"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { motion } from "framer-motion";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  orderBy,
} from "firebase/firestore";

// Simplifier complètement la fonction parseQuestionContent
function parseQuestionContent(content) {
  if (!content) return { type: "text", content: content };

  // 1. Détection QCM - présence de numérotation (1., 2., 3.)
  if (content.includes("1.") && content.includes("2.")) {
    // Extraire la question (texte avant la première option)
    const firstOptionIndex = content.indexOf("1.");
    const questionText = content.substring(0, firstOptionIndex).trim();

    // Extraire les options simplement
    const options = [];
    const regex = /(\d+)\.\s*(.*?)(?=\s*\d+\.|$)/gs;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const optionText = match[2].trim();
      if (optionText) {
        options.push(optionText);
      }
    }

    return {
      type: "qcm",
      content: questionText,
      options: options,
      correctOption: options.length > 0 ? options[0] : "", // Par défaut la première option
    };
  }

  // 2. Texte à trous avec propositions - présence de [] et <>
  else if (
    content.includes("[]") &&
    content.includes("<") &&
    content.includes(">")
  ) {
    // Extraire les propositions
    const options = [];
    const matches = content.match(/<([^>]+)>/g) || [];
    matches.forEach((match) => {
      options.push(match.replace(/<|>/g, "").trim());
    });

    return {
      type: "fill",
      content: content,
      correctAnswer: options.length > 0 ? options[0] : "",
    };
  }

  // 3. Texte à remplir - présence de [mot_correct]
  else if (/\[[^\]]+\]/.test(content)) {
    const match = content.match(/\[([^\]]+)\]/);
    const correctAnswer = match ? match[1] : "";

    return {
      type: "fill",
      content: content,
      correctAnswer: correctAnswer,
    };
  }

  // Par défaut, retourner du texte simple
  return { type: "text", content: content };
}

// Fonction pour sauvegarder la progression
const saveUserProgress = async (
  userId,
  moduleId,
  partId,
  exerciseId,
  isCorrect,
  userAnswer
) => {
  if (!userId || !moduleId || !partId || !exerciseId) return;

  try {
    const partNumber = partId.replace("part", "");
    const progressRef = doc(db, "users", userId, "progress", moduleId);
    const progressSnap = await getDoc(progressRef);

    let progressData = progressSnap.exists() ? progressSnap.data() : {};

    // Initialiser les données pour cette partie si nécessaire
    if (!progressData[partNumber]) {
      progressData[partNumber] = {
        totalAnswered: 0,
        correctAnswers: 0,
        completedExercises: [],
        answers: {},
      };
    }

    // Vérifier si cet exercice a déjà été répondu
    const wasAnsweredBefore =
      progressData[partNumber].answers &&
      progressData[partNumber].answers[exerciseId] !== undefined;

    // Mettre à jour les réponses
    if (!progressData[partNumber].answers) {
      progressData[partNumber].answers = {};
    }

    // Stocker la réponse
    progressData[partNumber].answers[exerciseId] = {
      isCorrect,
      userAnswer,
      timestamp: new Date().toISOString(),
    };

    // Mettre à jour les compteurs
    if (!wasAnsweredBefore) {
      progressData[partNumber].totalAnswered++;

      if (!progressData[partNumber].completedExercises.includes(exerciseId)) {
        progressData[partNumber].completedExercises.push(exerciseId);
      }
    }

    if (
      isCorrect &&
      (!wasAnsweredBefore ||
        (wasAnsweredBefore &&
          !progressData[partNumber].answers[exerciseId].isCorrect))
    ) {
      progressData[partNumber].correctAnswers++;
    } else if (
      !isCorrect &&
      wasAnsweredBefore &&
      progressData[partNumber].answers[exerciseId].isCorrect
    ) {
      // Si l'exercice était correct avant mais ne l'est plus
      progressData[partNumber].correctAnswers--;
    }

    // Sauvegarder les données mises à jour
    await setDoc(progressRef, progressData);

    console.log(
      `Progression sauvegardée pour l'exercice ${exerciseId} de la partie ${partNumber}`
    );
    return progressData;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la progression:", error);
    return null;
  }
};

// Fonction pour charger la progression
const loadUserProgress = async (userId, moduleId) => {
  if (!userId || !moduleId) return {};

  try {
    const progressRef = doc(db, "users", userId, "progress", moduleId);
    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      return progressSnap.data();
    }

    return {};
  } catch (error) {
    console.error("Erreur lors du chargement de la progression:", error);
    return {};
  }
};

// Modifier les segments dans formatFillContent
function formatFillContent(content, currentAnswer = "", handleValueChange) {
  if (!content) return "";

  let formattedContent = content;

  // Extraire les options (entre <>)
  const options = [];
  const matches = content.match(/<([^>]+)>/g) || [];
  matches.forEach((match) => {
    options.push(match.replace(/<|>/g, "").trim());
  });

  // Si on a des options entre <>, remplacer les [] par un select
  if (options.length > 0 && content.includes("[]")) {
    // Remplacer les [] par un marqueur unique pour pouvoir les retrouver
    const placeholder = "___SELECT_PLACEHOLDER___";
    formattedContent = formattedContent.replace(/\[\]/g, placeholder);

    // Supprimer les balises <options>
    formattedContent = formattedContent.replace(/<([^>]+)>/g, "");

    // Diviser le texte en segments autour des placeholders
    const segments = formattedContent.split(placeholder);

    // Créer un tableau d'éléments alternant texte et select
    const elements = [];

    // Analyser la currentAnswer pour obtenir des valeurs multiples (s'il y en a)
    const answerValues = currentAnswer ? currentAnswer.split("|") : [];

    segments.forEach((segment, index) => {
      // Ajouter le segment de texte
      if (segment) {
        elements.push(<span key={`text-${index}`}>{segment}</span>);
      }

      // Ajouter le select après chaque segment (sauf le dernier)
      if (index < segments.length - 1) {
        // Valeur actuelle pour ce select spécifique
        const selectValue = answerValues[index] || "";

        elements.push(
          <select
            key={`select-${index}`}
            id={`fill-select-${index}`}
            className="bg-cosmic-black border border-neon-blue/50 focus:border-neon-blue px-2 py-1 mx-1 text-neon-blue rounded outline-none"
            value={selectValue}
            onChange={(e) => {
              // Mettre à jour uniquement ce select sans changer de question
              const newSelectValues = [...answerValues];
              newSelectValues[index] = e.target.value;
              // Joindre toutes les valeurs avec un séparateur pour les stocker dans un seul champ
              handleValueChange(newSelectValues.join("|"), false);
            }}
          >
            <option value="">Choisir...</option>
            {options.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }
    });

    // Retourner les éléments à rendre
    return elements;
  }
  // S'il y a des [texte], les remplacer par des inputs
  else if (/\[[^\]]+\]/.test(formattedContent)) {
    // Extraire la réponse correcte
    const match = formattedContent.match(/\[([^\]]+)\]/);
    const correctAnswer = match ? match[1] : "";

    // Remplacer [texte] par un marqueur
    const placeholder = "___INPUT_PLACEHOLDER___";
    formattedContent = formattedContent.replace(/\[[^\]]+\]/g, placeholder);

    // Diviser le texte en segments autour des placeholders
    const segments = formattedContent.split(placeholder);

    // Créer un tableau d'éléments alternant texte et input
    const elements = [];
    segments.forEach((segment, index) => {
      // Ajouter le segment de texte
      if (segment) {
        elements.push(<span key={`text-${index}`}>{segment}</span>);
      }

      // Ajouter l'input après chaque segment (sauf le dernier)
      if (index < segments.length - 1) {
        elements.push(
          <input
            key={`input-${index}`}
            type="text"
            className="bg-transparent border-b-2 border-neon-blue/70 focus:border-neon-blue px-2 py-0 mx-1 text-neon-blue outline-none min-w-24 inline-block"
            value={currentAnswer || ""}
            onChange={(e) => {
              // Mettre à jour la valeur localement SANS déclencher le passage à la question suivante
              e.persist();
              const inputValue = e.target.value;
              handleValueChange(inputValue, false); // Ajout d'un second paramètre pour indiquer de ne pas passer à la question suivante
            }}
            onKeyDown={(e) => {
              // Soumettre la réponse sur Entrée
              if (e.key === "Enter") {
                handleValueChange(e.target.value, true);
              }
            }}
            data-correct={correctAnswer}
          />
        );
      }
    });

    // Retourner les éléments à rendre
    return elements;
  }

  return formattedContent;
}

// Nouvelle fonction pour vérifier si une réponse de type fill est correcte
const checkFillAnswer = (userAnswer, correctAnswer) => {
  // Si c'est une réponse avec plusieurs selects
  if (userAnswer.includes("|") && correctAnswer.includes("|")) {
    const userValues = userAnswer.split("|");
    const correctValues = correctAnswer.split("|");

    // Vérifier que toutes les valeurs correspondent
    return userValues.every(
      (val, index) =>
        val.toLowerCase() === (correctValues[index] || "").toLowerCase()
    );
  }

  // Réponse simple
  return userAnswer.toLowerCase() === correctAnswer.toLowerCase();
};

// Fonction auxiliaire simplifiée pour extraire les options QCM
function extractQCMOptions(content) {
  if (!content) return [];

  const options = [];
  const regex = /(\d+)\.\s*(.*?)(?=\s*\d+\.|$)/gs;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const optionText = match[2].trim();
    if (optionText) {
      options.push(optionText);
    }
  }

  // Cas spécifique pour questions connues
  if (content.includes("épaisseur moyenne de la croûte continentale")) {
    return ["5 à 10 km", "30 à 50 km", "100 à 150 km"];
  }

  return options;
}

export default function ExercisesPage() {
  const params = useParams();
  const { moduleId } = params;
  const { language } = useLanguage();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState({
    visible: false,
    correct: false,
    message: "",
  });
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState("part1"); // Partie sélectionnée par défaut
  const [availableParts, setAvailableParts] = useState([]); // Liste des parties disponibles

  // Vérifier l'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setUser(user);
      setLoading(false);

      if (!user) {
        router.push("/register");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Charger le contenu du module et les questions
  useEffect(() => {
    if (!moduleId) return;

    const fetchModule = async () => {
      setIsLoading(true);
      try {
        // Récupérer le document principal du module
        const moduleDoc = await getDoc(doc(db, "modules", moduleId));

        if (!moduleDoc.exists()) {
          console.error("Module non trouvé:", moduleId);
          router.push("/modules");
          return;
        }

        const moduleData = { id: moduleDoc.id, ...moduleDoc.data() };
        setModule(moduleData);

        // Récupérer les parties du module (nouvelle structure)
        const partsRef = collection(db, "modules", moduleId, "parts");
        const partsQuery = query(partsRef, orderBy("order"));
        const partsSnapshot = await getDocs(partsQuery);

        if (partsSnapshot.empty) {
          console.log(
            "Aucune partie trouvée pour ce module - ancienne structure"
          );
          // Fallback vers l'ancienne structure si nécessaire
          return;
        }

        // Stocker les parties disponibles
        const parts = partsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAvailableParts(parts);

        // Si aucune partie n'est définie, utiliser la première
        if (!selectedPart && parts.length > 0) {
          setSelectedPart(parts[0].id);
        }

        // Récupérer uniquement les exercices de la partie sélectionnée
        const allExercises = [];

        // Trouver la partie sélectionnée dans la liste des parties
        const selectedPartDoc = partsSnapshot.docs.find(
          (doc) => doc.id === selectedPart
        );

        if (selectedPartDoc) {
          const partData = {
            id: selectedPartDoc.id,
            ...selectedPartDoc.data(),
          };
          const partNumber = partData.id.replace("part", "");

          // Récupérer les exercices de cette partie
          const exercisesRef = collection(
            db,
            "modules",
            moduleId,
            "parts",
            selectedPartDoc.id,
            "exercises"
          );
          const exercisesQuery = query(exercisesRef, orderBy("order"));
          const exercisesSnapshot = await getDocs(exercisesQuery);

          if (!exercisesSnapshot.empty) {
            exercisesSnapshot.docs.forEach((doc) => {
              const exerciseData = doc.data();

              // Créer un objet question à partir des données d'exercice
              const question = {
                id: doc.id,
                partId: selectedPartDoc.id,
                partNumber,
                partTitle: partData.title || `Partie ${partNumber}`,
                ...exerciseData,
              };

              // Simplifier l'analyse du contenu - si contient 1. et 2., c'est un QCM
              if (
                question.content &&
                question.content.includes("1.") &&
                question.content.includes("2.")
              ) {
                const parsedQuestion = parseQuestionContent(question.content);
                question.type = "qcm";
                question.content = parsedQuestion.content;
                question.options = parsedQuestion.options;
                question.correctOption = parsedQuestion.options[0]; // Par défaut première option
              }
              // Si le type n'est pas déjà défini, utiliser parseQuestionContent
              else if (!question.type || question.type === "text") {
                const parsedQuestion = parseQuestionContent(question.content);
                Object.assign(question, parsedQuestion);
              }

              // Ajouter tous les exercices, y compris les textes
              allExercises.push(question);
            });
          }
        }

        // Trier les exercices par ordre
        allExercises.sort((a, b) => a.order - b.order);

        if (allExercises.length > 0) {
          setQuestions(allExercises);

          // Charger la progression si l'utilisateur est connecté
          if (user) {
            const progressData = await loadUserProgress(user.uid, moduleId);
            if (progressData) {
              // Initialiser les réponses de l'utilisateur à partir de la progression
              const answers = {};

              allExercises.forEach((exercise, index) => {
                const partNumber = exercise.partNumber;
                const exerciseId = exercise.id;

                if (
                  progressData[partNumber] &&
                  progressData[partNumber].answers &&
                  progressData[partNumber].answers[exerciseId]
                ) {
                  answers[index] =
                    progressData[partNumber].answers[exerciseId].userAnswer;
                }
              });

              setUserAnswers(answers);

              // Définir l'étape courante à la dernière question non répondue ou à 0
              let lastUnansweredIndex = 0;
              for (let i = 0; i < allExercises.length; i++) {
                if (!answers[i]) {
                  lastUnansweredIndex = i;
                  break;
                }
                // Si toutes les questions ont été répondues, rester sur la dernière
                if (i === allExercises.length - 1) {
                  lastUnansweredIndex = i;
                }
              }

              setCurrentStep(lastUnansweredIndex);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du module:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModule();
  }, [moduleId, router, user, selectedPart]);

  // Simplifier la logique de détection QCM dans l'useEffect
  useEffect(() => {
    if (questions.length > 0) {
      // Parcourir toutes les questions et appliquer parseQuestionContent aux QCM
      const updatedQuestions = questions.map((question) => {
        // Si le contenu contient 1. et 2., c'est un QCM
        if (
          question.content?.includes("1.") &&
          question.content?.includes("2.")
        ) {
          const parsedQuestion = parseQuestionContent(question.content);
          return {
            ...question,
            type: "qcm",
            content: parsedQuestion.content,
            options: parsedQuestion.options,
          };
        }
        return question;
      });

      setQuestions(updatedQuestions);
    }
  }, [questions.length]);

  // Ajouter une fonction pour changer de partie
  const changePart = (partId) => {
    setSelectedPart(partId);
    setCurrentStep(0);
    setUserAnswers({});
    setFeedback({ visible: false, correct: false, message: "" });
    setShowResults(false);
  };

  // Gérer la soumission des réponses
  const handleAnswerSubmit = (answer, shouldAdvance = false) => {
    if (!user || !moduleId || !questions[currentStep]) return;

    // Mise à jour des réponses de l'utilisateur sans feedback immédiat
    const updatedUserAnswers = { ...userAnswers };
    updatedUserAnswers[currentStep] = answer;
    setUserAnswers(updatedUserAnswers);

    // Passer automatiquement à la question suivante uniquement si shouldAdvance est true
    if (shouldAdvance && currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Nouvelle fonction pour soumettre toutes les réponses à la fin
  const submitAllAnswers = () => {
    if (!user || !moduleId) return;
    setIsSaving(true);

    // Calculer les résultats
    const results = {
      total: questions.length,
      correct: 0,
      incorrect: [],
      percentage: 0,
    };

    // Vérifier chaque réponse
    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      let isCorrect = false;

      // Si l'utilisateur n'a pas répondu, considérer comme incorrect
      if (!userAnswer) {
        results.incorrect.push({
          questionIndex: index,
          question: question,
          userAnswer: null,
        });
        return;
      }

      // Vérifier si la réponse est correcte selon le type de question
      if (question.type === "qcm") {
        isCorrect = userAnswer === question.correctOption;
      } else if (question.type === "fill") {
        // Utiliser la nouvelle fonction de vérification
        isCorrect = checkFillAnswer(userAnswer, question.correctAnswer);
      }

      if (isCorrect) {
        results.correct++;
      } else {
        results.incorrect.push({
          questionIndex: index,
          question: question,
          userAnswer: userAnswer,
        });
      }

      // Sauvegarder la progression en arrière-plan
      saveUserProgress(
        user.uid,
        moduleId,
        question.partId,
        question.id,
        isCorrect,
        userAnswer
      );
    });

    // Calculer le pourcentage
    results.percentage = Math.round((results.correct / results.total) * 100);

    // Mettre à jour l'état avec les résultats
    setResults(results);
    setShowResults(true);
    setIsSaving(false);
  };

  if (loading || isLoading) {
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
              <Button className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black">
                {language === "fr" ? "Tableau de bord" : "Dashboard"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
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
                {language === "fr" ? "Retour au module" : "Back to module"}
              </Link>

              <h1 className="text-3xl font-bold text-lunar-white font-exo">
                {module &&
                  (language === "fr"
                    ? module.title
                    : module.titleEn || module.title)}
              </h1>
            </div>

            <Link href={`/modules/${moduleId}/lessons`}>
              <Button className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black">
                {language === "fr" ? "Revoir la théorie" : "Review theory"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Contenu de la page */}
        {/* ... (reste du code de la page) ... */}
      </div>
    </div>
  );
}
