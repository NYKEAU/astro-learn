"use client";

// Système de partage de session temporaire
export class SessionShare {
  constructor() {
    this.sessions = new Map();
    this.cleanup();
  }

  // Générer un code de session temporaire
  generateSessionCode(options = {}) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionData = {
      code,
      timestamp: Date.now(),
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      // Données additionnelles pour l'AR
      modelURL: options.modelURL || null,
      title: options.title || null,
      moduleTitle: options.moduleTitle || null,
      type: options.type || "normal", // 'normal' ou 'ar'
    };

    this.sessions.set(code, sessionData);

    // Sauvegarder dans localStorage pour persistance
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `astro_session_${code}`,
        JSON.stringify(sessionData)
      );
    }

    return code;
  }

  // Récupérer une session par code
  getSession(code) {
    // Vérifier d'abord en mémoire
    let session = this.sessions.get(code);

    // Si pas en mémoire, vérifier localStorage
    if (!session && typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(`astro_session_${code}`);
      if (stored) {
        try {
          session = JSON.parse(stored);
          if (session.expires > Date.now()) {
            this.sessions.set(code, session);
          } else {
            localStorage.removeItem(`astro_session_${code}`);
            session = null;
          }
        } catch (error) {
          console.warn("Erreur parsing session:", error);
          localStorage.removeItem(`astro_session_${code}`);
        }
      }
    }

    // Vérifier l'expiration
    if (session && session.expires < Date.now()) {
      this.sessions.delete(code);
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(`astro_session_${code}`);
      }
      return null;
    }

    return session;
  }

  // Nettoyer les sessions expirées
  cleanup() {
    const now = Date.now();

    // Nettoyer la mémoire
    for (const [code, session] of this.sessions.entries()) {
      if (session.expires < now) {
        this.sessions.delete(code);
      }
    }

    // Nettoyer localStorage
    if (typeof localStorage !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("astro_session_")) {
          try {
            const session = JSON.parse(localStorage.getItem(key));
            if (session.expires < now) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        }
      }
    }

    // Programmer le prochain nettoyage
    setTimeout(() => this.cleanup(), 5 * 60 * 1000); // Toutes les 5 minutes
  }

  // Générer une URL de partage avec code
  generateShareURL(baseURL = "", options = {}) {
    const code = this.generateSessionCode(options);
    const url = new URL(
      baseURL || (typeof window !== "undefined" ? window.location.origin : "")
    );

    // Choisir le chemin selon le type
    if (options.type === "ar") {
      url.pathname = `/ar/${code}`;
    } else {
      url.pathname = "/share";
      url.searchParams.set("code", code);
    }

    return url.toString();
  }

  // Méthode spécifique pour générer un lien AR
  generateARShareURL(modelURL, title, moduleTitle, baseURL = "") {
    return this.generateShareURL(baseURL, {
      type: "ar",
      modelURL,
      title,
      moduleTitle,
    });
  }
}

// Instance globale
export const sessionShare = new SessionShare();
