"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useLanguage } from "@/lib/LanguageContext";

export function Interests({ form }) {
  const { t } = useLanguage();
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Liste des intérêts disponibles
  const interestOptions = [
    { id: "planets", label: t?.planets || "Planètes", icon: "🪐" },
    { id: "stars", label: t?.stars || "Étoiles", icon: "⭐" },
    { id: "galaxies", label: t?.galaxies || "Galaxies", icon: "🌌" },
    { id: "blackHoles", label: t?.blackHoles || "Trous noirs", icon: "🕳️" },
    { id: "cosmology", label: t?.cosmology || "Cosmologie", icon: "🌍" },
    {
      id: "spaceExploration",
      label: t?.spaceExploration || "Exploration spatiale",
      icon: "🚀",
    },
    { id: "telescopes", label: t?.telescopes || "Télescopes", icon: "🔭" },
    {
      id: "astrophotography",
      label: t?.astrophotography || "Astrophotographie",
      icon: "📸",
    },
    {
      id: "astrobiology",
      label: t?.astrobiology || "Astrobiologie",
      icon: "🧬",
    },
    {
      id: "spaceHistory",
      label: t?.spaceHistory || "Histoire spatiale",
      icon: "📜",
    },
    {
      id: "amateurAstronomy",
      label: t?.amateurAstronomy || "Astronomie amateur",
      icon: "👨‍🚀",
    },
    {
      id: "celestialEvents",
      label: t?.celestialEvents || "Événements célestes",
      icon: "☄️",
    },
  ];

  // Synchroniser les intérêts sélectionnés avec le formulaire
  useEffect(() => {
    const formInterests = form.getValues("interests") || [];
    setSelectedInterests(formInterests);
  }, [form]);

  const toggleInterest = (interestId) => {
    let updatedInterests;
    if (selectedInterests.includes(interestId)) {
      updatedInterests = selectedInterests.filter((id) => id !== interestId);
    } else {
      updatedInterests = [...selectedInterests, interestId];
    }
    setSelectedInterests(updatedInterests);
    form.setValue("interests", updatedInterests, { shouldValidate: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-exo font-bold text-lunar-white">
          {t?.interests || "Centres d'intérêt"}
        </h2>
        <p className="text-lunar-white/70 text-sm">
          {t?.interestsDesc ||
            "Sélectionnez les sujets qui vous intéressent le plus en astronomie."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {interestOptions.map((interest) => (
            <motion.div
              key={interest.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleInterest(interest.id)}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 flex items-center space-x-3 ${
                selectedInterests.includes(interest.id)
                  ? "bg-gradient-to-br from-neon-blue/20 to-neon-pink/20 border border-neon-blue"
                  : "bg-cosmic-black/50 border border-lunar-white/20 hover:border-neon-blue/50"
              }`}
            >
              <span className="text-2xl">{interest.icon}</span>
              <span className="text-sm font-medium text-lunar-white">
                {interest.label}
              </span>
            </motion.div>
          ))}
        </div>
        <FormMessage className="text-neon-pink text-xs">
          {form.formState.errors.interests?.message}
        </FormMessage>
      </div>

      <div className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg mt-6">
        <p className="text-sm text-lunar-white/90 font-jetbrains">
          <span className="text-neon-pink font-bold">
            {t?.tip || "Astuce"} :
          </span>{" "}
          {t?.interestsTip ||
            "Sélectionnez au moins un sujet d'intérêt. Vos choix nous aideront à personnaliser votre parcours d'apprentissage avec du contenu pertinent."}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-sm text-lunar-white/70">
          {t?.selectedInterests || "Intérêts sélectionnés"} :{" "}
          {selectedInterests.length}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedInterests.map((interestId) => {
            const interest = interestOptions.find(
              (opt) => opt.id === interestId
            );
            return (
              interest && (
                <span
                  key={interestId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                >
                  {interest.icon} {interest.label}
                </span>
              )
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
