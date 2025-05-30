"use client";

import { useState, useEffect } from "react";
import { RegistrationForm } from "@/components/forms/registration";
import { LoginForm } from "@/components/forms/login";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

// Fonction optimisée pour créer les étoiles
function createStars() {
  const stars = [];
  const starCount = {
    small: Math.floor(window.innerWidth / 8), // Moins d'étoiles pour de meilleures performances
    medium: Math.floor(window.innerWidth / 20),
    large: Math.floor(window.innerWidth / 40),
    shooting: 2, // Seulement quelques étoiles filantes
  };

  // Créer de petites étoiles
  for (let i = 0; i < starCount.small; i++) {
    const size = Math.random() * 1 + 0.5;
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    // Animation plus rapide pour les petites étoiles
    const duration = Math.random() * 10 + 5; // 5-15 secondes
    const delay = Math.random() * 5; // 0-5 secondes de délai

    stars.push(
      <div
        key={`small-${i}`}
        className="star"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${x}%`,
          top: `${y}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          opacity: Math.random() * 0.7 + 0.3, // Opacité variable
        }}
      />
    );
  }

  // Créer des étoiles moyennes
  for (let i = 0; i < starCount.medium; i++) {
    const size = Math.random() * 1.5 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    // Animation moyenne pour les étoiles moyennes
    const duration = Math.random() * 15 + 10; // 10-25 secondes
    const delay = Math.random() * 8; // 0-8 secondes de délai

    stars.push(
      <div
        key={`medium-${i}`}
        className="star"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${x}%`,
          top: `${y}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          opacity: Math.random() * 0.8 + 0.2,
          boxShadow: `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`,
        }}
      />
    );
  }

  // Créer de grandes étoiles
  for (let i = 0; i < starCount.large; i++) {
    const size = Math.random() * 2 + 1.5;
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    // Animation plus lente pour les grandes étoiles
    const duration = Math.random() * 20 + 15; // 15-35 secondes
    const delay = Math.random() * 10; // 0-10 secondes de délai

    stars.push(
      <div
        key={`large-${i}`}
        className="star"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${x}%`,
          top: `${y}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          opacity: Math.random() * 0.9 + 0.1,
          boxShadow: `0 0 ${size * 3}px rgba(255, 255, 255, 0.9)`,
        }}
      />
    );
  }

  // Créer des étoiles filantes occasionnelles
  for (let i = 0; i < starCount.shooting; i++) {
    const size = Math.random() * 3 + 2;
    const x = Math.random() * 80 + 10; // Éviter les bords
    const y = Math.random() * 80 + 10; // Éviter les bords
    const angle = Math.random() * 360; // Angle aléatoire
    const duration = Math.random() * 6 + 4; // 4-10 secondes
    const delay = Math.random() * 30 + 15; // 15-45 secondes de délai (plus rare)

    stars.push(
      <div
        key={`shooting-${i}`}
        className="shooting-star"
        style={{
          width: `${size * 3}px`,
          height: `${size / 2}px`,
          left: `${x}%`,
          top: `${y}%`,
          transform: `rotate(${angle}deg)`,
          animation: `shootingStar ${duration}s linear ${delay}s infinite`,
          boxShadow: `0 0 ${size * 4}px rgba(255, 255, 255, 0.95)`,
        }}
      />
    );
  }

  return stars;
}

export default function RegisterPage() {
  // Utiliser "register" comme valeur par défaut pour activeTab
  const [activeTab, setActiveTab] = useState("register");
  const [stars, setStars] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    // Ajouter la classe au body pour le style de fond
    document.body.classList.add("register-page");

    // Créer les étoiles
    setStars(createStars());

    // Nettoyer lors du démontage
    return () => {
      document.body.classList.remove("register-page");
    };
  }, []);

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Étoiles en arrière-plan */}
      <div className="stars-container absolute inset-0 overflow-hidden">
        {stars}
      </div>

      {/* En-tête avec sélecteur de langue (un seul, en haut à droite) */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Logo et titre */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-exo font-bold text-lunar-white mb-2">
          AstroLearn
        </h1>
        <p className="text-lunar-white/70">
          {t?.learningGoalsDesc ||
            "Explorez l'univers et développez vos connaissances en astronomie"}
        </p>
      </div>

      {/* Onglets avec gestion d'événements améliorée */}
      <div className="w-full max-w-4xl mx-auto mb-0 register-tabs">
        <div className="flex rounded-t-xl overflow-hidden">
          <button
            type="button"
            onClick={() => handleTabChange("register")}
            className={`flex-1 py-4 px-6 text-center font-exo font-medium transition-all duration-300 ${
              activeTab === "register"
                ? "bg-cosmic-black text-neon-blue border-t-2 border-x-1 border-neon-blue/30"
                : "bg-cosmic-black/80 text-lunar-white/70 hover:bg-cosmic-black/60"
            }`}
          >
            {t?.registration || "Inscription"}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("login")}
            className={`flex-1 py-4 px-6 text-center font-exo font-medium transition-all duration-300 ${
              activeTab === "login"
                ? "bg-cosmic-black text-neon-pink border-t-2 border-x-2 border-neon-pink/30"
                : "bg-cosmic-black/80 text-lunar-white/70 hover:bg-cosmic-black/60"
            }`}
          >
            {t?.connection || "Connexion"}
          </button>
        </div>
      </div>

      {/* Contenu des onglets avec AnimatePresence améliorée */}
      <div className="w-full tab-content">
        {activeTab === "register" ? <RegistrationForm /> : <LoginForm />}
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}
