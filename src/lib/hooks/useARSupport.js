"use client";

import { useState, useEffect } from 'react';
import { ARSession } from '../webxr/ARSession';

export function useARSupport() {
    const [isARSupported, setIsARSupported] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkARSupport = async () => {
            try {
                // Vérifier si WebXR est disponible
                if ('xr' in navigator) {
                    // Vérifier le support de la session AR immersive
                    const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                    setIsARSupported(isSupported);
                } else {
                    // Fallback : vérifier les user agents connus pour supporter AR
                    const userAgent = navigator.userAgent.toLowerCase();
                    const isARCapableDevice =
                        /android/i.test(userAgent) || // Android avec ARCore
                        /iphone|ipad/i.test(userAgent); // iOS avec ARKit

                    setIsARSupported(isARCapableDevice);
                }
            } catch (error) {
                console.warn('Erreur lors de la vérification du support AR:', error);
                setIsARSupported(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkARSupport();
    }, []);

    return { isARSupported, isChecking };
}

export async function startARSession(modelURL, language = 'fr') {
    try {
        const arSession = new ARSession();
        await arSession.init(modelURL, language);
        return arSession;
    } catch (error) {
        console.error('❌ Erreur lors du démarrage de la session AR:', error);
        throw error;
    }
} 