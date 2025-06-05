"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function MobileDebugOverlay({ isVisible = false, onToggle }) {
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Capturer les console.log, console.error, etc.
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (level, args) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");

      setLogs((prev) => [
        {
          id: Date.now() + Math.random(),
          timestamp,
          level,
          message,
        },
        ...prev.slice(0, 19),
      ]); // Garder seulement 20 logs
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog("log", args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog("error", args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog("warn", args);
    };

    // Restaurer les fonctions originales au démontage
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [isVisible]);

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isVisible) return null;

  const getLogColor = (level) => {
    switch (level) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-yellow-400";
      default:
        return "text-green-400";
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Bouton toggle flottant */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-4 right-4 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold pointer-events-auto z-50"
      >
        {isExpanded ? "×" : "LOG"}
      </button>

      {/* Console de debug */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-black/90 backdrop-blur-sm text-white overflow-hidden pointer-events-auto"
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">Debug Console</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const logsText = logs
                        .map(
                          (log) =>
                            `${log.timestamp} [${log.level.toUpperCase()}]\n${
                              log.message
                            }`
                        )
                        .join("\n\n");

                      if (
                        navigator.clipboard &&
                        navigator.clipboard.writeText
                      ) {
                        navigator.clipboard
                          .writeText(logsText)
                          .then(() => {
                            alert("Logs copiés dans le presse-papiers !");
                          })
                          .catch(() => {
                            // Fallback pour les navigateurs plus anciens
                            const textarea = document.createElement("textarea");
                            textarea.value = logsText;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand("copy");
                            document.body.removeChild(textarea);
                            alert("Logs copiés !");
                          });
                      } else {
                        // Fallback pour navigateurs sans support clipboard
                        const textarea = document.createElement("textarea");
                        textarea.value = logsText;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textarea);
                        alert("Logs copiés !");
                      }
                    }}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={clearLogs}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded"
                  >
                    Clear
                  </button>
                  <button
                    onClick={onToggle}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-900 rounded p-2 font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Aucun log...</div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="mb-1 border-b border-gray-700 pb-1"
                    >
                      <div className="text-gray-400 text-xs">
                        {log.timestamp} [{log.level.toUpperCase()}]
                      </div>
                      <div className={`${getLogColor(log.level)} break-words`}>
                        {log.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
