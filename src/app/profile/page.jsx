"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { profileService } from "@/lib/services/profileService";
import { usePageTransition } from "@/lib/hooks/usePageTransition";
import PageTransition from "@/components/layout/PageTransition";
import {
  ArrowLeft,
  Settings,
  Edit,
  RotateCcw,
  User,
  Clock,
  TrendingUp,
  BookOpen,
  Target,
  Award,
  Calendar,
  Mail,
  GraduationCap,
} from "lucide-react";

// Données d'exemple pour les badges et statistiques
const mockUserData = {
  badges: [
    { id: "badge1", name: "Premier pas", icon: "🚀", earned: true },
    { id: "badge2", name: "Explorateur", icon: "🌟", earned: true },
    { id: "badge3", name: "Astronome", icon: "🔭", earned: true },
    { id: "badge4", name: "Expert", icon: "🎓", earned: false },
    { id: "badge5", name: "Maître", icon: "👑", earned: false },
  ],
  stats: {
    level: 15,
    timeSpent: "3h27",
    averageScore: 76,
    completedModules: 4,
    completedExercises: 12,
  },
  progressData: [
    { month: "01/25", lessons: 5 },
    { month: "02/25", lessons: 4 },
    { month: "03/25", lessons: 6 },
    { month: "04/25", lessons: 8 },
    { month: "05/25", lessons: 12 },
    { month: "06/25", lessons: 8 },
  ],
};

export default function ProfilePage() {
  const { language } = useLanguage();
  const router = useRouter();
  const { navigateToDashboard, navigateToSettings, getTransitionDirection } =
    usePageTransition();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState("fromLeft");

  // Détecter la direction de transition
  useEffect(() => {
    const direction = getTransitionDirection();
    if (direction === "toProfile") {
      setTransitionDirection("fromLeft");
    } else if (direction === "toDashboard") {
      setTransitionDirection("toRight");
    }
  }, [getTransitionDirection]);

  // Vérifier l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Récupérer le profil utilisateur depuis Firebase
        const profileResult = await profileService.getUserProfile(authUser.uid);
        if (profileResult.success) {
          setUserProfile(profileResult.data);
        }
        setLoading(false);
      } else {
        router.push("/register");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
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
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <PageTransition direction={transitionDirection}>
        <div className="min-h-screen flex items-center justify-center bg-cosmic-black">
          <div className="animate-pulse flex space-x-4">
            <div className="h-12 w-12 bg-neon-blue/20 rounded-full"></div>
            <div className="space-y-4">
              <div className="h-4 w-24 bg-neon-blue/20 rounded"></div>
              <div className="h-4 w-36 bg-neon-blue/20 rounded"></div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition direction={transitionDirection}>
      <div className="min-h-screen bg-cosmic-black text-lunar-white">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-neon-blue/20 bg-cosmic-black/90 backdrop-blur-md sticky top-0 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToDashboard}
            className="rounded-full bg-neon-blue/10 hover:bg-neon-blue/20"
          >
            <ArrowLeft className="h-5 w-5 text-neon-blue" />
          </Button>

          <h1 className="text-xl font-bold text-center text-lunar-white font-exo">
            {language === "fr" ? "Mon profil" : "My Profile"}
          </h1>

          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToSettings}
            className="rounded-full bg-neon-blue/10 hover:bg-neon-blue/20"
          >
            <Settings className="h-5 w-5 text-neon-blue" />
          </Button>
        </header>

        {/* Contenu principal */}
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Colonne gauche - Profil utilisateur */}
            <motion.div
              className="lg:col-span-1 space-y-6"
              variants={itemVariants}
            >
              {/* Carte profil */}
              <div className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20 relative">
                {/* Bouton d'édition */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 rounded-full bg-neon-blue/10 hover:bg-neon-blue/20"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 text-neon-blue" />
                </Button>

                {/* Photo de profil */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue border-2 border-neon-blue/40">
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cosmic-black border border-neon-blue/40 hover:bg-neon-blue/10"
                    >
                      <RotateCcw className="h-4 w-4 text-neon-blue" />
                    </Button>
                  </div>

                  {/* Informations utilisateur */}
                  <div className="w-full space-y-4">
                    <div>
                      <label className="text-sm text-lunar-white/70 mb-1 block">
                        {language === "fr" ? "Nom d'utilisateur" : "Username"}
                      </label>
                      <div className="bg-cosmic-black/50 rounded-lg p-3 text-lunar-white">
                        {userProfile?.fullName ||
                          user?.displayName ||
                          "Nom d'utilisateur"}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-lunar-white/70 mb-1 block">
                        {language === "fr" ? "Adresse e-mail" : "Email address"}
                      </label>
                      <div className="bg-cosmic-black/50 rounded-lg p-3 text-lunar-white flex items-center">
                        <Mail className="h-4 w-4 text-neon-blue mr-2" />
                        {user?.email || "Adresse e-mail"}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-lunar-white/70 mb-1 block">
                        {language === "fr"
                          ? "Niveau d'études"
                          : "Education level"}
                      </label>
                      <div className="bg-cosmic-black/50 rounded-lg p-3 text-lunar-white flex items-center">
                        <GraduationCap className="h-4 w-4 text-neon-blue mr-2" />
                        {userProfile?.educationLevel || "Lycée"}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-lunar-white/70 mb-1 block">
                        {language === "fr" ? "Membre depuis" : "Member since"}
                      </label>
                      <div className="bg-cosmic-black/50 rounded-lg p-3 text-lunar-white flex items-center">
                        <Calendar className="h-4 w-4 text-neon-blue mr-2" />
                        01/01/25
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Colonne droite - Badges, Statistiques et Progression */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              variants={itemVariants}
            >
              {/* Section Badges */}
              <div className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20">
                <h2 className="text-xl font-bold text-lunar-white font-exo mb-4 flex items-center">
                  <Award className="h-5 w-5 text-neon-blue mr-2" />
                  {language === "fr" ? "Badges" : "Badges"}
                </h2>
                <div className="grid grid-cols-5 gap-4">
                  {mockUserData.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                        badge.earned
                          ? "border-neon-blue/40 bg-neon-blue/10"
                          : "border-lunar-white/20 bg-cosmic-black/30 opacity-50"
                      }`}
                    >
                      <div className="text-2xl mb-2">{badge.icon}</div>
                      <span className="text-xs text-center text-lunar-white/80">
                        {language === "fr" ? "Badge" : "Badge"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Statistiques */}
              <div className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20">
                <h2 className="text-xl font-bold text-lunar-white font-exo mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-neon-blue mr-2" />
                  {language === "fr" ? "Statistiques" : "Statistics"}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-blue mb-1">
                      {mockUserData.stats.level}
                    </div>
                    <div className="text-sm text-lunar-white/70">
                      {language === "fr" ? "Niveau atteint" : "Level reached"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-blue mb-1">
                      {mockUserData.stats.timeSpent}
                    </div>
                    <div className="text-sm text-lunar-white/70">
                      {language === "fr" ? "Temps passé" : "Time spent"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-blue mb-1">
                      {mockUserData.stats.averageScore}%
                    </div>
                    <div className="text-sm text-lunar-white/70">
                      {language === "fr" ? "Score moyen" : "Average score"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-blue mb-1">
                      {mockUserData.stats.completedModules}
                    </div>
                    <div className="text-sm text-lunar-white/70">
                      {language === "fr"
                        ? "Nombre de modules terminés"
                        : "Completed modules"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-blue mb-1">
                      {mockUserData.stats.completedExercises}
                    </div>
                    <div className="text-sm text-lunar-white/70">
                      {language === "fr"
                        ? "Nombre d'exercices terminés"
                        : "Completed exercises"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Progression */}
              <div className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20">
                <h2 className="text-xl font-bold text-lunar-white font-exo mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 text-neon-blue mr-2" />
                  {language === "fr" ? "Progression" : "Progress"}
                </h2>

                {/* Graphique simple */}
                <div className="relative h-64 bg-cosmic-black/30 rounded-lg p-4">
                  <div className="absolute top-4 right-4 text-sm text-lunar-white/70">
                    {language === "fr"
                      ? "Leçons terminées"
                      : "Completed lessons"}
                  </div>

                  {/* Axes du graphique */}
                  <div className="relative h-full">
                    {/* Axe Y */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-lunar-white/50">
                      <span>12</span>
                      <span>10</span>
                      <span>8</span>
                      <span>6</span>
                      <span>4</span>
                      <span>2</span>
                      <span>0</span>
                    </div>

                    {/* Zone du graphique */}
                    <div className="ml-8 h-full relative">
                      {/* Grille */}
                      <div className="absolute inset-0 grid grid-rows-6 grid-cols-6 opacity-20">
                        {Array.from({ length: 42 }).map((_, i) => (
                          <div
                            key={i}
                            className="border-r border-b border-lunar-white/10"
                          ></div>
                        ))}
                      </div>

                      {/* Ligne de progression */}
                      <svg className="absolute inset-0 w-full h-full">
                        <polyline
                          fill="none"
                          stroke="#00D4FF"
                          strokeWidth="2"
                          points="0,180 60,200 120,160 180,120 240,60 300,120"
                          className="drop-shadow-lg"
                        />
                        {/* Points sur la ligne */}
                        {mockUserData.progressData.map((point, index) => (
                          <circle
                            key={index}
                            cx={index * 60}
                            cy={220 - point.lessons * 15}
                            r="4"
                            fill="#00D4FF"
                            className="drop-shadow-lg"
                          />
                        ))}
                      </svg>
                    </div>

                    {/* Axe X */}
                    <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-lunar-white/50 mt-2">
                      {mockUserData.progressData.map((point) => (
                        <span
                          key={point.month}
                          className="transform -rotate-45 origin-top-left"
                        >
                          {point.month}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Label de l'axe X */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-xs text-lunar-white/50">
                    {language === "fr" ? "Mois" : "Months"}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
}
