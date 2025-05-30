"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sessionShare } from '@/lib/session/SessionShare';
import { motion } from 'framer-motion';

export default function SharePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');

        if (!code) {
            setStatus('error');
            setError('Code de partage manquant');
            return;
        }

        // Récupérer la session
        const session = sessionShare.getSession(code);

        if (!session) {
            setStatus('error');
            setError('Code de partage invalide ou expiré');
            return;
        }

        // Extraire l'URL de destination
        try {
            const targetURL = new URL(session.url);
            const targetPath = targetURL.pathname + targetURL.search;

            setStatus('redirecting');

            // Rediriger après un court délai pour l'animation
            setTimeout(() => {
                router.push(targetPath);
            }, 1500);

        } catch (error) {
            setStatus('error');
            setError('URL de destination invalide');
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-cosmic-black via-cosmic-black/90 to-neon-blue/20 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/30 p-8 max-w-md w-full text-center"
            >
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto mb-4"></div>
                        <h1 className="text-xl font-bold text-lunar-white mb-2">
                            Vérification du partage...
                        </h1>
                        <p className="text-lunar-white/70">
                            Validation du code de partage en cours
                        </p>
                    </>
                )}

                {status === 'redirecting' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 bg-gradient-to-r from-neon-blue to-neon-pink rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                        <h1 className="text-xl font-bold text-lunar-white mb-2">
                            Partage validé !
                        </h1>
                        <p className="text-lunar-white/70">
                            Redirection vers la leçon...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-lunar-white mb-2">
                            Erreur de partage
                        </h1>
                        <p className="text-red-400 mb-4">
                            {error}
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-2 bg-gradient-to-r from-neon-blue to-neon-pink text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Retour à l'accueil
                        </button>
                    </>
                )}

                {/* Info sur le partage */}
                <div className="mt-6 p-3 bg-cosmic-black/50 rounded-lg">
                    <p className="text-xs text-lunar-white/60">
                        🔒 Partage sécurisé et temporaire
                    </p>
                    <p className="text-xs text-lunar-white/50 mt-1">
                        Ce lien expire automatiquement après 10 minutes
                    </p>
                </div>
            </motion.div>
        </div>
    );
} 