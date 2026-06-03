"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Home } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

function createStars() {
  const stars = [];
  const starCount = {
    small: Math.floor(window.innerWidth / 10),
    medium: Math.floor(window.innerWidth / 25),
    large: Math.floor(window.innerWidth / 50),
    shooting: 1,
  };

  for (let i = 0; i < starCount.small; i++) {
    const size = Math.random() * 1 + 0.5;
    stars.push(
      <div
        key={`small-${i}`}
        className="star"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 10 + 5}s`,
          animationDelay: `${Math.random() * 5}s`,
          opacity: Math.random() * 0.7 + 0.3,
        }}
      />
    );
  }

  for (let i = 0; i < starCount.medium; i++) {
    const size = Math.random() * 1.5 + 1;
    stars.push(
      <div
        key={`medium-${i}`}
        className="star"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 15 + 10}s`,
          animationDelay: `${Math.random() * 8}s`,
          opacity: Math.random() * 0.8 + 0.2,
          boxShadow: `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`,
        }}
      />
    );
  }

  for (let i = 0; i < starCount.large; i++) {
    const size = Math.random() * 2 + 1.5;
    stars.push(
      <div
        key={`large-${i}`}
        className="star"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 20 + 15}s`,
          animationDelay: `${Math.random() * 10}s`,
          opacity: Math.random() * 0.9 + 0.1,
          boxShadow: `0 0 ${size * 3}px rgba(255, 255, 255, 0.9)`,
        }}
      />
    );
  }

  return stars;
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [stars, setStars] = useState([]);
  const { language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    document.body.classList.add("register-page");
    setStars(createStars());
    return () => {
      document.body.classList.remove("register-page");
    };
  }, []);

  const handleGoogleContinue = async () => {
    setIsLoading(true);
    try {
      const { user, error } = await signInWithGoogle();

      if (user) {
        const profileDoc = await getDoc(doc(db, "profilesInfos", user.uid));

        if (profileDoc.exists()) {
          toast.success(
            language === "fr"
              ? "Connexion réussie !"
              : "Login successful!"
          );
          router.push("/dashboard");
        } else {
          toast.success(
            language === "fr"
              ? "Bienvenue ! Personnalisons votre expérience..."
              : "Welcome! Let's personalize your experience..."
          );
          router.push("/onboarding");
        }
      } else {
        toast.error(
          language === "fr"
            ? "Échec de la connexion : " + (error || "Veuillez réessayer.")
            : "Login failed: " + (error || "Please try again.")
        );
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      toast.error(
        language === "fr"
          ? "Échec de la connexion. Veuillez réessayer."
          : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-cosmic-black text-lunar-white relative overflow-hidden flex flex-col items-center justify-center">
      <div className="stars-container absolute inset-0 overflow-hidden z-0">
        {stars}
      </div>

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
          className="w-full max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/Logo Final RTL.svg"
                alt="AstroLearn"
                className="h-20 w-auto"
              />
            </div>
            <h1 className="text-3xl font-exo font-bold text-lunar-white mb-2">
              {language === "fr"
                ? "Bienvenue sur AstroLearn"
                : "Welcome to AstroLearn"}
            </h1>
            <p className="text-lunar-white/70">
              {language === "fr"
                ? "Explorez l'univers à votre rythme"
                : "Explore the universe at your own pace"}
            </p>
          </div>

          <Card className="bg-cosmic-black/60 backdrop-blur-sm border border-neon-blue/20 rounded-2xl overflow-hidden shadow-md">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-neon-blue mb-2">
                  {language === "fr"
                    ? "Commencez votre voyage"
                    : "Start your journey"}
                </h2>
                <p className="text-lunar-white/70 text-sm">
                  {language === "fr"
                    ? "Connectez-vous pour accéder à tous les modules et sauvegarder votre progression."
                    : "Sign in to access all modules and save your progress."}
                </p>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Button
                  onClick={handleGoogleContinue}
                  disabled={isLoading}
                  className="w-full py-4 flex items-center justify-center space-x-3 bg-neon-blue text-cosmic-black hover:bg-neon-blue/90 shadow-lg transition-all duration-300 rounded-xl font-medium text-lg"
                >
                  <FcGoogle className="w-6 h-6" />
                  <span>
                    {isLoading
                      ? "..."
                      : language === "fr"
                      ? "Continuer avec Google"
                      : "Continue with Google"}
                  </span>
                </Button>
              </motion.div>

              <div className="mt-6 p-3 bg-neon-blue/10 border border-neon-blue/30 rounded-xl text-xs flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-neon-blue flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-lunar-white/80">
                  {language === "fr"
                    ? "La connexion avec Google vous permet d'accéder à tous les modules et de sauvegarder votre progression. Vous pourrez personnaliser votre profil après inscription."
                    : "Signing in with Google allows you to access all modules and save your progress. You can personalize your profile after signing up."}
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-lunar-white/40 text-xs mt-6">
            {language === "fr"
              ? "En continuant, vous acceptez nos conditions d'utilisation."
              : "By continuing, you agree to our terms of service."}
          </p>
        </motion.div>
      </main>
    </div>
  );
}