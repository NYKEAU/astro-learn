"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { signInWithGoogle } from "@/lib/firebase/auth";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { user, error } = await signInWithGoogle();

      if (user) {
        toast.success(
          t?.loginSuccess ||
            "Connexion réussie ! Redirection vers le tableau de bord..."
        );

        // Redirection vers le tableau de bord
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        toast.error(
          t?.loginError ||
            "Échec de la connexion: " + (error || "Veuillez réessayer.")
        );
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      toast.error(
        t?.loginError || "Échec de la connexion. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto bg-cosmic-black/80 backdrop-blur-md p-8 rounded-b-xl shadow-lg border border-neon-blue/20 border-t-0 flex flex-col items-center justify-center min-h-[400px]"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-exo font-bold text-lunar-white mb-2">
          {t?.loginPrompt || "Connectez-vous pour accéder à votre compte"}
        </h2>
        <p className="text-lunar-white/70 text-sm">
          {t?.loginWithGoogle || "Se connecter avec Google"}
        </p>
      </div>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full max-w-xs"
      >
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-6 flex items-center justify-center space-x-3 bg-lunar-white text-cosmic-black hover:bg-lunar-white/90 shadow-lg transition-all duration-300"
        >
          <FcGoogle className="w-6 h-6" />
          <span className="font-medium">
            {isLoading
              ? "..."
              : t?.loginWithGoogle || "Se connecter avec Google"}
          </span>
        </Button>
      </motion.div>

      <div className="mt-12 p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg max-w-md">
        <p className="text-sm text-lunar-white/90 font-jetbrains">
          <span className="text-neon-pink font-bold">
            {t?.tip || "Astuce"} :
          </span>{" "}
          {t?.importantGoogleNotice ||
            "Pour vous connecter et accéder à votre compte, vous devez utiliser Google. Cette méthode garantit une connexion sécurisée et simplifiée."}
        </p>
      </div>
    </motion.div>
  );
}
