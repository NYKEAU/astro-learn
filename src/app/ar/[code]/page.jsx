"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { arCodeShare } from "@/lib/session/ARCodeShare";
import { ARSession } from "@/lib/webxr/ARSession";
import { useARSupport } from "@/lib/hooks/useARSupport";
import { toast } from "sonner";
import { MobileDebugOverlay } from "@/components/debug/MobileDebugOverlay";

export default function ARPage() {
  const params = useParams();
  const router = useRouter();
  const { isARSupported, isChecking } = useARSupport();

  const [status, setStatus] = useState("loading"); // loading, error, ready, ar-active
  const [error, setError] = useState("");
  const [modelData, setModelData] = useState(null);
  const [arSession, setArSession] = useState(null);
  const [isPlaced, setIsPlaced] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showDebug, setShowDebug] = useState(true); // Activé par défaut pour debug

  useEffect(() => {
    const loadARCode = async () => {
      const code = params.code;
      console.log(`🎬 Page AR chargée avec code: ${code}`);

      if (!code) {
        console.log(`❌ Aucun code fourni`);
        setStatus("error");
        setError("Code de partage manquant");
        return;
      }

      // Récupérer le code AR depuis Firebase
      console.log(`🔍 Tentative de récupération du code AR depuis Firebase...`);

      try {
        const codeData = await arCodeShare.getARCode(code);

        if (!codeData) {
          console.log(`❌ Aucun code AR trouvé pour le code ${code}`);
          setStatus("error");
          setError("Code de partage invalide ou expiré");
          return;
        }

        console.log(`✅ Code AR trouvé:`, codeData);

        // Extraire les données du modèle depuis le code AR
        const modelURL = codeData.modelURL;
        const title = codeData.title || "Modèle 3D";
        const moduleTitle = codeData.moduleTitle || "";

        console.log("Code AR récupéré:", codeData);
        console.log("Données extraites:", { modelURL, title, moduleTitle });

        if (!modelURL) {
          setStatus("error");
          setError("Aucun modèle 3D associé à ce code");
          return;
        }

        setModelData({
          modelURL,
          title,
          moduleTitle,
        });

        setStatus("ready");
      } catch (error) {
        console.error("Erreur récupération code AR:", error);
        setStatus("error");
        setError("Erreur lors de la récupération du code de partage");
      }
    };

    loadARCode();
  }, [params.code]);

  useEffect(() => {
    if (arSession) {
      // Vérifier périodiquement si le modèle est placé
      const checkPlacement = () => {
        if (arSession.isPlaced !== isPlaced) {
          setIsPlaced(arSession.isPlaced);
          if (arSession.isPlaced) {
            // Masquer les instructions après placement
            setTimeout(() => setShowInstructions(false), 3000);
          }
        }
      };

      const interval = setInterval(checkPlacement, 100);
      return () => clearInterval(interval);
    }
  }, [arSession, isPlaced]);

  const startAR = async () => {
    console.log("🚀 DÉBUT startAR()");
    console.log("📱 isARSupported:", isARSupported);
    console.log("📄 modelData:", modelData);

    if (!isARSupported) {
      console.log("❌ AR non supportée");
      toast.error("La réalité augmentée n'est pas disponible sur cet appareil");
      return;
    }

    try {
      console.log("🎬 Changement status vers ar-active");
      setStatus("ar-active");

      console.log("🔧 Création ARSession...");
      const session = new ARSession();

      console.log("⚡ Initialisation ARSession...");
      await session.init(modelData.modelURL, "fr");

      console.log("✅ ARSession initialisée, mise à jour state");
      setArSession(session);

      console.log("🎉 Succès AR - affichage toast");
      toast.success(
        "Session AR démarrée ! Pointez votre caméra vers une surface plane"
      );
    } catch (error) {
      console.error("❌ ERREUR GLOBALE AR:", error);
      console.log("🔄 Retour au status ready");
      setStatus("ready");
      toast.error("Impossible de démarrer la réalité augmentée");
    }
  };

  const closeAR = () => {
    if (arSession) {
      arSession.end();
      setArSession(null);
    }
    setStatus("ready");
    setIsPlaced(false);
    setShowInstructions(true);
  };

  const goHome = () => {
    if (arSession) {
      arSession.end();
    }
    router.push("/");
  };

  // Chargement initial
  if (isChecking || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cosmic-black via-cosmic-black/90 to-neon-blue/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/30 p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-lunar-white mb-2">
            Chargement du modèle 3D...
          </h1>
          <p className="text-lunar-white/70">
            Préparation de la réalité augmentée
          </p>
        </motion.div>
      </div>
    );
  }

  // Erreur
  if (status === "error") {
    const testARWithDefaultModel = () => {
      console.log("🧪 Test AR avec modèle par défaut");
      setModelData({
        modelURL: "/models/saturn_1.glb", // Modèle par défaut
        title: "Saturne (Debug)",
        moduleTitle: "Test AR",
      });
      setStatus("ready");
      setError(null);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-cosmic-black via-cosmic-black/90 to-neon-blue/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-red-500/30 p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-lunar-white mb-2">
            Erreur de chargement
          </h1>
          <p className="text-red-400 mb-4">{error}</p>

          <div className="space-y-3">
            <button
              onClick={goHome}
              className="w-full px-6 py-2 bg-gradient-to-r from-neon-blue to-neon-pink text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Retour à l'accueil
            </button>

            {/* Bouton de debug pour tester l'AR */}
            <button
              onClick={testARWithDefaultModel}
              className="w-full px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              🧪 Tester AR avec modèle par défaut
            </button>

            <p className="text-xs text-lunar-white/50 mt-2">
              Bouton de debug - Test AR sans code valide
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // AR non supportée
  if (!isARSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cosmic-black via-cosmic-black/90 to-neon-blue/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-amber-500/30 p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-amber-400"
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
          </div>
          <h1 className="text-xl font-bold text-lunar-white mb-2">
            AR non disponible
          </h1>
          <p className="text-amber-400 mb-4">
            La réalité augmentée n'est pas supportée sur cet appareil ou
            navigateur
          </p>
          <div className="text-left text-sm text-lunar-white/60 mb-4 space-y-1">
            <p>• Utilisez Chrome sur Android 7.0+</p>
            <p>• Utilisez Safari sur iOS 12.0+</p>
            <p>• Assurez-vous d'être sur mobile</p>
          </div>
          <button
            onClick={goHome}
            className="px-6 py-2 bg-gradient-to-r from-neon-blue to-neon-pink text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  // Page principale AR
  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-black via-cosmic-black/90 to-neon-blue/20">
      {/* En-tête */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-cosmic-black/80 backdrop-blur-md border-b border-neon-blue/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/Logo Final RTL.svg"
              alt="AstroLearn"
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Debug
            </button>

            <button
              onClick={goHome}
              className="flex items-center gap-2 text-lunar-white/70 hover:text-neon-blue transition-colors"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="pt-20 px-4 pb-4 min-h-screen flex flex-col items-center justify-center">
        {status === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md w-full"
          >
            {/* Info du modèle */}
            <div className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/30 p-6 mb-6">
              <h1 className="text-2xl font-bold text-lunar-white mb-2">
                {modelData.title}
              </h1>
              {modelData.moduleTitle && (
                <p className="text-neon-blue text-sm mb-4">
                  {modelData.moduleTitle}
                </p>
              )}
              <p className="text-lunar-white/70 text-sm">
                Explorez ce modèle 3D en réalité augmentée dans votre
                environnement réel !
              </p>
            </div>

            {/* Bouton AR principal */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startAR}
              className="w-full bg-gradient-to-r from-neon-blue to-neon-pink text-white text-lg font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-neon-blue/25 transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-3">
                <svg
                  className="w-6 h-6"
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
                Voir en AR
              </div>
            </motion.button>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-cosmic-black/50 rounded-lg border border-neon-blue/20">
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
                Comment utiliser l'AR :
              </h3>
              <ul className="text-lunar-white/70 text-sm space-y-1">
                <li>• Autorisez l'accès à votre caméra</li>
                <li>• Pointez vers une surface plane</li>
                <li>• Tapez pour placer le modèle</li>
                <li>• Déplacez-vous pour explorer</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      {/* Overlay AR */}
      <AnimatePresence>
        {status === "ar-active" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black"
          >
            {/* Contrôles AR */}
            <div className="absolute bottom-4 left-4 right-4 z-50">
              <div className="flex justify-between items-end">
                {/* Boutons de gauche */}
                <div className="flex gap-2">
                  {/* Bouton fermer */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeAR}
                    className="bg-red-500/80 backdrop-blur-md text-white p-3 rounded-full shadow-lg"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.button>

                  {/* Bouton debug */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDebug(!showDebug)}
                    className="bg-purple-500/80 backdrop-blur-md text-white p-3 rounded-full shadow-lg text-xs font-bold"
                  >
                    DBG
                  </motion.button>
                </div>

                {/* Bouton instructions */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="bg-neon-blue/80 backdrop-blur-md text-white p-3 rounded-full shadow-lg"
                >
                  <svg
                    className="w-6 h-6"
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
                </motion.button>
              </div>
            </div>

            {/* Overlay de debug mobile */}
            <MobileDebugOverlay
              isVisible={showDebug}
              onToggle={() => setShowDebug(!showDebug)}
            />

            {/* Instructions AR */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="absolute top-20 left-4 right-4 z-50"
                >
                  <div className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/30 p-4 text-center">
                    <h3 className="text-lunar-white font-semibold mb-2">
                      {isPlaced ? "Modèle placé !" : "Recherche de surface..."}
                    </h3>
                    <p className="text-lunar-white/70 text-sm">
                      {isPlaced
                        ? "Déplacez-vous autour du modèle pour l'explorer"
                        : "Pointez votre caméra vers une surface plane et tapez pour placer le modèle"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info code temporaire */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/20 p-3 text-center">
          <p className="text-xs text-lunar-white/60">
            🔒 Accès temporaire via code de partage
          </p>
          <p className="text-xs text-lunar-white/50 mt-1">
            Aucune connexion requise • Expire automatiquement
          </p>
        </div>
      </div>

      {/* Debug overlay global - toujours présent */}
      <MobileDebugOverlay
        isVisible={showDebug}
        onToggle={() => setShowDebug(!showDebug)}
      />
    </div>
  );
}
