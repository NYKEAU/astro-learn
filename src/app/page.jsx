"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import BackgroundEffects from "@/components/effects/BackgroundEffects";
import CosmicDashboard from "@/components/effects/CosmicDashboard";
import { TbMeteor, TbPlanet, TbGalaxy, TbUniverse } from "react-icons/tb";

export default function HomePage() {
  const { t, language } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);

  // Récupérer les modules depuis Firebase
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setModulesLoading(true);

        // Vérifier si l'utilisateur est authentifié avant d'accéder à Firestore
        if (!isAuthenticated && !loading) {
          console.log(
            "Utilisateur non authentifié, chargement des modules par défaut"
          );
          setModules([
            {
              id: "1",
              title: "Module par défaut",
              description: "Contenu disponible sans authentification",
            },
          ]);
          return;
        }

        // Délai court pour s'assurer que Firebase est bien initialisé
        await new Promise((resolve) => setTimeout(resolve, 500));

        const modulesCollection = collection(db, "modules");
        const modulesSnapshot = await getDocs(modulesCollection);
        const modulesList = modulesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setModules(modulesList);
      } catch (error) {
        console.error("Erreur lors de la récupération des modules:", error);
        // Définir des modules par défaut en cas d'erreur
        setModules([
          {
            id: "error",
            title: "Impossible de charger les modules",
            description: "Veuillez réessayer plus tard",
          },
        ]);
      } finally {
        setModulesLoading(false);
      }
    };

    // Ne charger les modules que si l'état d'authentification est résolu
    if (!loading) {
      fetchModules();
    }
  }, [isAuthenticated, loading]);

  // Vérifier l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cosmic-black">
      <BackgroundEffects />

      {/* Navigation */}
      <nav className="bg-cosmic-black/60 backdrop-blur-sm border-b border-neon-blue/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center h-full py-2">
            <img
              src="/Logo Final RTL.svg"
              alt="AstroLearn"
              className="h-full w-auto max-h-10"
            />
          </Link>

          {/* Navigation Links - Now Centered */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center space-x-8">
              <Link
                href="/#hero"
                className="text-lunar-white/90 hover:text-neon-blue transition-colors font-exo"
              >
                {language === "fr" ? "Accueil" : "Home"}
              </Link>
              <Link
                href="/#discover"
                className="text-lunar-white/90 hover:text-neon-blue transition-colors font-exo"
              >
                {language === "fr" ? "Découvrir" : "Discover"}
              </Link>
              <Link
                href="/#explore"
                className="text-lunar-white/90 hover:text-neon-blue transition-colors font-exo"
              >
                {language === "fr" ? "Explorer" : "Explore"}
              </Link>
              <Link
                href="/#pricing"
                className="text-lunar-white/90 hover:text-neon-blue transition-colors font-exo"
              >
                {language === "fr" ? "Formules" : "Pricing"}
              </Link>
            </div>
          </div>

          {/* Language and Auth Buttons */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {!loading &&
              (isAuthenticated ? (
                <Link href="/dashboard">
                  <Button className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black font-medium">
                    {language === "fr" ? "Tableau de bord" : "Dashboard"}
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black font-medium">
                    {language === "fr"
                      ? "Connexion / Inscription"
                      : "Login / Register"}
                  </Button>
                </Link>
              ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        className="relative px-6 lg:px-8 py-16 md:py-24 overflow-hidden"
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-lunar-white leading-tight">
                {language === "fr" ? (
                  <>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-cosmic-purple">
                      Explorez
                    </span>{" "}
                    l'Univers avec AstroLearn
                  </>
                ) : (
                  <>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-cosmic-purple">
                      Explore
                    </span>{" "}
                    the Universe with AstroLearn
                  </>
                )}
              </h1>
              <p className="text-lg text-lunar-white/70 leading-relaxed font-jetbrains">
                {language === "fr"
                  ? "Voyagez à travers les étoiles et découvrez les mystères du cosmos dans un parcours d'apprentissage interactif et personnalisé. Devenez incollable sur l'espace et les phénomènes astronomiques."
                  : "Journey through the stars and discover the mysteries of the cosmos in an interactive and personalized learning experience. Become an expert on space and astronomical phenomena."}
              </p>
              <p className="text-lg text-lunar-white/70 leading-relaxed font-jetbrains">
                {language === "fr"
                  ? "AstroLearn vous propose une expérience immersive unique, combinant la rigueur scientifique avec des méthodes pédagogiques innovantes pour rendre l'astronomie accessible à tous."
                  : "AstroLearn offers you a unique immersive experience, combining scientific rigor with innovative teaching methods to make astronomy accessible to everyone."}
              </p>
              <div className="pt-4">
                <Link
                  href="/register"
                  className="px-8 py-3 rounded-lg bg-neon-blue hover:bg-neon-blue/90 text-cosmic-black font-medium transition-all duration-300 shadow-lg hover:shadow-neon-blue/50"
                >
                  {language === "fr"
                    ? "Commencer l'exploration"
                    : "Start exploring"}
                </Link>
              </div>
            </div>
            <div className="relative h-80 md:h-96 w-full rounded-xl overflow-hidden border border-neon-blue/20 bg-cosmic-black/30 backdrop-blur-md">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-neon-blue flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-neon-blue"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Découvrez l'univers à portée de main */}
      <section id="discover" className="py-20 relative z-10 overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 font-exo text-lunar-white">
            {language === "fr"
              ? "Découvrez l'univers à portée de main"
              : "Discover the universe at your fingertips"}
          </h2>

          <CosmicDashboard />
        </div>
      </section>

      {/* Explorez l'univers à votre rythme */}
      <section id="explore" className="py-20 relative z-10 bg-cosmic-black/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 font-exo text-lunar-white">
            {language === "fr"
              ? "Explorez l'univers à votre rythme"
              : "Explore the universe at your own pace"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-neon-blue/20 hover:border-neon-blue/40 transition-all flex"
            >
              <div className="w-1/3 bg-gradient-to-br from-neon-blue/20 to-cosmic-purple/20 p-6 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-neon-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="w-2/3 p-6">
                <h3 className="text-xl font-bold mb-3 font-exo text-lunar-white">
                  {language === "fr" ? "La Terre" : "Earth"}
                </h3>
                <p className="text-lunar-white/70 font-jetbrains leading-relaxed">
                  {language === "fr"
                    ? "Découvrez les merveilles de notre planète, son atmosphère, sa structure interne et les phénomènes qui la caractérisent."
                    : "Discover the wonders of our planet, its atmosphere, its internal structure and the phenomena that characterize it."}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-neon-blue/20 hover:border-neon-blue/40 transition-all flex"
            >
              <div className="w-1/3 bg-gradient-to-br from-neon-blue/20 to-cosmic-purple/20 p-6 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-neon-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                  />
                </svg>
              </div>
              <div className="w-2/3 p-6">
                <h3 className="text-xl font-bold mb-3 font-exo text-lunar-white">
                  {language === "fr" ? "Les satellites" : "Satellites"}
                </h3>
                <p className="text-lunar-white/70 font-jetbrains leading-relaxed">
                  {language === "fr"
                    ? "Explorez les différents types de satellites, leur fonctionnement et leur importance dans notre vie quotidienne."
                    : "Explore the different types of satellites, how they work and their importance in our daily lives."}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-neon-blue/20 hover:border-neon-blue/40 transition-all flex"
            >
              <div className="w-1/3 bg-gradient-to-br from-neon-blue/20 to-cosmic-purple/20 p-6 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-neon-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <div className="w-2/3 p-6">
                <h3 className="text-xl font-bold mb-3 font-exo text-lunar-white">
                  {language === "fr" ? "L'ISS" : "The ISS"}
                </h3>
                <p className="text-lunar-white/70 font-jetbrains leading-relaxed">
                  {language === "fr"
                    ? "Découvrez la Station Spatiale Internationale, son histoire, sa construction et la vie quotidienne des astronautes à bord."
                    : "Discover the International Space Station, its history, construction and daily life of astronauts on board."}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-neon-blue/20 hover:border-neon-blue/40 transition-all flex"
            >
              <div className="w-1/3 bg-gradient-to-br from-neon-blue/20 to-cosmic-purple/20 p-6 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-neon-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="w-2/3 p-6">
                <h3 className="text-xl font-bold mb-3 font-exo text-lunar-white">
                  {language === "fr" ? "Sphère de Dyson" : "Dyson Sphere"}
                </h3>
                <p className="text-lunar-white/70 font-jetbrains leading-relaxed">
                  {language === "fr"
                    ? "Explorez ce concept fascinant d'une mégastructure hypothétique capable de capturer l'énergie d'une étoile."
                    : "Explore this fascinating concept of a hypothetical megastructure capable of capturing the energy of a star."}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Effet de dégradé pour indiquer qu'il y a plus de modules */}
          <div className="mt-12 text-center relative">
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cosmic-black/50 to-transparent"></div>
            <Link href="/modules">
              <p className="text-neon-blue text-lg font-exo inline-block border border-neon-blue/30 rounded-full px-6 py-2 hover:bg-neon-blue/10 transition-all cursor-pointer relative z-10">
                {language === "fr"
                  ? "Découvrir plus de modules"
                  : "Discover more modules"}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Choisissez votre niveau d'exploration */}
      <section id="pricing" className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 font-exo text-lunar-white">
            {language === "fr"
              ? "Choisissez votre niveau d'exploration"
              : "Choose your exploration level"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-cosmic-black/40 backdrop-blur-sm p-8 rounded-xl border border-neon-blue/20 flex flex-col h-full"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-neon-blue/10 rounded-lg flex items-center justify-center">
                  <TbMeteor className="h-10 w-10 text-neon-blue" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 font-exo text-center text-lunar-white">
                {language === "fr"
                  ? "Accès sans compte"
                  : "Access without account"}
              </h3>
              <p className="text-lg font-bold mb-6 text-center text-neon-blue">
                {language === "fr" ? "Gratuit" : "Free"}
              </p>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">1.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Premier module complet"
                      : "First complete module"}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">2.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Aperçu des autres modules"
                      : "Preview of other modules"}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">3.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Démo interactive"
                      : "Interactive demo"}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">4.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Pas de sauvegarde"
                      : "No save feature"}
                  </span>
                </li>
              </ul>
              <Link href="/modules" className="mt-auto">
                <Button
                  variant="outline"
                  className="w-full border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10"
                >
                  {language === "fr" ? "Essayer" : "Try"}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-cosmic-black/40 backdrop-blur-sm p-8 rounded-xl border-2 border-neon-blue flex flex-col h-full relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-neon-blue px-4 py-1 rounded-full text-sm font-medium text-cosmic-black">
                {language === "fr" ? "Recommandé" : "Recommended"}
              </div>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-neon-blue/20 rounded-lg flex items-center justify-center">
                  <TbPlanet className="h-10 w-10 text-neon-blue" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 font-exo text-center text-lunar-white">
                {language === "fr"
                  ? "Accès avec compte"
                  : "Access with account"}
              </h3>
              <p className="text-lg font-bold mb-6 text-center text-neon-blue">
                {language === "fr" ? "Gratuit" : "Free"}
              </p>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">1.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Tous les modules gratuits"
                      : "All free modules"}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">2.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Sauvegarde de progression"
                      : "Progress saving"}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">3.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Tests et recommandations"
                      : "Tests and recommendations"}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">4.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Tableau de bord basique"
                      : "Basic dashboard"}
                  </span>
                </li>
              </ul>
              <Link href="/register" className="mt-auto">
                <Button className="w-full bg-neon-blue hover:bg-neon-blue/90 text-cosmic-black">
                  {language === "fr" ? "Créer un compte" : "Create an account"}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-cosmic-black/40 backdrop-blur-sm p-8 rounded-xl border border-neon-blue/20 flex flex-col h-full"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-neon-blue/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer">
                    <div className="absolute h-[500%] w-10 top-0 -inset-5 bg-white/40 blur-xl transform -skew-x-12 -rotate-12"></div>
                  </div>
                  <TbUniverse className="h-10 w-10 text-neon-blue relative z-10" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 font-exo text-center text-lunar-white">
                {language === "fr" ? "Accès premium" : "Premium access"}
              </h3>
              <p className="text-lg font-bold mb-6 text-center text-cosmic-purple whitespace-nowrap">
                {language === "fr" ? (
                  <>
                    À partir de{" "}
                    <span className="text-neon-blue">4.15€/mois</span>
                  </>
                ) : (
                  <>
                    From <span className="text-neon-blue">4.15€/month</span>
                  </>
                )}
              </p>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">1.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Accès illimité à tout le contenu"
                      : "Unlimited access to everything"}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">2.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Système de progression avancé"
                      : "Advanced progression system"}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">3.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Certifications officielles"
                      : "Official certifications"}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-neon-blue mr-2">4.</span>
                  <span className="text-lunar-white/70 font-jetbrains">
                    {language === "fr"
                      ? "Contenu téléchargeable"
                      : "Downloadable content"}
                  </span>
                </li>
              </ul>
              <Link href="/register?plan=premium" className="mt-auto">
                <Button
                  variant="outline"
                  className="w-full border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10"
                >
                  {language === "fr" ? "Essai gratuit 7j" : "7-day free trial"}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-cosmic-black/50 backdrop-blur-sm border-t border-neon-blue/20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-lunar-white font-exo">
                AstroLearn
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/#hero"
                    className="text-lunar-white/70 hover:text-neon-blue transition-colors font-jetbrains"
                  >
                    {language === "fr" ? "Accueil" : "Home"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#discover"
                    className="text-lunar-white/70 hover:text-neon-blue transition-colors font-jetbrains"
                  >
                    {language === "fr" ? "Découvrir" : "Discover"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#explore"
                    className="text-lunar-white/70 hover:text-neon-blue transition-colors font-jetbrains"
                  >
                    {language === "fr" ? "Explorer" : "Explore"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
                    className="text-lunar-white/70 hover:text-neon-blue transition-colors font-jetbrains"
                  >
                    {language === "fr" ? "Formules" : "Pricing"}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-lunar-white font-exo">
                {language === "fr"
                  ? "Informations légales"
                  : "Legal information"}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/legal/mentions"
                    className="text-lunar-white/70 hover:text-neon-blue transition-colors font-jetbrains"
                  >
                    {language === "fr" ? "Mentions légales" : "Legal notices"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/privacy"
                    className="text-lunar-white/70 hover:text-neon-blue transition-colors font-jetbrains"
                  >
                    {language === "fr"
                      ? "Politique de confidentialité"
                      : "Privacy policy"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/terms"
                    className="text-lunar-white/70 hover:text-neon-blue transition-colors font-jetbrains"
                  >
                    {language === "fr"
                      ? "Conditions d'utilisation"
                      : "Terms of use"}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-lunar-white font-exo">
                {language === "fr" ? "Coordonnées" : "Contact information"}
              </h3>
              <p className="text-lunar-white/70 mb-4 font-jetbrains">
                lhommeau.n@gmail.com
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lunar-white/70 hover:text-neon-blue transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-facebook"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lunar-white/70 hover:text-neon-blue transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-twitter"
                  >
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lunar-white/70 hover:text-neon-blue transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-instagram"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lunar-white/70 hover:text-neon-blue transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-github"
                  >
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-neon-blue/10 mt-8 pt-8 text-center text-lunar-white/50 font-jetbrains">
            <p>
              &copy; 2025 AstroLearn.{" "}
              {language === "fr"
                ? "Tous droits réservés."
                : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-150%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}
