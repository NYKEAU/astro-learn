"use client";

import { useState, useEffect } from "react";
import { RegistrationForm } from "@/components/forms/registration";
import { LoginForm } from "@/components/forms/login";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Fonction optimisée pour créer les étoiles (moins d'étoiles pour de meilleures performances)
function createStars() {
  const stars = [];
  const starCount = {
    small: Math.floor(window.innerWidth / 10),
    medium: Math.floor(window.innerWidth / 25),
    large: Math.floor(window.innerWidth / 50),
    shooting: 1, // Juste une étoile filante pour l'effet
  };

  // Créer de petites étoiles
  for (let i = 0; i < starCount.small; i++) {
    const size = Math.random() * 1 + 0.5;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 10 + 5;
    const delay = Math.random() * 5;

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
          opacity: Math.random() * 0.7 + 0.3,
        }}
      />
    );
  }

  // Créer des étoiles moyennes
  for (let i = 0; i < starCount.medium; i++) {
    const size = Math.random() * 1.5 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 8;

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
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 10;

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

  return stars;
}

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState("register");
  const [stars, setStars] = useState([]);
  const { t, language } = useLanguage();

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-cosmic-black text-lunar-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* Étoiles en arrière-plan */}
      <div className="stars-container absolute inset-0 overflow-hidden z-0">
        {stars}
      </div>

      {/* Header avec navigation */}
      <header className="w-full max-w-6xl mx-auto p-4 border-b border-neon-blue/20 bg-cosmic-black/90 backdrop-blur-md flex justify-between items-center z-10 relative">
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="text-neon-blue hover:text-neon-blue/80 transition-colors"
          >
            <Home size={20} />
          </Link>
          <span className="text-lunar-white/40">/</span>
          <span className="text-lunar-white/80 font-medium">
            {language === "fr" ? "Compte" : "Account"}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
        </div>
      </header>

      <main className="w-full flex flex-col items-center justify-center flex-1 py-8 z-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-3xl mx-auto"
        >
          {/* Logo et titre */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <img
                src="/Logo Final RTL.svg"
                alt="AstroLearn"
                className="h-16 w-auto"
              />
            </div>
            <p className="text-lunar-white/70">
              {language === "fr"
                ? "Quels sont vos objectifs d'apprentissage en astronomie ?"
                : "What are your astronomy learning goals?"}
            </p>
          </div>

          {/* Carte unique, toute la largeur pour le formulaire */}
          <Card className="bg-cosmic-black/60 backdrop-blur-sm border border-neon-blue/20 rounded-2xl overflow-hidden shadow-md w-full max-w-3xl">
            <div className="flex w-full mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-3 px-2 text-center font-medium transition-all duration-300 rounded-t-xl ${
                  activeTab === "register"
                    ? "bg-cosmic-black text-neon-blue border-b-2 border-neon-blue"
                    : "bg-cosmic-black/80 text-lunar-white/70 hover:bg-cosmic-black/60"
                }`}
              >
                {language === "fr" ? "Inscription" : "Sign Up"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-3 px-2 text-center font-medium transition-all duration-300 rounded-t-xl ${
                  activeTab === "login"
                    ? "bg-cosmic-black text-neon-blue border-b-2 border-neon-blue"
                    : "bg-cosmic-black/80 text-lunar-white/70 hover:bg-cosmic-black/60"
                }`}
              >
                {language === "fr" ? "Connexion" : "Login"}
              </button>
            </div>
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "register" ? (
                    <RegistrationForm compact twoColumns />
                  ) : (
                    <LoginForm compact />
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
