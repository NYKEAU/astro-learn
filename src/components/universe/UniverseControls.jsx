"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function UniverseControls({ onReset, objectCount, language }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    if (showConfirm) {
      onReset();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Compteur d'objets */}
      <div className="hidden md:flex items-center gap-2 bg-cosmic-black/60 border border-neon-blue/20 rounded-lg px-3 py-2">
        <svg
          className="w-4 h-4 text-neon-blue"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <span className="text-lunar-white/70 text-sm">
          {objectCount} {language === "fr" ? "objets" : "objects"}
        </span>
      </div>

      {/* Bouton de réinitialisation */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleReset}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
          ${
            showConfirm
              ? "bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
              : "bg-cosmic-black/60 border border-neon-blue/20 text-lunar-white hover:border-neon-blue/40 hover:bg-cosmic-black/80"
          }
        `}
      >
        {showConfirm ? (
          <>
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="hidden sm:inline">
              {language === "fr" ? "Confirmer ?" : "Confirm?"}
            </span>
            <span className="sm:hidden">?</span>
          </>
        ) : (
          <>
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">
              {language === "fr" ? "Réinitialiser" : "Reset"}
            </span>
            <span className="sm:hidden">
              {language === "fr" ? "Reset" : "Reset"}
            </span>
          </>
        )}
      </motion.button>

      {/* Bouton d'aide */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-10 h-10 bg-cosmic-black/60 border border-neon-blue/20 rounded-lg text-lunar-white hover:border-neon-blue/40 hover:bg-cosmic-black/80 transition-all duration-200"
        title={language === "fr" ? "Aide" : "Help"}
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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </motion.button>
    </div>
  );
}
