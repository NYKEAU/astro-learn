"use client";

import { useState, useEffect } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

export function LearningGoals({ form }) {
  const { t } = useLanguage();
  const [selectedGoals, setSelectedGoals] = useState([]);

  // Liste des objectifs d'apprentissage disponibles
  const goalOptions = [
    {
      id: "basicKnowledge",
      label: t?.basicKnowledge || "Acquérir des connaissances de base",
      icon: "📚",
    },
    {
      id: "deepUnderstanding",
      label: t?.deepUnderstanding || "Approfondir ma compréhension",
      icon: "🧠",
    },
    {
      id: "stargazing",
      label: t?.stargazing || "Apprendre à observer les étoiles",
      icon: "🔭",
    },
    {
      id: "astrophotography",
      label: t?.learnAstrophotography || "Pratiquer l'astrophotographie",
      icon: "📸",
    },
    {
      id: "keepUpdated",
      label: t?.keepUpdated || "Rester informé des découvertes",
      icon: "🔔",
    },
    {
      id: "joinCommunity",
      label: t?.joinCommunity || "Rejoindre une communauté",
      icon: "👥",
    },
    {
      id: "careerAstronomy",
      label: t?.careerAstronomy || "Carrière en astronomie",
      icon: "💼",
    },
    {
      id: "teachOthers",
      label: t?.teachOthers || "Enseigner à d'autres",
      icon: "👨‍🏫",
    },
  ];

  // Synchroniser les objectifs sélectionnés avec le formulaire
  useEffect(() => {
    const formGoals = form.getValues("learningGoals") || [];
    setSelectedGoals(formGoals);
  }, [form]);

  const toggleGoal = (goalId) => {
    let updatedGoals;
    if (selectedGoals.includes(goalId)) {
      updatedGoals = selectedGoals.filter((id) => id !== goalId);
    } else {
      updatedGoals = [...selectedGoals, goalId];
    }
    setSelectedGoals(updatedGoals);
    form.setValue("learningGoals", updatedGoals, { shouldValidate: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-exo font-bold text-lunar-white">
          {t?.learningGoals || "Objectifs d'apprentissage"}
        </h2>
        <p className="text-lunar-white/70 text-sm">
          {t?.learningGoalsDesc ||
            "Quels sont vos objectifs d'apprentissage en astronomie ?"}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goalOptions.map((goal) => (
            <motion.div
              key={goal.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleGoal(goal.id)}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 flex items-center space-x-3 ${
                selectedGoals.includes(goal.id)
                  ? "bg-gradient-to-br from-neon-blue/20 to-neon-pink/20 border border-neon-blue"
                  : "bg-cosmic-black/50 border border-lunar-white/20 hover:border-neon-blue/50"
              }`}
            >
              <span className="text-2xl">{goal.icon}</span>
              <span className="text-sm font-medium text-lunar-white">
                {goal.label}
              </span>
            </motion.div>
          ))}
        </div>
        <FormMessage className="text-neon-pink text-xs">
          {form.formState.errors.learningGoals?.message}
        </FormMessage>
      </div>

      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <label
            htmlFor="additionalInfo"
            className="block text-sm font-medium text-lunar-white"
          >
            {t?.additionalInfo || "Informations supplémentaires"}{" "}
            <span className="text-lunar-white/50 text-xs">
              ({t?.optional || "optionnel"})
            </span>
          </label>
          <textarea
            id="additionalInfo"
            {...form.register("additionalInfo")}
            rows={4}
            placeholder={
              t?.additionalInfoPlaceholder ||
              "Y a-t-il autre chose que vous aimeriez nous faire savoir sur vos objectifs d'apprentissage ?"
            }
            className="w-full px-3 py-2 bg-cosmic-black/50 border border-neon-blue/30 rounded-md text-lunar-white placeholder:text-lunar-white/30 focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue resize-none"
          />
        </div>
      </div>

      <div className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg mt-6">
        <p className="text-sm text-lunar-white/90 font-jetbrains">
          <span className="text-neon-pink font-bold">
            {t?.finalStep || "Dernière étape"} :
          </span>{" "}
          {t?.finalStepDesc ||
            "Après avoir défini vos objectifs, vous pourrez finaliser votre inscription et commencer votre voyage astronomique !"}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-sm text-lunar-white/70">
          {t?.selectedGoals || "Objectifs sélectionnés"} :{" "}
          {selectedGoals.length}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedGoals.map((goalId) => {
            const goal = goalOptions.find((opt) => opt.id === goalId);
            return (
              goal && (
                <span
                  key={goalId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                >
                  {goal.icon} {goal.label}
                </span>
              )
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

LearningGoals.propTypes = {
  form: PropTypes.object.isRequired,
};
