"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChange } from "@/lib/firebase/auth";
import PropTypes from "prop-types";

// Routes qui nécessitent une authentification
const protectedRoutes = ["/dashboard", "/profile", "/courses"];

// Routes accessibles uniquement aux utilisateurs non authentifiés
const authRoutes = ["/login", "/register"];

export function RouteGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Si l'utilisateur n'est pas authentifié et tente d'accéder à une route protégée
    if (!isAuthenticated && protectedRoutes.includes(pathname)) {
      router.push("/register");
    }

    // Si l'utilisateur est authentifié et tente d'accéder à une route d'authentification
    if (isAuthenticated && authRoutes.includes(pathname)) {
      router.push("/dashboard");
    }

    // Rediriger /registration vers /register pour assurer la consolidation
    if (pathname === "/registration") {
      router.push("/register");
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  return <>{children}</>;
}

RouteGuard.propTypes = {
  children: PropTypes.node.isRequired,
};
