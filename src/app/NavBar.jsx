"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useLanguage } from "@/lib/LanguageContext";
import { usePageTransition } from "@/lib/hooks/usePageTransition";
import { useRouter } from "next/navigation";

const NavBar = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguage();
  const { navigateToProfile, navigateToSettings } = usePageTransition();
  const router = useRouter();

  // Liste des routes où la NavBar ne doit pas être affichée
  const hiddenRoutes = ["/register"];

  // Fermer le menu au changement de page
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Vérifier si on doit masquer la NavBar
  if (hiddenRoutes.some((route) => pathname?.startsWith(route))) {
    return null;
  }

  const isActive = (path) => {
    return pathname === path
      ? "bg-neon-blue/20 text-neon-blue"
      : "text-lunar-white/80 hover:text-neon-blue";
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-cosmic-black/80 backdrop-blur-md border-b border-neon-blue/20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-cosmic-purple">
            AstroLearn
          </span>
        </Link>

        {/* Navigation - Desktop */}
        <div className="hidden md:flex items-center space-x-1">
          <Link
            href="/"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive(
              "/"
            )}`}
          >
            {language === "fr" ? "Accueil" : "Home"}
          </Link>
          <Link
            href="/modules"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive(
              "/modules"
            )}`}
          >
            {language === "fr" ? "Modules" : "Modules"}
          </Link>
          <Link
            href="/universe"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive(
              "/universe"
            )}`}
          >
            {language === "fr" ? "Mon Univers" : "My Universe"}
          </Link>
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive(
              "/dashboard"
            )}`}
          >
            {language === "fr" ? "Tableau de bord" : "Dashboard"}
          </Link>
        </div>

        {/* Actions - Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Sélecteur de langue */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 rounded-md text-sm text-lunar-white/80 hover:text-neon-blue transition-colors duration-200"
          >
            {language === "fr" ? "EN" : "FR"}
          </button>

          {user ? (
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <button className="flex items-center space-x-2 bg-cosmic-black/60 hover:bg-cosmic-black border border-neon-blue/30 rounded-full py-1 px-3 transition-all duration-200">
                  <div className="w-7 h-7 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                    {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                  </div>
                  <span className="text-sm text-lunar-white/90">
                    {user.displayName?.split(" ")[0] || "User"}
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-cosmic-black border border-neon-blue/30 rounded-md shadow-lg overflow-hidden z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <div className="py-1">
                    <button
                      onClick={navigateToProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-lunar-white/80 hover:text-neon-blue hover:bg-cosmic-black/60"
                    >
                      {language === "fr" ? "Mon Profil" : "My Profile"}
                    </button>
                    <button
                      onClick={navigateToSettings}
                      className="block w-full text-left px-4 py-2 text-sm text-lunar-white/80 hover:text-neon-blue hover:bg-cosmic-black/60"
                    >
                      {language === "fr" ? "Paramètres" : "Settings"}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-lunar-white/80 hover:text-cosmic-red hover:bg-cosmic-black/60"
                    >
                      {language === "fr" ? "Déconnexion" : "Sign Out"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-neon-blue border border-neon-blue/50 rounded-md hover:bg-neon-blue/10 transition-colors duration-200"
              >
                {language === "fr" ? "Connexion" : "Login"}
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 text-sm bg-neon-blue text-cosmic-black rounded-md hover:bg-neon-blue/90 transition-colors duration-200"
              >
                {language === "fr" ? "S'inscrire" : "Register"}
              </Link>
            </div>
          )}
        </div>

        {/* Menu button - Mobile */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-lunar-white/80 hover:text-neon-blue p-2"
          >
            {isMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-cosmic-black/95 backdrop-blur-md border-t border-neon-blue/20 py-3">
          <div className="flex flex-col space-y-2 px-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive(
                "/"
              )}`}
            >
              {language === "fr" ? "Accueil" : "Home"}
            </Link>
            <Link
              href="/modules"
              className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive(
                "/modules"
              )}`}
            >
              {language === "fr" ? "Modules" : "Modules"}
            </Link>
            <Link
              href="/universe"
              className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive(
                "/universe"
              )}`}
            >
              {language === "fr" ? "Mon Univers" : "My Universe"}
            </Link>
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive(
                "/dashboard"
              )}`}
            >
              {language === "fr" ? "Tableau de bord" : "Dashboard"}
            </Link>

            <div className="pt-4 border-t border-neon-blue/10">
              {user ? (
                <>
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                      {user.displayName
                        ? user.displayName[0].toUpperCase()
                        : "U"}
                    </div>
                    <span className="text-sm text-lunar-white/90">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={navigateToProfile}
                    className="block w-full text-left px-3 py-2 rounded-md text-base text-lunar-white/80 hover:text-neon-blue transition-colors duration-200"
                  >
                    {language === "fr" ? "Mon Profil" : "My Profile"}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base text-lunar-white/80 hover:text-cosmic-red transition-colors duration-200"
                  >
                    {language === "fr" ? "Déconnexion" : "Sign Out"}
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/login"
                    className="px-3 py-2 text-base text-center text-neon-blue border border-neon-blue/50 rounded-md hover:bg-neon-blue/10 transition-colors duration-200"
                  >
                    {language === "fr" ? "Connexion" : "Login"}
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-2 text-base text-center bg-neon-blue text-cosmic-black rounded-md hover:bg-neon-blue/90 transition-colors duration-200"
                  >
                    {language === "fr" ? "S'inscrire" : "Register"}
                  </Link>
                </div>
              )}

              <button
                onClick={toggleLanguage}
                className="mt-4 w-full flex justify-center items-center px-3 py-2 rounded-md text-sm text-lunar-white/80 hover:text-neon-blue transition-colors duration-200 border border-neon-blue/10"
              >
                {language === "fr" ? "Switch to English" : "Passer en Français"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
