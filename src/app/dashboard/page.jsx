"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChange, signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  User,
  Settings,
  TrendingUp,
  CheckCircle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  BarChart,
  Clock,
} from "lucide-react";

// Exemple de données utilisateur (à remplacer par des données réelles de Firebase)
const userProgress = {
  level: {
    current: 8,
    progress: 75,
  },
  weeklyLessons: {
    completed: 4,
    total: 5,
  },
  weeklyExercises: {
    completed: 5,
    total: 5,
  },
  modules: [
    {
      id: "earth",
      title: "La Terre",
      titleEn: "Earth",
      lessons: {
        completed: 3,
        total: 5,
      },
      exercises: {
        completed: 4,
        total: 5,
      },
    },
    {
      id: "satellites",
      title: "Les satellites",
      titleEn: "Satellites",
      lessons: {
        completed: 5,
        total: 6,
      },
      exercises: {
        completed: 4,
        total: 6,
      },
    },
  ],
  badges: [
    { id: "badge1", name: "Badge 1" },
    { id: "badge2", name: "Badge 2" },
    { id: "badge3", name: "Badge 3" },
    { id: "badge4", name: "Badge 4" },
    { id: "badge5", name: "Badge 5" },
  ],
};

export default function DashboardPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  // Vérifier l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        setLoading(false);
      } else {
        router.push("/register");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleCloseDashboard = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.back();
    }, 500); // Délai correspondant à la durée de l'animation
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: "-100%" },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: "-100%",
      transition: {
        duration: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-black">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-neon-blue/20 rounded-full"></div>
          <div className="space-y-4">
            <div className="h-4 w-24 bg-neon-blue/20 rounded"></div>
            <div className="h-4 w-36 bg-neon-blue/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="min-h-screen bg-cosmic-black flex flex-col"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Barre de navigation supérieure */}
          <header className="flex justify-between items-center p-4 border-b border-neon-blue/20 bg-cosmic-black/90 backdrop-blur-md sticky top-0 z-50">
            {/* Niveau utilisateur */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue font-exo font-bold text-lg relative">
                {userProgress.level.current}
                <div className="absolute inset-0 rounded-full border-2 border-neon-blue/40"></div>
                <svg
                  className="absolute -inset-0.5"
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${userProgress.level.progress * 3}, 1000`}
                    strokeLinecap="round"
                    className="text-neon-blue transform -rotate-90"
                  />
                </svg>
              </div>
              <div className="hidden md:block w-48 h-1 rounded-full bg-cosmic-black/40">
                <div
                  className="h-full rounded-full bg-neon-blue"
                  style={{ width: `${userProgress.level.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Titre centré */}
            <h1 className="text-xl font-bold text-center text-lunar-white font-exo">
              Dashboard
            </h1>

            {/* Menu droite */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />

              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-neon-blue/10 hover:bg-neon-blue/20"
                >
                  <User className="h-5 w-5 text-neon-blue" />
                </Button>
              </Link>

              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-neon-blue/10 hover:bg-neon-blue/20"
                >
                  <Settings className="h-5 w-5 text-neon-blue" />
                </Button>
              </Link>
            </div>
          </header>

          {/* Contenu principal du dashboard - maintenant avec une hauteur fixe */}
          <main className="flex-1 container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              <div className="flex flex-col space-y-6">
                {/* Section Objectifs hebdomadaires */}
                <motion.section
                  className="flex-shrink-0"
                  variants={itemVariants}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="text-neon-blue" size={24} />
                    <h2 className="text-xl font-bold text-lunar-white font-exo">
                      {language === "fr"
                        ? "Objectifs hebdomadaires"
                        : "Weekly Objectives"}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Leçons terminées */}
                    <div className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20 relative overflow-hidden group">
                      {/* Icône en arrière-plan */}
                      <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 opacity-10 group-hover:opacity-15 transition-opacity">
                        {userProgress.weeklyLessons.completed ===
                          userProgress.weeklyLessons.total ? (
                          <CheckCircle className="text-neon-blue" size={200} />
                        ) : (
                          <Clock className="text-neon-blue/70" size={200} />
                        )}
                      </div>

                      <div className="relative z-10">
                        <div className="flex flex-col items-start">
                          <div className="flex items-baseline mb-3">
                            <span className="text-7xl font-bold text-lunar-white leading-none">
                              {userProgress.weeklyLessons.completed}
                            </span>
                            <span className="text-2xl text-lunar-white/70 ml-2">
                              / {userProgress.weeklyLessons.total}
                            </span>
                          </div>
                          <div className="text-lunar-white/70 text-sm">
                            <p className="font-medium tracking-wide">
                              {language === "fr"
                                ? "leçons terminées"
                                : "completed lessons"}
                            </p>
                            <p className="text-lunar-white/50 text-xs mt-1">
                              {language === "fr"
                                ? "cette semaine"
                                : "this week"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exercices terminés */}
                    <div className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20 relative overflow-hidden group">
                      {/* Icône en arrière-plan */}
                      <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 opacity-10 group-hover:opacity-15 transition-opacity">
                        {userProgress.weeklyExercises.completed ===
                          userProgress.weeklyExercises.total ? (
                          <CheckCircle className="text-neon-blue" size={200} />
                        ) : (
                          <Clock className="text-neon-blue/70" size={200} />
                        )}
                      </div>

                      <div className="relative z-10">
                        <div className="flex flex-col items-start">
                          <div className="flex items-baseline mb-3">
                            <span className="text-7xl font-bold text-lunar-white leading-none">
                              {userProgress.weeklyExercises.completed}
                            </span>
                            <span className="text-2xl text-lunar-white/70 ml-2">
                              / {userProgress.weeklyExercises.total}
                            </span>
                          </div>
                          <div className="text-lunar-white/70 text-sm">
                            <p className="font-medium tracking-wide">
                              {language === "fr"
                                ? "exercices terminés"
                                : "completed exercises"}
                            </p>
                            <p className="text-lunar-white/50 text-xs mt-1">
                              {language === "fr"
                                ? "cette semaine"
                                : "this week"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Mon univers personnel transformé en bouton */}
                <motion.section
                  className="flex-shrink-0 flex-grow"
                  variants={itemVariants}
                >
                  <Link href="/universe" className="block h-full">
                    <div className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20 h-full relative hover:bg-cosmic-black/60 hover:border-neon-blue/40 transition-all group overflow-hidden">
                      {/* Image de fond */}
                      <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/30 to-cosmic-purple/30"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <svg
                            viewBox="0 0 200 200"
                            className="w-full h-full text-lunar-white/30"
                          >
                            <defs>
                              <radialGradient
                                id="galaxy"
                                cx="50%"
                                cy="50%"
                                r="50%"
                                fx="50%"
                                fy="50%"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="currentColor"
                                  stopOpacity="0.8"
                                />
                                <stop
                                  offset="70%"
                                  stopColor="currentColor"
                                  stopOpacity="0.3"
                                />
                                <stop
                                  offset="100%"
                                  stopColor="currentColor"
                                  stopOpacity="0"
                                />
                              </radialGradient>
                            </defs>
                            <circle
                              cx="100"
                              cy="100"
                              r="80"
                              fill="url(#galaxy)"
                            />
                            <circle
                              cx="100"
                              cy="100"
                              r="40"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1"
                            />
                            <circle
                              cx="100"
                              cy="100"
                              r="60"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="0.5"
                            />
                            <circle cx="70" cy="80" r="5" fill="currentColor" />
                            <circle
                              cx="130"
                              cy="110"
                              r="3"
                              fill="currentColor"
                            />
                            <circle
                              cx="120"
                              cy="60"
                              r="4"
                              fill="currentColor"
                            />
                            <circle
                              cx="90"
                              cy="130"
                              r="3.5"
                              fill="currentColor"
                            />
                            <circle
                              cx="150"
                              cy="90"
                              r="2.5"
                              fill="currentColor"
                            />
                            <circle
                              cx="60"
                              cy="110"
                              r="4"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Flèche en haut à droite */}
                      <div className="absolute top-4 right-4 z-10">
                        <ArrowUpRight className="text-neon-blue w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>

                      <div className="flex flex-col items-center justify-center h-full relative z-10">
                        <h3 className="text-2xl font-bold text-lunar-white font-exo mb-4 text-center">
                          {language === "fr"
                            ? "Mon univers personnel"
                            : "My personal universe"}
                        </h3>
                        <p className="text-lunar-white/70 font-jetbrains text-center mb-4 max-w-sm mx-auto">
                          {language === "fr"
                            ? "Collectionnez vos découvertes célestes et créez votre propre univers !"
                            : "Collect your celestial discoveries and create your own universe!"}
                        </p>
                        <div className="mt-2 group-hover:opacity-80 opacity-0 transition-opacity">
                          <span className="text-neon-blue text-sm font-bold px-3 py-1 rounded-full border border-neon-blue/30">
                            {language === "fr" ? "Explorer" : "Explore"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.section>
              </div>

              {/* Section Modules en cours */}
              <motion.section className="flex flex-col" variants={itemVariants}>
                <h2 className="text-xl font-bold text-lunar-white font-exo mb-4">
                  {language === "fr"
                    ? "Modules en cours"
                    : "Modules in progress"}
                </h2>

                <div className="flex flex-col space-y-6 flex-grow mb-6">
                  {userProgress.modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-neon-blue/20"
                    >
                      <div className="p-4 border-b border-neon-blue/10">
                        <h3 className="text-xl font-bold text-lunar-white font-exo">
                          {language === "fr" ? module.title : module.titleEn}
                        </h3>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Leçons */}
                        <div className="flex justify-between items-center">
                          <span className="text-lunar-white/70 font-jetbrains">
                            {language === "fr" ? "Leçons" : "Lessons"}
                          </span>
                          <span className="text-lunar-white font-medium">
                            {module.lessons.completed}/{module.lessons.total}
                          </span>
                        </div>
                        <div className="w-full bg-cosmic-black/50 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-neon-blue"
                            style={{
                              width: `${(module.lessons.completed /
                                  module.lessons.total) *
                                100
                                }%`,
                            }}
                          ></div>
                        </div>

                        {/* Exercices */}
                        <div className="flex justify-between items-center">
                          <span className="text-lunar-white/70 font-jetbrains">
                            {language === "fr" ? "Exercices" : "Exercises"}
                          </span>
                          <span className="text-lunar-white font-medium">
                            {module.exercises.completed}/
                            {module.exercises.total}
                          </span>
                        </div>
                        <div className="w-full bg-cosmic-black/50 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-neon-blue"
                            style={{
                              width: `${(module.exercises.completed /
                                  module.exercises.total) *
                                100
                                }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-4 bg-cosmic-black/30 flex justify-center">
                        <Link href={`/modules/${module.id}`}>
                          <Button
                            variant="outline"
                            className="border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10"
                          >
                            {language === "fr" ? "Reprendre" : "Resume"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section Mes badges intégrée */}
                <div className="mt-auto">
                  <h2 className="text-xl font-bold text-lunar-white font-exo mb-4 text-center">
                    {language === "fr"
                      ? "Mes derniers badges"
                      : "My last badges"}
                  </h2>

                  <div className="grid grid-cols-5 gap-2 md:gap-4 justify-items-center">
                    {userProgress.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center"
                      >
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-neon-blue/30 flex items-center justify-center bg-cosmic-black/40">
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-neon-blue/10">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              className="text-lunar-white"
                            >
                              <path
                                fill="currentColor"
                                d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z"
                              />
                              <path
                                fill="currentColor"
                                d="M13.89,8.7,12,7.19,10.11,8.7,8.68,7.4l-2,1.51V16.5l3-1,2.32,2.32L16.32,14,18,15.5V8.91l-2-1.51ZM16,14l-1-1-3,3-2-2-2,1V10l1-.31,1.42,1.61L12,10.09l1.58,1.21L15,10l1,.31Z"
                              />
                            </svg>
                          </div>
                        </div>
                        <span className="text-lunar-white/70 text-[10px] md:text-xs mt-1 text-center">
                          Badge
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            </div>
          </main>

          {/* Flèche vers le haut pour fermer le dashboard */}
          <footer className="flex justify-center py-4 bg-cosmic-black/80 backdrop-blur-md border-t border-neon-blue/20">
            <button
              onClick={handleCloseDashboard}
              className="flex flex-col items-center text-neon-blue hover:text-neon-blue/80 transition-colors"
            >
              <ChevronUp className="w-8 h-8" />
            </button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
