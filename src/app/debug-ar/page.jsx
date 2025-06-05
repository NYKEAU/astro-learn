"use client";

import { useState, useEffect } from "react";
import { sessionShare } from "@/lib/session/SessionShare";

export default function DebugARPage() {
  const [sessions, setSessions] = useState([]);
  const [localStorageSessions, setLocalStorageSessions] = useState([]);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = () => {
    // Sessions en mémoire
    const memorySessions = [];
    for (const [code, session] of sessionShare.sessions.entries()) {
      memorySessions.push({ code, session, source: "memory" });
    }
    setSessions(memorySessions);

    // Sessions en localStorage
    const storageSessions = [];
    if (typeof localStorage !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("astro_session_")) {
          try {
            const session = JSON.parse(localStorage.getItem(key));
            const code = key.replace("astro_session_", "");
            storageSessions.push({
              code,
              session,
              source: "localStorage",
              expired: session.expires < Date.now(),
            });
          } catch (error) {
            storageSessions.push({
              code: key.replace("astro_session_", ""),
              session: { error: error.message },
              source: "localStorage",
              expired: true,
            });
          }
        }
      }
    }
    setLocalStorageSessions(storageSessions);
  };

  const generateTestCode = () => {
    const code = sessionShare.generateSessionCode({
      type: "ar",
      modelURL: "https://example.com/model.glb",
      title: "Test Model",
      moduleTitle: "Test Module",
    });
    console.log("Code de test généré:", code);
    loadSessions();
  };

  const clearAll = () => {
    // Vider la mémoire
    sessionShare.sessions.clear();

    // Vider localStorage
    if (typeof localStorage !== "undefined") {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("astro_session_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    loadSessions();
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

  return (
    <div className="min-h-screen bg-cosmic-black text-lunar-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neon-blue mb-6">
          Debug AR Sessions
        </h1>

        <div className="mb-6 flex gap-4">
          <button
            onClick={generateTestCode}
            className="px-4 py-2 bg-neon-blue text-cosmic-black rounded-lg hover:bg-neon-blue/80"
          >
            Générer Code Test
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Tout Effacer
          </button>
          <button
            onClick={loadSessions}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Rafraîchir
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sessions en mémoire */}
          <div className="bg-cosmic-black/50 p-6 rounded-lg border border-neon-blue/30">
            <h2 className="text-xl font-bold text-neon-blue mb-4">
              Sessions en Mémoire ({sessions.length})
            </h2>
            {sessions.length === 0 ? (
              <p className="text-lunar-white/60">Aucune session en mémoire</p>
            ) : (
              sessions.map(({ code, session }) => (
                <div
                  key={code}
                  className="mb-4 p-3 bg-cosmic-black/30 rounded border-l-4 border-neon-blue"
                >
                  <div className="font-mono text-neon-blue text-lg">{code}</div>
                  <div className="text-sm text-lunar-white/80">
                    <div>Type: {session.type}</div>
                    <div>Créé: {formatTime(session.timestamp)}</div>
                    <div>Expire: {getTimeRemaining(session.expires)}</div>
                    <div>Model: {session.modelURL ? "✅" : "❌"}</div>
                    <div>Title: {session.title || "N/A"}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sessions en localStorage */}
          <div className="bg-cosmic-black/50 p-6 rounded-lg border border-neon-pink/30">
            <h2 className="text-xl font-bold text-neon-pink mb-4">
              Sessions en localStorage ({localStorageSessions.length})
            </h2>
            {localStorageSessions.length === 0 ? (
              <p className="text-lunar-white/60">
                Aucune session en localStorage
              </p>
            ) : (
              localStorageSessions.map(({ code, session, expired }) => (
                <div
                  key={code}
                  className={`mb-4 p-3 bg-cosmic-black/30 rounded border-l-4 ${
                    expired ? "border-red-500" : "border-neon-pink"
                  }`}
                >
                  <div className="font-mono text-neon-pink text-lg">{code}</div>
                  {session.error ? (
                    <div className="text-red-400">Erreur: {session.error}</div>
                  ) : (
                    <div className="text-sm text-lunar-white/80">
                      <div>Type: {session.type}</div>
                      <div>Créé: {formatTime(session.timestamp)}</div>
                      <div className={expired ? "text-red-400" : ""}>
                        Expire: {getTimeRemaining(session.expires)}
                      </div>
                      <div>Model: {session.modelURL ? "✅" : "❌"}</div>
                      <div>Title: {session.title || "N/A"}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Infos système */}
        <div className="mt-6 bg-cosmic-black/50 p-6 rounded-lg border border-lunar-white/30">
          <h2 className="text-xl font-bold text-lunar-white mb-4">
            Infos Système
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold">localStorage:</div>
              <div>
                {typeof localStorage !== "undefined"
                  ? "✅ Disponible"
                  : "❌ Non disponible"}
              </div>
            </div>
            <div>
              <div className="font-semibold">Instance sessionShare:</div>
              <div>{sessionShare ? "✅ Chargée" : "❌ Non chargée"}</div>
            </div>
            <div>
              <div className="font-semibold">Timestamp actuel:</div>
              <div>{Date.now()}</div>
            </div>
          </div>
        </div>

        {/* Liens de test */}
        <div className="mt-6 bg-cosmic-black/50 p-6 rounded-lg border border-amber-500/30">
          <h2 className="text-xl font-bold text-amber-400 mb-4">
            Liens de Test
          </h2>
          <div className="space-y-2">
            {sessions.map(({ code }) => (
              <div key={code} className="flex items-center gap-4">
                <span className="font-mono text-neon-blue">{code}</span>
                <a
                  href={`/ar/${code}`}
                  className="text-amber-400 hover:text-amber-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  /ar/{code}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
