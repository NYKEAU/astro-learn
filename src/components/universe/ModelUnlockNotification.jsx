"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

// Mapping des modules vers les noms des modèles
const MODULE_NAMES = {
  1: { fr: "Terre", en: "Earth" },
  2: { fr: "Soleil", en: "Sun" },
  3: { fr: "Jupiter", en: "Jupiter" },
  4: { fr: "Système Solaire", en: "Solar System" },
  5: { fr: "Étoile", en: "Star" },
  6: { fr: "Nébuleuse", en: "Nebula" },
};

export function ModelUnlockNotification() {
  const [notifications, setNotifications] = useState([]);
  const { language } = useLanguage();

  useEffect(() => {
    // Fonction globale pour afficher une notification
    window.showModuleCompletionNotification = (moduleId) => {
      const modelName = MODULE_NAMES[moduleId];
      if (!modelName) return;

      const notification = {
        id: Date.now(),
        moduleId,
        modelName: modelName[language] || modelName.fr,
      };

      setNotifications((prev) => [...prev, notification]);

      // Supprimer automatiquement après 5 secondes
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      }, 5000);
    };

    // Nettoyer lors du démontage
    return () => {
      delete window.showModuleCompletionNotification;
    };
  }, [language]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-4">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="bg-gradient-to-r from-neon-blue/90 to-cosmic-purple/90 backdrop-blur-md border border-neon-blue/50 rounded-lg p-4 shadow-2xl max-w-sm"
          >
            <div className="flex items-start gap-3">
              {/* Icône de célébration */}
              <div className="flex-shrink-0">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: 2,
                  }}
                  className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center"
                >
                  <svg
                    className="w-6 h-6 text-cosmic-black"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </motion.div>
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lunar-white font-bold text-sm mb-1">
                  {language === "fr"
                    ? "🎉 Nouveau modèle débloqué !"
                    : "🎉 New model unlocked!"}
                </h3>
                <p className="text-lunar-white/90 text-sm mb-2">
                  <span className="font-medium text-yellow-300">
                    {notification.modelName}
                  </span>{" "}
                  {language === "fr"
                    ? "a été ajouté à votre univers personnel !"
                    : "has been added to your personal universe!"}
                </p>
                <p className="text-lunar-white/70 text-xs">
                  {language === "fr"
                    ? "Visitez votre univers pour l'explorer en 3D"
                    : "Visit your universe to explore it in 3D"}
                </p>
              </div>

              {/* Bouton fermer */}
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-lunar-white/70 hover:text-lunar-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Barre de progression pour l'auto-fermeture */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="mt-3 h-1 bg-yellow-400/30 rounded-full overflow-hidden"
            >
              <div className="h-full bg-yellow-400 rounded-full" />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
