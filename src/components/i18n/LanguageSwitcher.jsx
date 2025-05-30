"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export function LanguageSwitcher() {
  const { language, changeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fermer le menu lorsque l'utilisateur clique en dehors
  useEffect(() => {
    if (!mounted) return;

    const handleClickOutside = (e) => {
      // Éviter de fermer le menu si on clique sur le bouton lui-même
      if (isOpen && !e.target.closest(".language-switcher-button")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return (
    <div className="relative">
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="language-switcher-button flex items-center space-x-2 px-3 py-2 rounded-lg bg-cosmic-black/50 border border-neon-blue/30 text-lunar-white hover:bg-neon-blue/10 transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-sm font-medium">
          {language === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-40 rounded-lg bg-cosmic-black/90 border border-neon-blue/30 shadow-lg overflow-hidden z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <button
                onClick={() => {
                  changeLanguage("fr");
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  language === "fr"
                    ? "bg-neon-blue/20 text-neon-blue"
                    : "text-lunar-white hover:bg-neon-blue/10"
                }`}
              >
                <span className="mr-2">🇫🇷</span>
                <span>Français</span>
                {language === "fr" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  changeLanguage("en");
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  language === "en"
                    ? "bg-neon-blue/20 text-neon-blue"
                    : "text-lunar-white hover:bg-neon-blue/10"
                }`}
              >
                <span className="mr-2">🇬🇧</span>
                <span>English</span>
                {language === "en" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
