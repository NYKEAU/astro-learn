import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

/**
 * Composant qui analyse et affiche différents types d'exercices interactifs
 * Supporte les QCM, texte à trous avec ou sans propositions
 *
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {string} props.content - Contenu de l'exercice à analyser et afficher
 * @param {Function} props.onComplete - Callback appelé lors de la soumission d'une réponse
 * @param {boolean} [props.showFeedback=false] - Indique si le feedback doit être affiché
 * @param {Function} [props.setShowFeedback] - Fonction pour contrôler l'affichage du feedback
 * @param {boolean} [props.isCorrect=false] - Indique si la réponse est correcte
 * @param {Function} [props.setIsCorrect] - Fonction pour définir si la réponse est correcte
 * @returns {JSX.Element|null} Composant d'exercice rendu ou null si pas de contenu
 *
 * @example
 * // QCM
 * <ExerciseParser
 *   content="Quelle est la plus grande planète ?\n1. Jupiter\n2. Saturne\n3. Neptune"
 *   onComplete={(result) => console.log(result)}
 * />
 *
 * @example
 * // Texte à trous
 * <ExerciseParser
 *   content="La [Terre] est la [troisième] planète du système solaire."
 *   onComplete={(result) => console.log(result)}
 * />
 */
export const ExerciseParser = ({
  content,
  onComplete,
  showFeedback = false,
  setShowFeedback = () => {},
  isCorrect = false,
  setIsCorrect = () => {},
}) => {
  const { language } = useLanguage();

  /** @type {[string|null, Function]} Type d'exercice détecté */
  const [exerciseType, setExerciseType] = useState(null);

  /** @type {[Object|null, Function]} Contenu parsé de l'exercice */
  const [parsedContent, setParsedContent] = useState(null);

  /** @type {[any, Function]} Réponse de l'utilisateur */
  const [userAnswer, setUserAnswer] = useState(null);

  /** @type {[number[], Function]} Options sélectionnées pour les QCM */
  const [selectedOptions, setSelectedOptions] = useState([]);

  /** @type {[Object, Function]} Réponses pour les textes à trous */
  const [fillAnswers, setFillAnswers] = useState({});

  /**
   * Analyse le contenu pour détecter automatiquement le type d'exercice
   * Types supportés:
   * - "mcq": QCM avec options numérotées (1., 2., 3.)
   * - "fill-blank": Texte à trous avec saisie libre [réponse]
   * - "fill-blank-choice": Texte à trous avec propositions []<option>
   * - "text": Texte simple sans interaction
   */
  useEffect(() => {
    if (!content) return;

    // Détection de QCM (présence de numéros 1., 2., 3., etc.)
    if (/^\d+\.\s.+/m.test(content)) {
      setExerciseType("mcq");

      // Analyser le contenu QCM
      const lines = content.split("\n");
      const questionEndIndex = lines.findIndex((line) => /^\d+\.\s/.test(line));

      const question = lines.slice(0, questionEndIndex).join("\n").trim();
      const options = [];

      for (let i = questionEndIndex; i < lines.length; i++) {
        if (/^\d+\.\s/.test(lines[i])) {
          options.push(lines[i].replace(/^\d+\.\s/, "").trim());
        }
      }

      setParsedContent({
        question,
        options,
      });
    }
    // Détection de texte à trous (avec crochets [réponse])
    else if (/\[[^\]]+\]/.test(content)) {
      // Vérifier s'il y a des propositions <option>
      if (/\[\].*<[^>]+>/.test(content)) {
        setExerciseType("fill-blank-choice");

        // Analyser le texte à trous avec propositions
        const textParts = content.split(/(<[^>]+>)/).filter(Boolean);
        const textWithBlanks = textParts[0];

        // Extraire les propositions
        const options = textParts
          .filter((part) => part.startsWith("<") && part.endsWith(">"))
          .map((part) => part.replace(/^<|>$/g, ""));

        // Créer le texte parsé
        setParsedContent({
          text: textWithBlanks,
          options,
        });
      } else {
        setExerciseType("fill-blank");

        // Analyser le texte à trous sans propositions
        setParsedContent({
          text: content,
          blanks: content
            .match(/\[[^\]]+\]/g)
            .map((match) => match.replace(/^\[|\]$/g, "")),
        });
      }
    } else {
      setExerciseType("text");
      setParsedContent({ text: content });
    }
  }, [content]);

  /**
   * Gère la sélection d'une option dans un QCM
   * @param {number} optionIndex - Index de l'option sélectionnée
   */
  const handleMCQSelect = (optionIndex) => {
    if (showFeedback) return;

    const newSelection = [...selectedOptions];

    // QCU (une seule réponse)
    if (true) {
      // À modifier si besoin de QCM multi-sélections
      setSelectedOptions([optionIndex]);
    }
    // QCM (plusieurs réponses)
    else {
      const existingIndex = newSelection.indexOf(optionIndex);
      if (existingIndex === -1) {
        newSelection.push(optionIndex);
      } else {
        newSelection.splice(existingIndex, 1);
      }
      setSelectedOptions(newSelection);
    }
  };

  /**
   * Vérifie la réponse d'un QCM et déclenche le callback onComplete
   * Note: Logique de correction simplifiée à adapter selon les données réelles
   */
  const checkMCQAnswer = () => {
    // Exemple: correction simplifiée, à adapter selon les données réelles
    // Ici on suppose que la première option est correcte à des fins de démonstration
    const isAnswerCorrect = selectedOptions.includes(0);
    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    if (onComplete) {
      onComplete({
        type: exerciseType,
        correct: isAnswerCorrect,
        userAnswer: selectedOptions,
      });
    }
  };

  /**
   * Gère la saisie de texte pour les exercices à trous
   * @param {number} index - Index du trou à remplir
   * @param {string} value - Valeur saisie par l'utilisateur
   */
  const handleBlankInput = (index, value) => {
    setFillAnswers({
      ...fillAnswers,
      [index]: value,
    });
  };

  /**
   * Vérifie la réponse d'un exercice à trous et déclenche le callback onComplete
   * Supporte la saisie libre et les choix multiples
   */
  const checkFillAnswer = () => {
    // Pour texte à trous avec saisie libre
    if (exerciseType === "fill-blank") {
      const answers = parsedContent.blanks;
      const isAnswerCorrect = Object.values(fillAnswers).every(
        (answer, index) => {
          // Comparaison insensible à la casse
          return answer.toLowerCase() === answers[index].toLowerCase();
        }
      );

      setIsCorrect(isAnswerCorrect);
      setShowFeedback(true);

      if (onComplete) {
        onComplete({
          type: exerciseType,
          correct: isAnswerCorrect,
          userAnswer: fillAnswers,
        });
      }
    }
    // Pour texte à trous avec choix
    else if (exerciseType === "fill-blank-choice") {
      // Exemple: supposons que l'option 0 est correcte
      const isAnswerCorrect = fillAnswers[0] === 0;

      setIsCorrect(isAnswerCorrect);
      setShowFeedback(true);

      if (onComplete) {
        onComplete({
          type: exerciseType,
          correct: isAnswerCorrect,
          userAnswer: fillAnswers,
        });
      }
    }
  };

  if (!exerciseType || !parsedContent) return null;

  // Rendu pour QCM
  if (exerciseType === "mcq") {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-lunar-white mb-4 font-exo">
          {parsedContent.question}
        </h3>

        <div className="space-y-3 mb-4">
          {parsedContent.options.map((option, index) => (
            <button
              key={index}
              className={`w-full p-3 text-left rounded-lg transition-all duration-200 ${
                selectedOptions.includes(index)
                  ? showFeedback
                    ? isCorrect
                      ? "bg-green-500/20 border-green-500 text-green-300"
                      : "bg-red-500/20 border-red-500 text-red-300"
                    : "bg-neon-blue/20 border-neon-blue text-neon-blue"
                  : "bg-cosmic-black/40 border-neon-blue/30 text-lunar-white/90 hover:bg-cosmic-black/60"
              } border`}
              onClick={() => handleMCQSelect(index)}
              disabled={showFeedback}
            >
              {option}
            </button>
          ))}
        </div>

        {!showFeedback && selectedOptions.length > 0 && (
          <Button
            className="bg-neon-blue text-lunar-white"
            onClick={checkMCQAnswer}
          >
            {language === "fr" ? "Vérifier" : "Check"}
          </Button>
        )}

        {showFeedback && (
          <div
            className={`p-3 rounded-lg mb-4 ${
              isCorrect
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            } border`}
          >
            <p
              className={`text-sm font-medium ${
                isCorrect ? "text-green-300" : "text-red-300"
              }`}
            >
              {isCorrect
                ? language === "fr"
                  ? "Correct !"
                  : "Correct!"
                : language === "fr"
                ? "Incorrect..."
                : "Incorrect..."}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Rendu pour texte à trous (saisie libre)
  if (exerciseType === "fill-blank") {
    const textWithBlanks = parsedContent.text
      .split(/(\[[^\]]+\])/)
      .map((part, index) => {
        if (part.startsWith("[") && part.endsWith("]")) {
          const blankIndex = Math.floor(index / 2);
          const answer = part.replace(/^\[|\]$/g, "");

          return (
            <span key={index} className="relative inline-block mx-1">
              <input
                type="text"
                className={`px-2 py-1 rounded bg-cosmic-black border ${
                  showFeedback
                    ? (fillAnswers[blankIndex] || "").toLowerCase() ===
                      answer.toLowerCase()
                      ? "border-green-500 text-green-300"
                      : "border-red-500 text-red-300"
                    : "border-neon-blue/40 text-neon-blue"
                } w-32`}
                value={fillAnswers[blankIndex] || ""}
                onChange={(e) => handleBlankInput(blankIndex, e.target.value)}
                disabled={showFeedback}
                placeholder="..."
              />
            </span>
          );
        }
        return (
          <span key={index} className="text-lunar-white font-jetbrains">
            {part}
          </span>
        );
      });

    return (
      <div className="space-y-4">
        <div className="mb-4">{textWithBlanks}</div>

        {!showFeedback && Object.keys(fillAnswers).length > 0 && (
          <Button
            className="bg-neon-blue text-lunar-white"
            onClick={checkFillAnswer}
          >
            {language === "fr" ? "Vérifier" : "Check"}
          </Button>
        )}

        {showFeedback && (
          <div
            className={`p-3 rounded-lg mb-4 ${
              isCorrect
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            } border`}
          >
            <p
              className={`text-sm font-medium ${
                isCorrect ? "text-green-300" : "text-red-300"
              }`}
            >
              {isCorrect
                ? language === "fr"
                  ? "Correct !"
                  : "Correct!"
                : language === "fr"
                ? "Incorrect..."
                : "Incorrect..."}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Rendu pour texte à trous avec propositions
  if (exerciseType === "fill-blank-choice") {
    const textWithBlanks = parsedContent.text
      .split(/(\[\])/)
      .map((part, index) => {
        if (part === "[]") {
          const blankIndex = Math.floor(index / 2);

          return (
            <span key={index} className="relative inline-block mx-1">
              <select
                className={`px-2 py-1 rounded bg-cosmic-black border ${
                  showFeedback
                    ? fillAnswers[blankIndex] === 0 // Exemple: supposons que l'option 0 est correcte
                      ? "border-green-500 text-green-300"
                      : "border-red-500 text-red-300"
                    : "border-neon-blue/40 text-neon-blue"
                } min-w-[100px]`}
                value={fillAnswers[blankIndex] || ""}
                onChange={(e) =>
                  handleBlankInput(blankIndex, parseInt(e.target.value, 10))
                }
                disabled={showFeedback}
              >
                <option value="">...</option>
                {parsedContent.options.map((option, optionIndex) => (
                  <option key={optionIndex} value={optionIndex}>
                    {option}
                  </option>
                ))}
              </select>
            </span>
          );
        }
        return (
          <span key={index} className="text-lunar-white font-jetbrains">
            {part}
          </span>
        );
      });

    return (
      <div className="space-y-4">
        <div className="mb-4">{textWithBlanks}</div>

        {!showFeedback && Object.keys(fillAnswers).length > 0 && (
          <Button
            className="bg-neon-blue text-lunar-white"
            onClick={checkFillAnswer}
          >
            {language === "fr" ? "Vérifier" : "Check"}
          </Button>
        )}

        {showFeedback && (
          <div
            className={`p-3 rounded-lg mb-4 ${
              isCorrect
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            } border`}
          >
            <p
              className={`text-sm font-medium ${
                isCorrect ? "text-green-300" : "text-red-300"
              }`}
            >
              {isCorrect
                ? language === "fr"
                  ? "Correct !"
                  : "Correct!"
                : language === "fr"
                ? "Incorrect..."
                : "Incorrect..."}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Rendu par défaut pour du texte simple
  return (
    <div className="text-lunar-white font-jetbrains leading-relaxed">
      {parsedContent.text}
    </div>
  );
};
