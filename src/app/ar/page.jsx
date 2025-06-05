"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ARCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Veuillez entrer un code");
      return;
    }

    setIsLoading(true);

    // Valider le format du code (6 caractères alphanumériques)
    if (!/^[A-Z0-9]{6}$/.test(code.trim().toUpperCase())) {
      toast.error("Le code doit contenir 6 caractères (lettres et chiffres)");
      setIsLoading(false);
      return;
    }

    try {
      // Rediriger vers la page AR avec le code
      router.push(`/ar/${code.trim().toUpperCase()}`);
    } catch (error) {
      console.error("Erreur redirection:", error);
      toast.error("Erreur lors de l'accès à la réalité augmentée");
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    // Filtrer pour n'accepter que les lettres et chiffres, max 6 caractères
    const value = e.target.value
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-black via-cosmic-black/90 to-neon-blue/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/30 p-8 max-w-md w-full"
      >
        {/* En-tête avec logo */}
        <div className="text-center mb-8">
          <img
            src="/Logo Final RTL.svg"
            alt="AstroLearn"
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-lunar-white mb-2">
            Réalité Augmentée
          </h1>
          <p className="text-lunar-white/70 text-sm">
            Entrez votre code pour accéder au modèle 3D en AR
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-lunar-white mb-2"
            >
              Code de partage
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              className="w-full px-4 py-3 text-center text-xl font-mono tracking-wider bg-cosmic-black/50 border border-neon-blue/30 rounded-lg text-lunar-white placeholder-lunar-white/50 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
            />
            <p className="text-xs text-lunar-white/60 mt-2">
              Le code contient 6 caractères (lettres et chiffres)
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || code.length < 6}
            className="w-full bg-gradient-to-r from-neon-blue to-neon-pink text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-neon-blue/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Chargement...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
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
                Ouvrir en AR
              </div>
            )}
          </motion.button>
        </form>

        {/* Informations */}
        <div className="mt-6 space-y-3">
          <div className="p-3 bg-cosmic-black/50 rounded-lg">
            <h3 className="text-lunar-white font-semibold mb-2 flex items-center gap-2">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Comment obtenir un code ?
            </h3>
            <p className="text-lunar-white/70 text-sm">
              Demandez à quelqu'un de vous partager un modèle 3D depuis
              AstroLearn, ou scannez un QR code.
            </p>
          </div>

          <div className="p-3 bg-cosmic-black/50 rounded-lg">
            <h3 className="text-lunar-white font-semibold mb-2 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-amber-400"
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
              Prérequis AR
            </h3>
            <ul className="text-lunar-white/70 text-sm space-y-1">
              <li>• Smartphone récent (Android 7+ ou iOS 12+)</li>
              <li>• Chrome (Android) ou Safari (iOS)</li>
              <li>• Connexion internet</li>
            </ul>
          </div>
        </div>

        {/* Lien retour */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-neon-blue hover:text-neon-pink transition-colors text-sm"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </motion.div>
    </div>
  );
}
