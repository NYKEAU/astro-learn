"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { motion } from "framer-motion";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { db, isProduction } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { useModuleAccess } from "@/lib/hooks/useModuleAccess";
import { Lock } from "lucide-react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import {
  saveExerciseAnswer,
  getModuleProgress,
  initializeModuleProgress,
} from "@/lib/firebase/progress";
import { isCloseEnough } from "@/lib/utils/index";
Chart.register(ArcElement, Tooltip, Legend);

// Fonction de logging conditionnelle
const debugLog = (...args) => {
  if (!isProduction) {
    console.log(...args);
  }
};

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
  userAnswer,
  totalExercisesInModule = null
) => {
  if (!userId || !moduleId || !partId || !exerciseId) {
    console.error("❌ Paramètres manquants pour saveUserProgress");
    return null;
  }

  try {
    debugLog(
      `💾 saveUserProgress appelé: Module ${moduleId}, Partie ${partId}, Exercice ${exerciseId}`
    );
    debugLog(`📊 totalExercisesInModule reçu: ${totalExercisesInModule}`);

    const result = await saveExerciseAnswer(
      userId,
      moduleId,
      partId,
      exerciseId,
      userAnswer,
      isCorrect,
      totalExercisesInModule
    );

    if (result) {
      debugLog(`✅ Progression sauvegardée avec succès`);
      debugLog(
        `📊 Score actuel: ${result.score}/${result.totalExercises} (${result.percentage}%)`
      );

      // Si le module vient d'être complété, afficher une notification
      if (result.completed && result.percentage >= 80) {
        debugLog(`🎉 Module ${moduleId} complété !`);
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde:", error);
    return null;
  }
};

// Fonction pour charger la progression
const loadUserProgress = async (userId, moduleId) => {
  if (!userId || !moduleId) {
    console.error("❌ Paramètres manquants pour loadUserProgress");
    return {};
  }

  try {
    debugLog(`📊 Chargement de la progression: Module ${moduleId}`);

    const progressData = await getModuleProgress(userId, moduleId);

    if (progressData) {
      debugLog(`✅ Progression chargée:`, progressData);
      return progressData;
    } else {
      debugLog(`📭 Aucune progression trouvée, initialisation...`);
      await initializeModuleProgress(userId, moduleId);
      return {};
    }
  } catch (error) {
    console.error("❌ Erreur lors du chargement:", error);
    return {};
  }
};

// Modifier les segments dans formatFillContent
function formatFillContent(content, currentAnswer = "", onAnswerChange) {
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
              // Mettre à jour uniquement ce select et sauvegarder automatiquement
              const newSelectValues = [...answerValues];
              newSelectValues[index] = e.target.value;
              const newAnswer = newSelectValues.join("|");
              onAnswerChange(newAnswer);
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
              // Mettre à jour la valeur localement SANS sauvegarder
              const inputValue = e.target.value;
              onAnswerChange(inputValue);
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

// Helpers pour affichage et validation
function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[ -\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "");
}
function renderFillText(question, value, onChange) {
  const match = question.content.match(/\[[^\]]*\]/);
  const parts = question.content.split(/\[[^\]]*\]/);
  return (
    <span>
      {parts[0]}
      <input
        type="text"
        className="inline-block w-48 px-2 py-1 rounded border-2 border-neon-blue/70 bg-cosmic-black text-neon-blue text-xl font-mono mx-2"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      {parts[1]}
    </span>
  );
}
function renderFillDragText(question, value, onChange) {
  const cleanedContent = question.content.replace(/<[^>]+>/g, "");
  const parts = cleanedContent.split("[]");
  const options = question.options || [];
  const answerValues = Array.isArray(value)
    ? value
    : value
    ? value.split("|")
    : [];
  return (
    <span>
      {parts.map((part, i) => (
        <span key={`part-${i}`}>
          {part}
          {i < parts.length - 1 && (
            <select
              key={`select-${i}`}
              className="bg-cosmic-black border border-neon-blue/50 focus:border-neon-blue px-2 py-1 mx-1 text-neon-blue rounded outline-none"
              value={answerValues[i] || ""}
              onChange={(e) => {
                const newAnswers = [...answerValues];
                newAnswers[i] = e.target.value;
                onChange(newAnswers.join("|"));
              }}
            >
              <option value="">Choisir...</option>
              {options.map((opt, idx) => (
                <option
                  key={idx}
                  value={opt}
                  disabled={
                    answerValues.includes(opt) && answerValues[i] !== opt
                  }
                >
                  {opt}
                </option>
              ))}
            </select>
          )}
        </span>
      ))}
    </span>
  );
}

export default function ExercisesPage() {
  const params = useParams();
  const { moduleId: moduleSlug } = params;
  const { language } = useLanguage();
  const router = useRouter();
  const { canAccessModule } = useModuleAccess();

  // Extraire l'ID réel du module à partir du slug (ex: "1-la_terre" -> "1")
  const moduleId = moduleSlug.split("-")[0];

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
  const [hasAccess, setHasAccess] = useState(false);

  // Vérifier l'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Vérifier l'accès au module et rediriger si nécessaire
  useEffect(() => {
    if (moduleId) {
      const moduleAccess = canAccessModule(moduleId);
      setHasAccess(moduleAccess);

      // Rediriger si l'utilisateur n'a pas accès au module, sauf pour "1"
      if (!moduleAccess && moduleId !== "1") {
        console.log("Accès refusé au module:", moduleId);
        router.push("/modules");
      }
    }
  }, [moduleId, isAuthenticated, user, router]);

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
        console.log("Parts Firestore:", parts);
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
        console.log("Selected part:", selectedPart);

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
          console.log(
            "Exercices Firestore:",
            exercisesSnapshot.docs.map((doc) => doc.data())
          );

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

              if (question.type === "qcm") {
                if (!question.options && question.content) {
                  question.options = extractQCMOptions(question.content);
                  question.correctOption = question.options[0];
                }
                allExercises.push(question);
              } else if (question.type === "fill") {
                if (!question.correctAnswer && question.content) {
                  const match = question.content.match(/\[([^\]]+)\]/);
                  question.correctAnswer = match ? match[1] : "";
                }
                allExercises.push(question);
              } else if (question.type === "fillDrag") {
                if (!question.options && question.content) {
                  const matches = question.content.match(/<([^>]+)>/g) || [];
                  question.options = matches.map((m) =>
                    m.replace(/<|>/g, "").trim()
                  );
                }
                if (!question.correctAnswer && question.content) {
                  const match = question.content.match(/\[([^\]]+)\]/);
                  question.correctAnswer = match ? match[1] : "";
                }
                allExercises.push(question);
              }
            });
          }
        }

        console.log("allExercises:", allExercises);
        // Trier les exercices par ordre
        allExercises.sort((a, b) => a.order - b.order);

        if (allExercises.length > 0) {
          console.log("setQuestions:", allExercises);
          setQuestions(allExercises);

          // Charger la progression si l'utilisateur est connecté
          if (user) {
            const progressData = await loadUserProgress(user.uid, moduleId);
            if (progressData && progressData.parts) {
              // Initialiser les réponses de l'utilisateur à partir de la nouvelle structure
              const answers = {};

              allExercises.forEach((exercise, index) => {
                const partId = exercise.partId;
                const exerciseId = exercise.id;

                // Vérifier si la réponse existe dans la nouvelle structure
                if (
                  progressData.parts[partId] &&
                  progressData.parts[partId][exerciseId]
                ) {
                  const exerciseData = progressData.parts[partId][exerciseId];
                  answers[index] = exerciseData.userAnswer;
                  console.log(
                    `📝 Réponse chargée pour ${exerciseId}: ${
                      exerciseData.userAnswer
                    } (${exerciseData.isCorrect ? "✅" : "❌"})`
                  );
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
              console.log(
                `🎯 Progression chargée: ${Object.keys(answers).length}/${
                  allExercises.length
                } exercices complétés`
              );
            } else {
              console.log("Aucune progression trouvée, démarrage à zéro");
            }
          }
        } else {
          console.log("Aucun exercice trouvé pour cette partie.");
        }
      } catch (error) {
        console.error("Erreur lors du chargement du module:", error);
        // En cas d'erreur de permissions, rediriger
        if (error.code === "permission-denied") {
          console.log(
            "Erreur de permissions, redirection vers la liste des modules"
          );
          router.push("/modules");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchModule();
  }, [moduleId, router, user, selectedPart, isAuthenticated]);

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
  const handleAnswerSubmit = async (answer, shouldAdvance = false) => {
    if (!user || !moduleId || !questions[currentStep]) return;

    console.log(
      `🎯 handleAnswerSubmit appelé - Question ${currentStep + 1}/${
        questions.length
      }`
    );
    console.log(`📝 Réponse: "${answer}"`);

    // Mise à jour des réponses de l'utilisateur
    const updatedUserAnswers = { ...userAnswers };
    updatedUserAnswers[currentStep] = answer;
    setUserAnswers(updatedUserAnswers);

    // Déterminer si la réponse est correcte
    const question = questions[currentStep];
    let isCorrect = false;

    if (question.type === "qcm") {
      isCorrect = answer === question.correctOption;
    } else if (question.type === "fill") {
      isCorrect = isCloseEnough(answer, question.correctAnswer);
    } else if (question.type === "fillDrag") {
      const userVals = (answer || "").split("|");
      const correctVals = (question.correctAnswer || "").split("|");
      isCorrect =
        userVals.length === correctVals.length &&
        userVals.every(
          (ans, i) => normalize(ans) === normalize(correctVals[i])
        );
    }

    console.log(`✅ Réponse ${isCorrect ? "correcte" : "incorrecte"}`);

    // Sauvegarder immédiatement la progression
    try {
      console.log(
        `💾 Sauvegarde immédiate avec totalExercises: ${questions.length}`
      );

      const progressResult = await saveUserProgress(
        user.uid,
        moduleId,
        question.partId,
        question.id,
        isCorrect,
        answer,
        questions.length
      );

      if (progressResult) {
        console.log(
          `📊 Progression mise à jour: ${progressResult.score}/${progressResult.totalExercises} (${progressResult.percentage}%)`
        );

        // Afficher une notification si le module vient d'être complété
        if (progressResult.completed && progressResult.percentage >= 80) {
          console.log(`🎉 Module ${moduleId} complété !`);
          // TODO: Ajouter une vraie notification UI
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde immédiate:", error);
    }

    // Passer automatiquement à la question suivante si demandé
    if (shouldAdvance && currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Fonction pour mettre à jour les réponses localement sans sauvegarder
  const updateUserAnswer = (answer) => {
    const updatedUserAnswers = { ...userAnswers };
    updatedUserAnswers[currentStep] = answer;
    setUserAnswers(updatedUserAnswers);
  };

  // Fonction pour calculer et afficher les résultats finaux
  const submitAllAnswers = () => {
    if (!user || !moduleId) return;
    setIsSaving(true);

    console.log(
      `🎯 Calcul des résultats finaux - Total questions: ${questions.length}`
    );

    // Calculer les résultats (la progression est déjà sauvegardée à chaque question)
    const results = {
      total: questions.length,
      correct: 0,
      incorrect: [],
      percentage: 0,
    };

    // Vérifier chaque réponse pour les résultats d'affichage
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
        isCorrect = isCloseEnough(userAnswer, question.correctAnswer);
      } else if (question.type === "fillDrag") {
        const userVals = (userAnswer || "").split("|");
        const correctVals = (question.correctAnswer || "").split("|");
        isCorrect =
          userVals.length === correctVals.length &&
          userVals.every(
            (ans, i) => normalize(ans) === normalize(correctVals[i])
          );
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
    });

    // Calculer le pourcentage
    results.percentage = Math.round((results.correct / results.total) * 100);

    console.log(
      `📊 Résultats finaux: ${results.correct}/${results.total} (${results.percentage}%)`
    );

    // Mettre à jour l'état avec les résultats pour l'affichage
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
      {/* Message d'avertissement pour modules non autorisés */}
      {moduleId !== "1" && !hasAccess && (
        <div className="bg-red-500/20 text-white border-b border-red-500/50 py-2 px-4 text-center">
          <div className="container mx-auto flex items-center justify-center">
            <Lock className="w-4 h-4 mr-2 text-red-300" />
            <p>
              {language === "fr"
                ? "Vous n'êtes pas autorisé à accéder à ce module. Le contenu affiché peut être limité."
                : "You are not authorized to access this module. The content displayed may be limited."}
            </p>
          </div>
        </div>
      )}

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
        {questions.length > 0 ? (
          showResults ? (
            results ? (
              <div className="max-w-xl mx-auto bg-gradient-to-br from-cosmic-black via-cosmic-black/80 to-neon-blue/10 rounded-2xl p-10 shadow-2xl text-lunar-white flex flex-col items-center">
                <h2 className="text-4xl font-extrabold mb-6 text-neon-blue drop-shadow">
                  {language === "fr" ? "Résultats" : "Results"}
                </h2>
                <div className="w-48 h-48 mb-6">
                  <Pie
                    data={{
                      labels: [
                        language === "fr" ? "Bonnes réponses" : "Correct",
                        language === "fr" ? "Mauvaises réponses" : "Incorrect",
                      ],
                      datasets: [
                        {
                          data: [
                            results.correct,
                            results.total - results.correct,
                          ],
                          backgroundColor: ["#00CFFF", "#22223B"],
                          borderColor: ["#00CFFF", "#22223B"],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      plugins: {
                        legend: {
                          display: true,
                          position: "bottom",
                          labels: { color: "#fff", font: { size: 16 } },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `${context.label}: ${
                                context.parsed
                              } (${Math.round(
                                (context.parsed / results.total) * 100
                              )}%)`;
                            },
                          },
                        },
                      },
                      cutout: "60%",
                    }}
                  />
                </div>
                <div className="text-2xl font-bold mb-2">
                  {language === "fr"
                    ? `Score : ${results.correct} / ${results.total} (${results.percentage}%)`
                    : `Score: ${results.correct} / ${results.total} (${results.percentage}%)`}
                </div>
                <div className="text-lg mb-8 text-center">
                  {results.percentage < 50 &&
                    (language === "fr"
                      ? "Courage ! Revois la théorie et réessaie, tu vas progresser."
                      : "Keep going! Review the theory and try again, you'll improve.")}
                  {results.percentage >= 50 &&
                    results.percentage < 80 &&
                    (language === "fr"
                      ? "Bien joué ! Encore un petit effort pour tout maîtriser."
                      : "Well done! A little more effort to master everything.")}
                  {results.percentage >= 80 &&
                    (language === "fr"
                      ? "Excellent ! Tu maîtrises très bien ce chapitre."
                      : "Excellent! You master this chapter very well.")}
                </div>
                <a href={`/modules/${moduleId}/lessons`}>
                  <button className="px-8 py-3 bg-neon-blue text-cosmic-black rounded-xl text-lg font-bold shadow hover:bg-neon-blue/80 transition mb-2">
                    {language === "fr" ? "Revoir la théorie" : "Review theory"}
                  </button>
                </a>
                <button
                  className="mt-2 px-8 py-2 bg-lunar-white/10 text-lunar-white rounded-xl text-lg font-semibold hover:bg-lunar-white/20 transition"
                  onClick={() => window.location.reload()}
                >
                  {language === "fr" ? "Recommencer" : "Restart"}
                </button>
              </div>
            ) : (
              <div className="text-lunar-white text-center text-xl py-10">
                {language === "fr"
                  ? "Chargement des résultats..."
                  : "Loading results..."}
              </div>
            )
          ) : (
            <div className="w-full max-w-5xl mx-auto bg-gradient-to-br from-cosmic-black via-cosmic-black/80 to-neon-blue/10 rounded-2xl p-20 shadow-2xl min-h-[700px] h-[700px] flex flex-col justify-between space-y-8">
              <div>
                <div className="mb-8 text-lunar-white/90 flex flex-col items-center">
                  <span className="font-bold text-2xl tracking-wide text-neon-blue drop-shadow">
                    {language === "fr" ? "Exercices" : "Exercises"}
                  </span>
                  <div className="mt-4 text-2xl font-extrabold leading-snug text-center">
                    {/* QCM : question sans options */}
                    {questions[currentStep].type === "qcm"
                      ? (() => {
                          let questionText = questions[currentStep].content;
                          if (questionText.includes("1.")) {
                            questionText = questionText.split("1.")[0].trim();
                          }
                          return questionText;
                        })()
                      : questions[currentStep].type === "fillDrag"
                      ? renderFillDragText(
                          questions[currentStep],
                          userAnswers[currentStep],
                          updateUserAnswer
                        )
                      : questions[currentStep].type === "fill"
                      ? renderFillText(
                          questions[currentStep],
                          userAnswers[currentStep],
                          updateUserAnswer
                        )
                      : questions[currentStep].content}
                  </div>
                </div>
              </div>
              {/* QCM */}
              {questions[currentStep].type === "qcm" && (
                <div className="flex flex-col gap-8 mt-8">
                  {questions[currentStep].options.map((option, idx) => (
                    <button
                      key={idx}
                      className="px-6 py-2 rounded-xl bg-lunar-white/10 text-lunar-white text-lg font-semibold hover:bg-lunar-white/20 transition"
                      onClick={() => handleAnswerSubmit(option, true)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              {/* Navigation alignée en bas */}
              <div className="flex justify-between mt-8">
                <button
                  className="px-6 py-2 rounded-xl bg-lunar-white/10 text-lunar-white text-lg font-semibold hover:bg-lunar-white/20 transition"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  {language === "fr" ? "Précédent" : "Previous"}
                </button>
                <button
                  className={`px-6 py-2 rounded-xl ${
                    userAnswers[currentStep] &&
                    userAnswers[currentStep].toString().trim() !== ""
                      ? "bg-lunar-white/10 text-lunar-white hover:bg-lunar-white/20"
                      : "bg-lunar-white/5 text-lunar-white/40 cursor-not-allowed"
                  } text-lg font-semibold transition`}
                  disabled={
                    !userAnswers[currentStep] ||
                    userAnswers[currentStep].toString().trim() === ""
                  }
                  onClick={() => {
                    if (currentStep === questions.length - 1) {
                      // Vérifier si toutes les questions ont une réponse
                      const allAnswered = questions.every(
                        (_, idx) =>
                          userAnswers[idx] &&
                          userAnswers[idx].toString().trim() !== ""
                      );
                      if (allAnswered) {
                        submitAllAnswers();
                      } else {
                        alert(
                          language === "fr"
                            ? "Merci de répondre à toutes les questions avant de valider."
                            : "Please answer all questions before submitting."
                        );
                      }
                    } else {
                      // Pour les questions fill et fillDrag, sauvegarder automatiquement avant de passer à la suivante
                      if (
                        questions[currentStep].type === "fill" ||
                        questions[currentStep].type === "fillDrag"
                      ) {
                        const currentAnswer = userAnswers[currentStep];
                        if (
                          currentAnswer &&
                          currentAnswer.toString().trim() !== ""
                        ) {
                          handleAnswerSubmit(currentAnswer, false).then(() => {
                            setCurrentStep(currentStep + 1);
                          });
                        } else {
                          setCurrentStep(currentStep + 1);
                        }
                      } else {
                        // Pour les autres types de questions, passer directement à la suivante
                        setCurrentStep(currentStep + 1);
                      }
                    }
                  }}
                >
                  {currentStep === questions.length - 1
                    ? language === "fr"
                      ? "Valider"
                      : "Submit"
                    : language === "fr"
                    ? "Suivant"
                    : "Next"}
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="text-lunar-white text-center text-xl py-10">
            {language === "fr"
              ? "Chargement des exercices..."
              : "Loading exercises..."}
          </div>
        )}
      </div>
    </div>
  );
}
