"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-radix";
import { onAuthStateChange, signOut } from "@/lib/firebase/auth";
import { usePageTransition } from "@/lib/hooks/usePageTransition";
import PageTransition from "@/components/layout/PageTransition";
import {
  ArrowLeft,
  User,
  Bell,
  BookOpen,
  RefreshCw,
  Monitor,
  Globe,
  Palette,
  Eye,
  ArrowUpRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const { language, toggleLanguage } = useLanguage();
  const router = useRouter();
  const { navigateToDashboard, navigateToProfile, getTransitionDirection } =
    usePageTransition();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transitionDirection, setTransitionDirection] = useState("fromRight");

  // États pour les paramètres
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      newLessons: true,
      learningReminders: true,
      reminderDays: 3,
      platformUpdates: true,
    },
    display: {
      language: "fr",
      theme: "dark",
    },
    leaderboard: {
      visible: true,
    },
  });

  // Détecter la direction de transition
  useEffect(() => {
    const direction = getTransitionDirection();
    if (direction === "toSettings") {
      setTransitionDirection("fromRight");
    } else if (direction === "toDashboard") {
      setTransitionDirection("toLeft");
    }
  }, [getTransitionDirection]);

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

  // Gestion des changements de paramètres
  const handleSettingChange = (category, setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
  };

  // Gestion de la suppression de compte
  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        language === "fr"
          ? "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
          : "Are you sure you want to delete your account? This action is irreversible."
      )
    ) {
      try {
        // Ici, vous ajouteriez la logique de suppression de compte
        console.log("Suppression du compte...");
        await signOut();
        router.push("/");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

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
            {language === "fr" ? "Paramètres" : "Settings"}
          </h1>

          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToProfile}
            className="rounded-full bg-neon-blue/10 hover:bg-neon-blue/20"
          >
            <User className="h-5 w-5 text-neon-blue" />
          </Button>
        </header>

        {/* Contenu principal */}
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Section Notifications */}
            <motion.div
              className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-lunar-white font-exo flex items-center">
                  <Bell className="h-5 w-5 text-neon-blue mr-2" />
                  {language === "fr"
                    ? "Activer les notifications"
                    : "Enable notifications"}
                </h2>
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange("notifications", "enabled", checked)
                  }
                  className="data-[state=checked]:bg-neon-blue"
                />
              </div>

              {settings.notifications.enabled && (
                <div className="space-y-4 pl-7">
                  {/* Nouvelles leçons disponibles */}
                  <div className="flex items-center justify-between py-3 border-b border-neon-blue/10">
                    <span className="text-lunar-white/90">
                      {language === "fr"
                        ? "Nouvelles leçons disponibles"
                        : "New lessons available"}
                    </span>
                    <Switch
                      checked={settings.notifications.newLessons}
                      onCheckedChange={(checked) =>
                        handleSettingChange(
                          "notifications",
                          "newLessons",
                          checked
                        )
                      }
                      className="data-[state=checked]:bg-neon-blue"
                    />
                  </div>

                  {/* Rappels d'apprentissage */}
                  <div className="py-3 border-b border-neon-blue/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lunar-white/90">
                        {language === "fr"
                          ? "Rappels d'apprentissage"
                          : "Learning reminders"}
                      </span>
                      <Switch
                        checked={settings.notifications.learningReminders}
                        onCheckedChange={(checked) =>
                          handleSettingChange(
                            "notifications",
                            "learningReminders",
                            checked
                          )
                        }
                        className="data-[state=checked]:bg-neon-blue"
                      />
                    </div>
                    {settings.notifications.learningReminders && (
                      <div className="flex items-center text-sm text-lunar-white/70">
                        <span className="mr-2">
                          {language === "fr" ? "Après" : "After"}
                        </span>
                        <Select
                          value={settings.notifications.reminderDays.toString()}
                          onValueChange={(value) =>
                            handleSettingChange(
                              "notifications",
                              "reminderDays",
                              parseInt(value)
                            )
                          }
                        >
                          <SelectTrigger className="w-20 h-8 bg-cosmic-black/50 border-neon-blue/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-cosmic-black border-neon-blue/30">
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="7">7</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="ml-2">
                          {language === "fr"
                            ? "jours sans apprentissage"
                            : "days without learning"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mises à jour de la plateforme */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-lunar-white/90">
                      {language === "fr"
                        ? "Mises à jour de la plateforme"
                        : "Platform updates"}
                    </span>
                    <Switch
                      checked={settings.notifications.platformUpdates}
                      onCheckedChange={(checked) =>
                        handleSettingChange(
                          "notifications",
                          "platformUpdates",
                          checked
                        )
                      }
                      className="data-[state=checked]:bg-neon-blue"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Section Affichage */}
            <motion.div
              className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20"
              variants={itemVariants}
            >
              <h2 className="text-lg font-bold text-lunar-white font-exo mb-6 flex items-center">
                <Monitor className="h-5 w-5 text-neon-blue mr-2" />
                {language === "fr" ? "Affichage" : "Display"}
              </h2>

              <div className="space-y-6">
                {/* Langue */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-neon-blue mr-2" />
                    <span className="text-lunar-white/90">
                      {language === "fr" ? "Langue" : "Language"}
                    </span>
                  </div>
                  <Select
                    value={language}
                    onValueChange={(value) => {
                      if (value !== language) {
                        toggleLanguage();
                      }
                    }}
                  >
                    <SelectTrigger className="w-32 bg-cosmic-black/50 border-neon-blue/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cosmic-black border-neon-blue/30">
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Thème favori */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Palette className="h-4 w-4 text-neon-blue mr-2" />
                    <span className="text-lunar-white/90">
                      {language === "fr" ? "Thème favori" : "Preferred theme"}
                    </span>
                  </div>
                  <Select
                    value={settings.display.theme}
                    onValueChange={(value) =>
                      handleSettingChange("display", "theme", value)
                    }
                  >
                    <SelectTrigger className="w-32 bg-cosmic-black/50 border-neon-blue/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cosmic-black border-neon-blue/30">
                      <SelectItem value="dark">
                        {language === "fr" ? "Sombre" : "Dark"}
                      </SelectItem>
                      <SelectItem value="light">
                        {language === "fr" ? "Clair" : "Light"}
                      </SelectItem>
                      <SelectItem value="auto">
                        {language === "fr" ? "Auto" : "Auto"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Options d'accessibilité */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-neon-blue mr-2" />
                    <span className="text-lunar-white/90">
                      {language === "fr"
                        ? "Options d'accessibilité"
                        : "Accessibility options"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neon-blue hover:bg-neon-blue/10"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Section Apparaître dans les classements */}
            <motion.div
              className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-neon-blue/20"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-lunar-white font-exo flex items-center">
                  <BookOpen className="h-5 w-5 text-neon-blue mr-2" />
                  {language === "fr"
                    ? "Apparaître dans les classements"
                    : "Appear in leaderboards"}
                </h2>
                <Switch
                  checked={settings.leaderboard.visible}
                  onCheckedChange={(checked) =>
                    handleSettingChange("leaderboard", "visible", checked)
                  }
                  className="data-[state=checked]:bg-neon-blue"
                />
              </div>
            </motion.div>

            {/* Section Supprimer mon compte */}
            <motion.div
              className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl p-6 border border-red-500/20"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  <div>
                    <h2 className="text-lg font-bold text-lunar-white font-exo">
                      {language === "fr"
                        ? "Supprimer mon compte"
                        : "Delete my account"}
                    </h2>
                    <p className="text-sm text-lunar-white/60 mt-1">
                      {language === "fr"
                        ? "Cette action est irréversible et supprimera toutes vos données."
                        : "This action is irreversible and will delete all your data."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteAccount}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
}
