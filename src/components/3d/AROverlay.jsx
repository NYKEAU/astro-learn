"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInstruction } from '@/lib/webxr/config';

export function AROverlay({ arSession, language = 'fr', onClose }) {
    const [isPlaced, setIsPlaced] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);

    useEffect(() => {
        if (!arSession) return;

        // Écouter les événements de placement
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
    }, [arSession, isPlaced]);

    const handleClose = () => {
        if (arSession) {
            arSession.end();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Instructions en haut */}
            <AnimatePresence>
                {showInstructions && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="absolute top-4 left-4 right-4 pointer-events-auto"
                    >
                        <div className="bg-black/80 backdrop-blur-md rounded-lg border border-white/20 p-4">
                            <p className="text-white text-sm text-center">
                                {!isPlaced ? (
                                    <>
                                        📱 {getInstruction('tapToPlace', language)}
                                    </>
                                ) : (
                                    <>
                                        ✅ {getInstruction('modelPlaced', language)}
                                    </>
                                )}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contrôles en bas */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-auto">
                {/* Bouton fermer */}
                <button
                    onClick={handleClose}
                    className="bg-red-500/80 hover:bg-red-500 text-white p-3 rounded-full transition-colors shadow-lg"
                    aria-label={language === 'fr' ? 'Fermer AR' : 'Close AR'}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Bouton instructions */}
                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="bg-blue-500/80 hover:bg-blue-500 text-white p-3 rounded-full transition-colors shadow-lg"
                    aria-label={language === 'fr' ? 'Afficher/masquer les instructions' : 'Show/hide instructions'}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>

            {/* Indicateur de statut */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                {!isPlaced && (
                    <div className="text-white text-center">
                        <div className="w-16 h-16 border-4 border-green-500 rounded-full mb-2 mx-auto animate-pulse"></div>
                        <p className="text-sm">
                            {getInstruction('scanning', language)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 