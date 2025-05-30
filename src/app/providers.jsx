"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { LanguageProvider } from "@/lib/LanguageContext";

// Contexte d'authentification
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    // Expose les propriétés supplémentaires de l'utilisateur
    role: user?.role || null, // 'free', 'premium' ou null pour les visiteurs non connectés
    isPremium: user?.role === 'premium',
    isFree: user?.role === 'free',
    isVisitor: !user,
    premiumUntil: user?.premiumUntil || null,
    unlockedModules: user?.unlockedModules || [],
    progression: user?.progression || {},
  };

  return (
    <AuthContext.Provider value={value}>
      <LanguageProvider>{children}</LanguageProvider>
    </AuthContext.Provider>
  );
}
