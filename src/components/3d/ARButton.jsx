"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useARSupport } from "@/lib/hooks/useARSupport";
import { sessionShare } from "@/lib/session/SessionShare";
import { toast } from "sonner";

export function ARButton({
  modelURL,
  title = "Modèle 3D",
  moduleTitle = "",
  language = "fr",
  className = "",
}) {
  const router = useRouter();
  const { isARSupported, isChecking } = useARSupport();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleARClick = async () => {
    if (!isARSupported) {
      toast.error(
        language === "fr"
          ? "La réalité augmentée n'est pas disponible sur cet appareil"
          : "Augmented reality is not available on this device"
      );
      return;
    }

    if (!modelURL) {
      toast.error(
        language === "fr"
          ? "Aucun modèle 3D disponible"
          : "No 3D model available"
      );
      return;
    }

    setIsGenerating(true);
    try {
      // Générer un code AR et rediriger vers la page dédiée
      const code = sessionShare.generateSessionCode({
        type: "ar",
        modelURL,
        title,
        moduleTitle,
      });

      // Rediriger vers la page AR dédiée
      router.push(`/ar/${code}`);
    } catch (error) {
      console.error("Erreur génération AR:", error);
      toast.error(
        language === "fr"
          ? "Erreur lors de l'accès à la réalité augmentée"
          : "Error accessing augmented reality"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Ne pas afficher le bouton si l'AR n'est pas supportée
  if (isChecking || !isARSupported) {
    return null;
  }

  return (
    <button
      onClick={handleARClick}
      disabled={isGenerating}
      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${className}`}
      aria-label={
        language === "fr"
          ? "Voir en réalité augmentée"
          : "View in augmented reality"
      }
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          {language === "fr" ? "Redirection..." : "Redirecting..."}
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {language === "fr" ? "Voir en AR" : "View in AR"}
        </>
      )}
    </button>
  );
}
