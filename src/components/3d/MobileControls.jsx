"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ARButton } from './ARButton';

export function MobileControls({
    autoRotate,
    rotationSpeed,
    onAnimationChange,
    onClose,
    language = 'fr',
    modelURL
}) {
    const [showControls, setShowControls] = useState(true);

    const animationModes = [
        { name: language === 'fr' ? "Arrêt" : "Stop", speed: 0, active: !autoRotate },
        { name: language === 'fr' ? "Lent" : "Slow", speed: 0.005, active: autoRotate && rotationSpeed === 0.005 },
        { name: language === 'fr' ? "Normal" : "Normal", speed: 0.01, active: autoRotate && rotationSpeed === 0.01 },
        { name: language === 'fr' ? "Rapide" : "Fast", speed: 0.02, active: autoRotate && rotationSpeed === 0.02 },
    ];

    return (
        <>
            {/* Header avec titre et bouton fermer */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-cosmic-black/90 backdrop-blur-md border-b border-neon-blue/30 p-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-lunar-white">
                        {language === 'fr' ? 'Exploration 3D' : '3D Exploration'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
                        aria-label={language === 'fr' ? 'Fermer' : 'Close'}
                    >
                        <svg className="w-6 h-6 text-lunar-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Message d'aide tactile */}
            <div className="absolute top-20 left-4 right-4 z-20">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neon-blue/20 backdrop-blur-md rounded-lg border border-neon-blue/30 p-3"
                >
                    <p className="text-sm text-lunar-white text-center">
                        {language === 'fr'
                            ? "📱 Pincez pour zoomer • Faites glisser pour tourner"
                            : "📱 Pinch to zoom • Drag to rotate"
                        }
                    </p>
                </motion.div>
            </div>

            {/* Bouton pour afficher/masquer les contrôles */}
            <button
                onClick={() => setShowControls(!showControls)}
                className="absolute bottom-20 right-4 z-20 w-12 h-12 bg-cosmic-black/80 backdrop-blur-md rounded-full border border-neon-blue/30 flex items-center justify-center"
            >
                <svg
                    className={`w-6 h-6 text-lunar-white transition-transform ${showControls ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Contrôles d'animation et AR */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="absolute bottom-4 left-4 right-4 z-20 space-y-3"
                    >
                        {/* Bouton AR */}
                        <div className="flex justify-center">
                            <ARButton
                                modelURL={modelURL}
                                language={language}
                                className="w-full max-w-xs"
                            />
                        </div>

                        {/* Contrôles d'animation */}
                        <div className="bg-cosmic-black/90 backdrop-blur-md rounded-lg border border-neon-blue/30 p-4">
                            <p className="text-sm text-lunar-white/70 mb-3 text-center">
                                {language === 'fr' ? 'Animation' : 'Animation'}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {animationModes.map((mode) => (
                                    <button
                                        key={mode.name}
                                        onClick={() => onAnimationChange(mode.speed)}
                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${mode.active
                                            ? "bg-neon-blue text-cosmic-black"
                                            : "bg-cosmic-black/40 text-lunar-white/70 hover:bg-neon-blue/20 hover:text-lunar-white"
                                            }`}
                                    >
                                        {mode.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
} 