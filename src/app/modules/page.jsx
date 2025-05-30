"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { Home, ArrowLeft, ImageIcon, ChevronRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useModuleAccess } from "@/lib/hooks/useModuleAccess";

export default function ModulesPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { language } = useLanguage();
  const { canAccessModule, getModuleOrder } = useModuleAccess();
  const personalizedOrder = getModuleOrder();

  useEffect(() => {
    async function fetchModules() {
      setLoading(true);
      try {
        // Charger depuis Firebase
        const modulesCollection = collection(db, "modules");
        const modulesSnapshot = await getDocs(modulesCollection);

        const modulesData = modulesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Modules Firestore:", modulesData);
        modulesData.forEach((mod, i) => {
          console.log(`Module[${i}] id:`, mod.id, typeof mod.id, mod);
        });

        // Tri personnalisé si personalizedPath existe
        console.log("Personalized order:", personalizedOrder);
        if (personalizedOrder && personalizedOrder.length > 0) {
          console.log("Tri personnalisé utilisé");
          modulesData.sort((a, b) => {
            const idxA = personalizedOrder.indexOf(a.id);
            const idxB = personalizedOrder.indexOf(b.id);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });
        } else {
          console.log("Tri par ID croissant utilisé");
          // Tri croissant par ID numérique
          modulesData.sort((a, b) => {
            const idA = parseInt(a.id);
            const idB = parseInt(b.id);
            if (!isNaN(idA) && !isNaN(idB)) {
              return idA - idB;
            }
            // Fallback sur le tri par titre
            return a.title.localeCompare(b.title);
          });
        }
        console.log("Modules après tri:", modulesData);
        if (modulesData.length > 0) {
          console.log("setModules avec:", modulesData);
          setModules([...modulesData]);
        } else {
          // Utiliser les modules fictifs seulement s'il n'y a pas de données
          console.log(
            "Aucun module trouvé dans Firestore, utilisation des modules fictifs"
          );
          setModules(placeholderModules);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des modules:", error);
        // En cas d'erreur critique, utiliser les modules fictifs
        console.log("Utilisation des modules fictifs suite à une erreur");
        setModules(placeholderModules);
      } finally {
        setLoading(false);
      }
    }
    fetchModules();
    // eslint-disable-next-line
  }, [JSON.stringify(personalizedOrder)]);

  const getModuleTitle = (module) => {
    return language === "fr" ? module.title : module.titleEn || module.title;
  };

  // Fonction pour créer une URL conviviale à partir du titre du module
  const getModuleSlug = (module) => {
    const title = getModuleTitle(module)
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Supprimer les caractères spéciaux
      .replace(/\s+/g, "_"); // Remplacer les espaces par des underscores
    return `${module.id}-${title}`;
  };

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

  // Log l'état React juste avant le rendu
  console.log("Modules à afficher (état React):", modules);

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
        ) : modules.length === 0 ? (
          <div className="text-center text-lunar-white/70 text-lg mt-12">
            Aucun module trouvé.
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {modules.length > 0 ? (
              modules.map((module, idx) => {
                try {
                  console.log("Affichage module", idx, module);
                  const hasAccess = canAccessModule(module.id);
                  // console.log(`Module ${module.id}: hasAccess = ${hasAccess}`);
                  return (
                    <motion.div
                      key={module.id}
                      className={`bg-cosmic-black/40 backdrop-blur-sm rounded-xl overflow-hidden ${
                        !hasAccess && module.id !== "1"
                          ? "border border-red-500/60"
                          : "border border-neon-blue/20"
                      }`}
                      variants={itemVariants}
                    >
                      <div className="aspect-video bg-cosmic-black/60 relative flex items-center justify-center">
                        {module.imageUrl ? (
                          <img
                            src={module.imageUrl}
                            alt={getModuleTitle(module)}
                            className={`w-full h-full object-cover ${
                              !hasAccess && module.id !== "1"
                                ? "opacity-50"
                                : ""
                            }`}
                          />
                        ) : (
                          <ImageIcon
                            className={`w-16 h-16 text-neon-blue/30 ${
                              !hasAccess && module.id !== "1"
                                ? "opacity-50"
                                : ""
                            }`}
                          />
                        )}

                        {/* Indicateur de verrouillage */}
                        {!hasAccess && module.id !== "1" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-cosmic-black/60">
                            <Lock className="w-12 h-12 text-red-400" />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <h2 className="text-xl font-bold text-lunar-white mb-2">
                            {getModuleTitle(module)}
                          </h2>

                          {/* Badge pour indiquer si le module est ouvert/verrouillé */}
                          {module.id === "1" ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                              {language === "fr" ? "Gratuit" : "Free"}
                            </span>
                          ) : hasAccess ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-neon-blue/20 text-neon-blue">
                              {language === "fr" ? "Débloqué" : "Unlocked"}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                              {language === "fr" ? "Verrouillé" : "Locked"}
                            </span>
                          )}
                        </div>

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
                          {!hasAccess && module.id !== "1" ? (
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500/10 text-red-400/70 cursor-not-allowed opacity-70 text-sm font-medium">
                              <Lock className="mr-1 h-3 w-3" />
                              {language === "fr"
                                ? "Connexion requise"
                                : "Login required"}
                            </div>
                          ) : (
                            <Link
                              href={`/modules/${getModuleSlug(module)}`}
                              className="inline-flex items-center px-4 py-2 rounded-full bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all text-sm font-medium"
                            >
                              {language === "fr" ? "Découvrir" : "Explore"}
                              <ChevronRight size={16} className="ml-1" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                } catch (err) {
                  console.error("Erreur rendu module", idx, module, err);
                  return (
                    <div
                      key={module.id}
                      className="bg-red-900 text-red-200 p-4 rounded-xl"
                    >
                      Erreur d'affichage du module {module.id} : {err.message}
                    </div>
                  );
                }
              })
            ) : (
              <div className="text-center text-lunar-white/70 text-lg mt-12">
                Aucun module rendu dans le map.
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
