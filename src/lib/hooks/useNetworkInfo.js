"use client";

import { useState, useEffect } from 'react';

export function useNetworkInfo() {
    const [networkInfo, setNetworkInfo] = useState({
        localIP: 'localhost',
        isLoading: true,
        error: null
    });

    useEffect(() => {
        const fetchNetworkInfo = async () => {
            try {
                const response = await fetch('/api/network-info');
                const data = await response.json();

                if (data.success) {
                    setNetworkInfo({
                        localIP: data.localIP,
                        isLoading: false,
                        error: null,
                        isDevelopment: data.isDevelopment,
                        allInterfaces: data.allInterfaces
                    });
                } else {
                    throw new Error(data.error || 'Erreur inconnue');
                }
            } catch (error) {
                console.warn('Impossible de récupérer l\'IP locale:', error);
                setNetworkInfo({
                    localIP: 'localhost',
                    isLoading: false,
                    error: error.message
                });
            }
        };

        fetchNetworkInfo();
    }, []);

    // Fonction utilitaire pour générer une URL mobile
    const getMobileURL = (currentURL) => {
        if (!currentURL) return '';

        // En développement, remplacer localhost par l'IP locale
        if ((currentURL.includes('localhost') || currentURL.includes('127.0.0.1')) &&
            networkInfo.localIP !== 'localhost') {
            const url = new URL(currentURL);
            url.hostname = networkInfo.localIP;
            return url.toString();
        }

        return currentURL;
    };

    return {
        ...networkInfo,
        getMobileURL
    };
} 