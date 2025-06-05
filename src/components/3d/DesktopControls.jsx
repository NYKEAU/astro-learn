"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNetworkInfo } from "@/lib/hooks/useNetworkInfo";
import { sessionShare } from "@/lib/session/SessionShare";

export function DesktopControls({
  autoRotate,
  rotationSpeed,
  onAnimationChange,
  language = "fr",
  modelURL,
  title = "Modèle 3D",
  moduleTitle = "",
}) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [shareMode, setShareMode] = useState("qr"); // 'qr' ou 'code'
  const [shareCode, setShareCode] = useState("");
  const { getMobileURL, localIP, isLoading } = useNetworkInfo();

  const animationModes = [
    {
      name: language === "fr" ? "Arrêt" : "Stop",
      speed: 0,
      active: !autoRotate,
    },
    {
      name: language === "fr" ? "Lent" : "Slow",
      speed: 0.005,
      active: autoRotate && rotationSpeed === 0.005,
    },
    {
      name: language === "fr" ? "Normal" : "Normal",
      speed: 0.01,
      active: autoRotate && rotationSpeed === 0.01,
    },
    {
      name: language === "fr" ? "Rapide" : "Fast",
      speed: 0.02,
      active: autoRotate && rotationSpeed === 0.02,
    },
  ];

  // Générer l'URL AR pour mobile
  const generateARURL = () => {
    return sessionShare.generateARShareURL(modelURL, title, moduleTitle);
  };

  const mobileURL = generateARURL();
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    mobileURL
  )}`;

  // Générer un code de partage AR
  const generateShareCode = () => {
    const code = sessionShare.generateSessionCode({
      type: "ar",
      modelURL,
      title,
      moduleTitle,
    });
    setShareCode(code);
    return code;
  };

  const handleShareClick = () => {
    setShowQRModal(true);
    if (shareMode === "code" && !shareCode) {
      generateShareCode();
    }
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Bouton QR Code */}
        <button
          onClick={handleShareClick}
          className="px-3 py-2 rounded-lg text-xs font-medium transition-colors bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 flex items-center gap-2"
          aria-label={
            language === "fr" ? "Envoyer sur mobile" : "Send to mobile"
          }
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
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          {language === "fr" ? "Sur mobile" : "To mobile"}
          {isLoading && (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
          )}
        </button>

        <div className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/30 p-3">
          <p className="text-xs text-lunar-white/70 mb-2">
            {language === "fr" ? "Animation" : "Animation"}
          </p>
          <div className="flex flex-col gap-1">
            {animationModes.map((mode) => (
              <button
                key={mode.name}
                onClick={() => onAnimationChange(mode.speed)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  mode.active
                    ? "bg-neon-blue text-cosmic-black"
                    : "bg-cosmic-black/40 text-lunar-white/70 hover:bg-neon-blue/20 hover:text-lunar-white"
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal QR Code */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-cosmic-black/90 backdrop-blur-md rounded-lg border border-neon-blue/30 p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-lunar-white">
                  {language === "fr"
                    ? "Partager sur mobile"
                    : "Share to mobile"}
                </h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-lunar-white/70 hover:text-lunar-white transition-colors"
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
                </button>
              </div>

              {/* Sélecteur de mode */}
              <div className="flex mb-4 bg-cosmic-black/50 rounded-lg p-1">
                <button
                  onClick={() => setShareMode("qr")}
                  className={`flex-1 py-2 px-3 rounded text-xs transition-colors ${
                    shareMode === "qr"
                      ? "bg-neon-blue text-cosmic-black"
                      : "text-lunar-white/70 hover:text-lunar-white"
                  }`}
                >
                  QR Code
                </button>
                <button
                  onClick={() => {
                    setShareMode("code");
                    if (!shareCode) generateShareCode();
                  }}
                  className={`flex-1 py-2 px-3 rounded text-xs transition-colors ${
                    shareMode === "code"
                      ? "bg-neon-blue text-cosmic-black"
                      : "text-lunar-white/70 hover:text-lunar-white"
                  }`}
                >
                  {language === "fr" ? "Code" : "Code"}
                </button>
              </div>

              {/* Contenu selon le mode */}
              {shareMode === "qr" ? (
                <>
                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-4 rounded-lg">
                      <img
                        src={qrCodeURL}
                        alt="QR Code"
                        className="w-48 h-48"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycmV1ciBRUjwvdGV4dD48L3N2Zz4=";
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-lunar-white/80 mb-2 text-center">
                    {language === "fr"
                      ? "Scannez ce QR code pour ouvrir en réalité augmentée"
                      : "Scan this QR code to open in augmented reality"}
                  </p>

                  {/* Info réseau */}
                  <div className="mt-3 p-3 bg-cosmic-black/50 rounded-lg">
                    <div className="text-xs text-lunar-white/70 mb-1">
                      {language === "fr"
                        ? "Adresse réseau :"
                        : "Network address:"}
                    </div>
                    <div className="text-xs text-lunar-white/90 font-mono break-all">
                      {localIP === "localhost" ? (
                        <span className="text-yellow-400">
                          {language === "fr"
                            ? "Localhost uniquement"
                            : "Localhost only"}
                        </span>
                      ) : (
                        <span className="text-green-400">{localIP}</span>
                      )}
                    </div>
                    {localIP === "localhost" && (
                      <div className="text-xs text-lunar-white/50 mt-1">
                        {language === "fr"
                          ? "Connectez-vous au même réseau WiFi"
                          : "Connect to the same WiFi network"}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Code de partage */}
                  <div className="text-center mb-4">
                    <div className="bg-gradient-to-r from-neon-blue to-neon-pink p-4 rounded-lg mb-3">
                      <div className="text-2xl font-bold text-white tracking-wider">
                        {shareCode}
                      </div>
                    </div>
                    <p className="text-sm text-lunar-white/80 mb-2">
                      {language === "fr"
                        ? "Entrez ce code pour accéder à l'AR"
                        : "Enter this code to access AR"}
                    </p>
                    <p className="text-xs text-lunar-white/60">
                      {language === "fr"
                        ? "Allez sur astrolearn.nicolaslhommeau.com/ar/ puis entrez le code"
                        : "Go to astrolearn.nicolaslhommeau.com/ar/ then enter the code"}
                    </p>
                  </div>

                  {/* Bouton copier */}
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(shareCode);
                    }}
                    className="w-full py-2 px-4 bg-cosmic-black/50 hover:bg-cosmic-black/70 text-lunar-white rounded-lg transition-colors text-sm"
                  >
                    📋 {language === "fr" ? "Copier le code" : "Copy code"}
                  </button>

                  {/* Info expiration */}
                  <div className="mt-3 p-3 bg-cosmic-black/50 rounded-lg">
                    <p className="text-xs text-lunar-white/60">
                      ⏱️{" "}
                      {language === "fr"
                        ? "Expire dans 10 minutes"
                        : "Expires in 10 minutes"}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
