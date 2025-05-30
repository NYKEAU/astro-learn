"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { LockIcon, InfoIcon } from "lucide-react";

export function LoginForm({ compact = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t, language } = useLanguage();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { user, error } = await signInWithGoogle();

      if (user) {
        toast.success(
          language === "fr"
            ? "Connexion réussie ! Redirection vers le tableau de bord..."
            : "Login successful! Redirecting to dashboard..."
        );
        router.push("/dashboard");
      } else {
        toast.error(
          language === "fr"
            ? "Échec de la connexion: " + (error || "Veuillez réessayer.")
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

  return (
    <div className={compact ? "p-4 max-w-md mx-auto" : "p-6"}>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-neon-blue mb-1">
          {language === "fr" ? "Connexion" : "Login"}
        </h2>
        <p className="text-lunar-white/70 text-sm">
          {language === "fr"
            ? "Connectez-vous pour accéder à tous les modules"
            : "Log in to access all modules"}
        </p>
      </div>
      <div className="space-y-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full"
        >
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 flex items-center justify-center space-x-3 bg-neon-blue text-cosmic-black hover:bg-neon-blue/90 shadow-lg transition-all duration-300 rounded-xl font-medium"
          >
            <FcGoogle className="w-5 h-5" />
            <span>
              {isLoading
                ? "..."
                : language === "fr"
                ? "Se connecter avec Google"
                : "Sign in with Google"}
            </span>
          </Button>
        </motion.div>
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-xs flex items-start space-x-3">
          <InfoIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-green-400 font-medium block mb-1">
              {language === "fr" ? "Astuce" : "Tip"}
            </span>
            <p className="text-lunar-white/90">
              {language === "fr"
                ? "La connexion avec Google vous permet d'accéder à tous les modules et de sauvegarder votre progression."
                : "Logging in with Google allows you to access all modules and save your progress."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
