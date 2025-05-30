"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { Home, ArrowLeft, ImageIcon, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function ModulesPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    async function fetchModules() {
      try {
        const modulesCollection = collection(db, "modules");
        const modulesSnapshot = await getDocs(modulesCollection);

        const modulesData = modulesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Tri des modules par ordre (si disponible) ou par titre
        modulesData.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return a.title.localeCompare(b.title);
        });

        setModules(modulesData);
      } catch (error) {
        console.error("Erreur lors du chargement des modules:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchModules();
  }, []);

  const getModuleTitle = (module) => {
    return language === "fr" ? module.title : module.titleEn || module.title;
  };

  // Pour la maquette, définissons des modules fictifs en attendant le chargement des vrais
  const placeholderModules = [
    {
      id: "earth",
      title: "La Terre",
      titleEn: "Earth",
      lessons: 5,
      exercises: 5,
      imageUrl: null,
    },
    {
      id: "dyson-sphere",
      title: "La sphère de Dyson",
      titleEn: "The Dyson Sphere",
      lessons: 7,
      exercises: 7,
      imageUrl: null,
    },
    {
      id: "iss",
      title: "La Station Spatiale Internationale",
      titleEn: "The International Space Station (ISS)",
      lessons: 6,
      exercises: 6,
      imageUrl: null,
    },
    {
      id: "moon",
      title: "La Lune",
      titleEn: "The Moon",
      lessons: 5,
      exercises: 5,
      imageUrl: null,
    },
    {
      id: "saturn",
      title: "Saturne",
      titleEn: "Saturn",
      lessons: 6,
      exercises: 6,
      imageUrl: null,
    },
    {
      id: "pluto",
      title: "Pluton",
      titleEn: "Pluto",
      lessons: 5,
      exercises: 5,
      imageUrl: null,
    },
  ];

  const displayModules = modules.length > 0 ? modules : placeholderModules;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-cosmic-black text-lunar-white">
      {/* Header avec navigation */}
      <header className="p-4 border-b border-neon-blue/20 bg-cosmic-black/90 backdrop-blur-md flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="text-neon-blue hover:text-neon-blue/80 transition-colors"
          >
            <Home size={20} />
          </Link>
          <span className="text-lunar-white/40">/</span>
          <span className="text-lunar-white/80 font-medium">
            {language === "fr" ? "Modules" : "Modules"}
          </span>
        </div>

        <Link href="/dashboard">
          <Button className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black font-medium">
            {language === "fr" ? "Tableau de bord" : "Dashboard"}
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neon-blue">
            {language === "fr" ? "Modules d'apprentissage" : "Learning Modules"}
          </h1>

          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10 transition-all"
          >
            <ArrowLeft size={16} className="mr-2" />
            {language === "fr" ? "Retour à l'accueil" : "Back to home"}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-neon-blue"></div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {displayModules.map((module) => (
              <motion.div
                key={module.id}
                className="bg-cosmic-black/40 backdrop-blur-sm rounded-xl border border-neon-blue/20 overflow-hidden"
                variants={itemVariants}
              >
                <div className="aspect-video bg-cosmic-black/60 flex items-center justify-center">
                  {module.imageUrl ? (
                    <img
                      src={module.imageUrl}
                      alt={getModuleTitle(module)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-16 h-16 text-neon-blue/30" />
                  )}
                </div>

                <div className="p-4">
                  <h2 className="text-xl font-bold text-lunar-white mb-2">
                    {getModuleTitle(module)}
                  </h2>

                  <div className="text-sm text-lunar-white/70">
                    {module.lessons && (
                      <p>
                        {module.lessons}{" "}
                        {language === "fr" ? "leçons" : "lessons"} /{" "}
                        {module.exercises || 0}{" "}
                        {language === "fr" ? "exercices" : "exercises"}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/modules/${module.id}`}
                      className="inline-flex items-center px-4 py-2 rounded-full bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all text-sm font-medium"
                    >
                      {language === "fr" ? "Découvrir" : "Explore"}
                      <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
