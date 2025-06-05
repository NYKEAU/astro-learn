"use client";

import { useState, useEffect } from "react";
import { diagnosticWebXR } from "@/lib/webxr/config";

export function WebXRDiagnostic({ onClose }) {
  const [diagnostic, setDiagnostic] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const result = await diagnosticWebXR();
      setDiagnostic(result);
    } catch (error) {
      console.error("Erreur diagnostic:", error);
      setDiagnostic({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusIcon = (status) => {
    if (status === true) return "✅";
    if (status === false) return "❌";
    if (status === "granted") return "✅";
    if (status === "denied") return "❌";
    if (status === "prompt") return "⚠️";
    return "❓";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🔍 Diagnostic WebXR</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {isRunning && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Exécution du diagnostic...</p>
            </div>
          )}

          {diagnostic && !isRunning && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div>
                <h3 className="font-semibold mb-2">
                  📱 Informations de l'appareil
                </h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p>
                    <strong>Navigateur:</strong> {diagnostic.userAgent}
                  </p>
                  <p>
                    <strong>Plateforme:</strong> {diagnostic.platform}
                  </p>
                  <p>
                    <strong>Langue:</strong> {diagnostic.language}
                  </p>
                  <p>
                    <strong>Protocole:</strong> {diagnostic.network?.protocol}{" "}
                    {diagnostic.network?.secure ? "🔒" : "🔓"}
                  </p>
                </div>
              </div>

              {/* Support WebXR */}
              <div>
                <h3 className="font-semibold mb-2">🥽 Support WebXR</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>API WebXR disponible</span>
                    <span>
                      {getStatusIcon(diagnostic.webxr?.available)}{" "}
                      {diagnostic.webxr?.available ? "Oui" : "Non"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>AR immersif supporté</span>
                    <span>
                      {getStatusIcon(diagnostic.webxr?.immersiveAR)}{" "}
                      {diagnostic.webxr?.immersiveAR ? "Oui" : "Non"}
                    </span>
                  </div>

                  {diagnostic.webxr?.features && (
                    <div className="mt-3">
                      <p className="font-medium mb-1">Fonctionnalités:</p>
                      {Object.entries(diagnostic.webxr.features).map(
                        ([feature, supported]) => (
                          <div
                            key={feature}
                            className="flex justify-between ml-4"
                          >
                            <span>{feature}</span>
                            <span>
                              {getStatusIcon(supported)}{" "}
                              {supported ? "Oui" : "Non"}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {diagnostic.webxr?.referenceSpace !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between">
                        <span>Reference Space</span>
                        <span
                          className={
                            diagnostic.webxr.referenceSpace === false
                              ? "text-red-600 font-bold"
                              : ""
                          }
                        >
                          {getStatusIcon(
                            diagnostic.webxr.referenceSpace !== false
                          )}
                          {diagnostic.webxr.referenceSpace || "Non disponible"}
                        </span>
                      </div>

                      {diagnostic.webxr?.availableReferenceSpaces && (
                        <div className="mt-2 ml-4 text-sm">
                          <p className="font-medium mb-1">
                            Espaces disponibles:
                          </p>
                          {diagnostic.webxr.availableReferenceSpaces.length >
                          0 ? (
                            diagnostic.webxr.availableReferenceSpaces.map(
                              (space) => (
                                <div key={space} className="text-green-600">
                                  ✅ {space}
                                </div>
                              )
                            )
                          ) : (
                            <div className="text-red-600">
                              ❌ Aucun espace supporté
                            </div>
                          )}
                        </div>
                      )}

                      {diagnostic.webxr.referenceSpace === false && (
                        <div className="text-red-600 text-sm mt-1">
                          ⚠️ CRITIQUE: Sans reference space, l'AR ne peut pas
                          fonctionner
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions caméra */}
              <div>
                <h3 className="font-semibold mb-2">📹 Permissions caméra</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Permission caméra</span>
                    <span>
                      {getStatusIcon(diagnostic.permissions?.camera)}{" "}
                      {diagnostic.permissions?.camera || "Inconnue"}
                    </span>
                  </div>
                  {diagnostic.permissions?.cameraTest && (
                    <div className="flex justify-between">
                      <span>Test d'accès caméra</span>
                      <span>
                        {getStatusIcon(
                          diagnostic.permissions.cameraTest === "success"
                        )}{" "}
                        {diagnostic.permissions.cameraTest}
                      </span>
                    </div>
                  )}
                  {diagnostic.permissions?.cameraError && (
                    <div className="text-red-600 text-sm mt-2">
                      <strong>Erreur:</strong>{" "}
                      {diagnostic.permissions.cameraError}
                    </div>
                  )}
                </div>
              </div>

              {/* Type d'appareil */}
              <div>
                <h3 className="font-semibold mb-2">📱 Appareil</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Type d'appareil</span>
                    <span>{diagnostic.device?.type || "Inconnu"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Support AR</span>
                    <span>{diagnostic.device?.arSupport || "Inconnu"}</span>
                  </div>
                </div>
              </div>

              {/* Recommandations */}
              <div>
                <h3 className="font-semibold mb-2">💡 Recommandations</h3>
                <div className="bg-yellow-50 p-3 rounded">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {!diagnostic.webxr?.available && (
                      <li>Utilisez Chrome/Edge 79+ ou Safari 13+</li>
                    )}
                    {!diagnostic.webxr?.immersiveAR && (
                      <li>
                        Vérifiez que ARCore (Android) ou ARKit (iOS) est
                        installé et activé
                      </li>
                    )}
                    {diagnostic.webxr?.referenceSpace === false && (
                      <li className="text-red-600 font-bold">
                        CRITIQUE: Reference space non disponible - redémarrez
                        ARCore/ARKit
                      </li>
                    )}
                    {diagnostic.permissions?.camera === "denied" && (
                      <li>
                        Autorisez l'accès à la caméra dans les paramètres du
                        navigateur
                      </li>
                    )}
                    {!diagnostic.network?.secure && (
                      <li>Utilisez HTTPS en production (WebXR requis)</li>
                    )}
                    {diagnostic.device?.type === "unknown" && (
                      <li>L'AR fonctionne mieux sur mobile (Android/iOS)</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={runDiagnostic}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isRunning}
                >
                  🔄 Relancer le diagnostic
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(diagnostic, null, 2)
                    );
                    alert("Diagnostic copié dans le presse-papiers");
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  📋 Copier le rapport
                </button>
              </div>
            </div>
          )}

          {diagnostic?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong>Erreur lors du diagnostic:</strong> {diagnostic.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
