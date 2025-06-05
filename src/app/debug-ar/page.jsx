"use client";

import { useState, useEffect } from "react";
import { arCodeShare } from "@/lib/session/ARCodeShare";

export default function DebugARPage() {
  const [testCodes, setTestCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testInput, setTestInput] = useState("");

  useEffect(() => {
    // Charger les codes de test depuis localStorage
    const saved = localStorage.getItem("debug_ar_codes");
    if (saved) {
      try {
        setTestCodes(JSON.parse(saved));
      } catch (error) {
        console.warn("Erreur chargement codes debug:", error);
      }
    }
  }, []);

  const saveTestCodes = (codes) => {
    setTestCodes(codes);
    localStorage.setItem("debug_ar_codes", JSON.stringify(codes));
  };

  const generateTestCode = async () => {
    setIsLoading(true);
    try {
      const code = await arCodeShare.generateARCode(
        "/models/saturn_1.glb",
        "Saturne (Test Debug)",
        "Module Test"
      );
      console.log("✅ Code de test généré:", code);

      const newTestCode = {
        code,
        modelURL: "/models/saturn_1.glb",
        title: "Saturne (Test Debug)",
        moduleTitle: "Module Test",
        timestamp: Date.now(),
        expires: Date.now() + 30 * 60 * 1000,
        status: "generated",
      };

      const updatedCodes = [newTestCode, ...testCodes.slice(0, 9)];
      saveTestCodes(updatedCodes);
    } catch (error) {
      console.error("❌ Erreur génération code de test:", error);
      alert(`Erreur: ${error.message}`);
    }
    setIsLoading(false);
  };

  const testExistingCode = async (code) => {
    setIsLoading(true);
    try {
      console.log(`🔍 Test du code: ${code}`);
      const result = await arCodeShare.getARCode(code);

      if (result) {
        console.log(`✅ Code ${code} valide:`, result);

        // Mettre à jour le statut dans notre liste
        const updatedCodes = testCodes.map((tc) =>
          tc.code === code
            ? { ...tc, status: "valid", lastTest: Date.now(), data: result }
            : tc
        );
        saveTestCodes(updatedCodes);

        alert(
          `✅ Code ${code} VALIDE!\nModèle: ${result.title}\nModule: ${result.moduleTitle}`
        );
      } else {
        console.log(`❌ Code ${code} invalide`);

        // Mettre à jour le statut
        const updatedCodes = testCodes.map((tc) =>
          tc.code === code
            ? { ...tc, status: "invalid", lastTest: Date.now() }
            : tc
        );
        saveTestCodes(updatedCodes);

        alert(`❌ Code ${code} invalide ou expiré`);
      }
    } catch (error) {
      console.error(`❌ Erreur test code ${code}:`, error);
      alert(`Erreur test: ${error.message}`);
    }
    setIsLoading(false);
  };

  const testManualCode = async () => {
    if (!testInput.trim()) {
      alert("Veuillez saisir un code");
      return;
    }
    await testExistingCode(testInput.trim().toUpperCase());
    setTestInput("");
  };

  const clearTestCodes = () => {
    setTestCodes([]);
    localStorage.removeItem("debug_ar_codes");
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTimeRemaining = (expires) => {
    const remaining = expires - Date.now();
    if (remaining <= 0) return "Expiré";
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "valid":
        return "border-green-500 bg-green-500/10";
      case "invalid":
        return "border-red-500 bg-red-500/10";
      case "generated":
        return "border-neon-blue bg-neon-blue/10";
      default:
        return "border-lunar-white/30 bg-cosmic-black/30";
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-black text-lunar-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neon-blue mb-6">
          🔧 Debug AR Codes (Firebase)
        </h1>

        {/* Actions */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={generateTestCode}
            disabled={isLoading}
            className="px-4 py-3 bg-neon-blue text-cosmic-black rounded-lg hover:bg-neon-blue/80 disabled:opacity-50 font-medium"
          >
            {isLoading ? "⏳ Génération..." : "🧪 Générer Code Test"}
          </button>

          <button
            onClick={clearTestCodes}
            className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
          >
            🗑️ Effacer Historique
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value.toUpperCase())}
              placeholder="CODE"
              className="flex-1 px-3 py-2 bg-cosmic-black/50 border border-lunar-white/30 rounded text-lunar-white placeholder-lunar-white/50"
              maxLength="6"
            />
            <button
              onClick={testManualCode}
              disabled={isLoading}
              className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
            >
              Test
            </button>
          </div>
        </div>

        {/* Codes de test */}
        <div className="bg-cosmic-black/50 p-6 rounded-lg border border-neon-blue/30">
          <h2 className="text-xl font-bold text-neon-blue mb-4">
            Codes de Test ({testCodes.length})
          </h2>

          {testCodes.length === 0 ? (
            <p className="text-lunar-white/60 text-center py-8">
              Aucun code de test. Générez-en un pour commencer !
            </p>
          ) : (
            <div className="space-y-3">
              {testCodes.map((tc, index) => (
                <div
                  key={tc.code}
                  className={`p-4 rounded-lg border-2 ${getStatusColor(
                    tc.status
                  )}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-xl text-neon-blue">
                      {tc.code}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => testExistingCode(tc.code)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 disabled:opacity-50"
                      >
                        {isLoading ? "⏳" : "🔍 Test"}
                      </button>
                      <a
                        href={`/ar/${tc.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-neon-pink text-white text-sm rounded hover:bg-neon-pink/80"
                      >
                        🚀 Ouvrir
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-lunar-white/70">Modèle:</div>
                      <div>{tc.title}</div>
                      <div className="text-lunar-white/70 mt-1">Module:</div>
                      <div>{tc.moduleTitle}</div>
                    </div>
                    <div>
                      <div className="text-lunar-white/70">Généré:</div>
                      <div>{formatTime(tc.timestamp)}</div>
                      <div className="text-lunar-white/70 mt-1">Expire:</div>
                      <div
                        className={
                          tc.expires < Date.now()
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      >
                        {getTimeRemaining(tc.expires)}
                      </div>
                    </div>
                  </div>

                  {tc.status && (
                    <div className="mt-2 pt-2 border-t border-lunar-white/20">
                      <div className="text-xs">
                        <span className="text-lunar-white/70">Statut: </span>
                        <span
                          className={
                            tc.status === "valid"
                              ? "text-green-400"
                              : tc.status === "invalid"
                              ? "text-red-400"
                              : "text-neon-blue"
                          }
                        >
                          {tc.status === "valid"
                            ? "✅ Valide"
                            : tc.status === "invalid"
                            ? "❌ Invalide"
                            : "🆕 Généré"}
                        </span>
                        {tc.lastTest && (
                          <span className="text-lunar-white/50 ml-2">
                            (testé à {formatTime(tc.lastTest)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Infos système */}
        <div className="mt-6 bg-cosmic-black/50 p-6 rounded-lg border border-lunar-white/30">
          <h2 className="text-xl font-bold text-lunar-white mb-4">
            Infos Système
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold">Type de stockage:</div>
              <div className="text-neon-blue">🔥 Firebase Storage</div>
            </div>
            <div>
              <div className="font-semibold">Dossier AR:</div>
              <div className="font-mono text-neon-pink">
                /arcode/{"{code}"}.json
              </div>
            </div>
            <div>
              <div className="font-semibold">Expiration:</div>
              <div>30 minutes</div>
            </div>
            <div>
              <div className="font-semibold">Timestamp:</div>
              <div className="font-mono">{Date.now()}</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
          <h3 className="font-bold text-amber-400 mb-2">📋 Instructions</h3>
          <div className="text-sm text-amber-200 space-y-1">
            <p>
              • <strong>Générer Code Test</strong>: Crée un nouveau code AR avec
              Saturne
            </p>
            <p>
              • <strong>Test</strong>: Vérifie si un code existe et est valide
              sur Firebase
            </p>
            <p>
              • <strong>Ouvrir</strong>: Lance la page AR avec le code
            </p>
            <p>
              • Les codes sont maintenant{" "}
              <strong>partagés entre appareils</strong> via Firebase! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
