"use client";

import { useState } from "react";
import { useARSupport, startARSession } from "@/lib/hooks/useARSupport";
import { AROverlay } from "./AROverlay";
import { toast } from "sonner";

export function ARButton({ modelURL, language = "fr", className = "" }) {
  const { isARSupported, isChecking } = useARSupport();
  const [isStartingAR, setIsStartingAR] = useState(false);
  const [arSession, setArSession] = useState(null);

  const handleARClick = async () => {
    if (!isARSupported) {
      toast.error(
        language === "fr"
          ? "La réalité augmentée n'est pas disponible sur cet appareil"
          : "Augmented reality is not available on this device"
      );
      return;
    }

    setIsStartingAR(true);
    try {
      const session = await startARSession(modelURL, language);
      setArSession(session);

      toast.success(
        language === "fr"
          ? "Session AR démarrée ! Pointez votre caméra vers une surface plane"
          : "AR session started! Point your camera at a flat surface"
      );
    } catch (error) {
      console.error("Erreur AR:", error);

      const errorMessage =
        "La réalité augmentée n'est pas supportée sur ce navigateur";

      toast.error(errorMessage);
    } finally {
      setIsStartingAR(false);
    }
  };

  const handleCloseAR = () => {
    setArSession(null);
  };

  // Ne pas afficher le bouton si l'AR n'est pas supportée
  if (isChecking || !isARSupported) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleARClick}
        disabled={isStartingAR || !!arSession}
        className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${className}`}
        aria-label={
          language === "fr"
            ? "Voir en réalité augmentée"
            : "View in augmented reality"
        }
      >
        {isStartingAR ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {language === "fr" ? "Démarrage..." : "Starting..."}
          </>
        ) : arSession ? (
          <>
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            {language === "fr" ? "AR Active" : "AR Active"}
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

      {/* Overlay AR */}
      {arSession && (
        <AROverlay
          arSession={arSession}
          language={language}
          onClose={handleCloseAR}
        />
      )}
    </>
  );
}
