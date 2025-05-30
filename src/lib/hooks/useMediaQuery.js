"use client";

import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Vérifier immédiatement la taille d'écran
        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [query]);

    // Pour éviter l'hydratation mismatch, on peut utiliser window.innerWidth comme fallback
    useEffect(() => {
        if (!mounted && typeof window !== 'undefined') {
            // Détection rapide pour mobile
            if (query === '(max-width: 768px)') {
                setMatches(window.innerWidth <= 768);
            }
        }
    }, [query, mounted]);

    return matches;
}

// Hooks prédéfinis pour les breakpoints courants
export function useIsMobile() {
    return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet() {
    return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useIsDesktop() {
    return useMediaQuery('(min-width: 1025px)');
} 