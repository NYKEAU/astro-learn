"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { Home, ArrowLeft, Book, Code, Lock } from "lucide-react";
import { useModuleAccess } from "@/lib/hooks/useModuleAccess";

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { moduleId: moduleSlug } = params;
  const { language } = useLanguage();
  const { canAccessModule, getModuleAccessMessage } = useModuleAccess();

  // Extraire l'ID réel du module à partir du slug (ex: "1-la_terre" -> "1")
  const moduleId = moduleSlug.split("-")[0];

  const [moduleData, setModuleData] = useState(null);
  const [moduleParts, setModuleParts] = useState([]);
  const [hasParts, setHasParts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({});
  const [hasAccess, setHasAccess] = useState(false);

  // Fonction pour récupérer les données du module
  const fetchModuleData = async (moduleId) => {
    if (!moduleId) return null;

    try {
      // Récupérer le document principal du module
      const moduleDoc = await getDoc(doc(db, "modules", moduleId));
      if (!moduleDoc.exists()) return null;

      const moduleData = { id: moduleDoc.id, ...moduleDoc.data() };

      // Récupérer les parties du module (nouvelle structure)
      const partsRef = collection(db, "modules", moduleId, "parts");
      const partsQuery = query(partsRef, orderBy("order"));
      const partsSnapshot = await getDocs(partsQuery);

      if (partsSnapshot.empty) {
        // Ancienne structure - garder pour compatibilité
        return moduleData;
      }

      // Nouvelle structure avec parties
      const parts = [];

      for (const partDoc of partsSnapshot.docs) {
        const partData = { id: partDoc.id, ...partDoc.data() };
        const partNumber = partData.id.replace("part", "");

        // Récupérer les leçons de cette partie
        const lessonsRef = collection(
          db,
          "modules",
          moduleId,
          "parts",
          partDoc.id,
          "lessons"
        );
        const lessonsQuery = query(lessonsRef, orderBy("order"));
        const lessonsSnapshot = await getDocs(lessonsQuery);

        const lessons = lessonsSnapshot.docs.map((doc) => ({
          id: doc.id,
          partNumber,
          ...doc.data(),
        }));

        // Récupérer les exercices de cette partie
        const exercisesRef = collection(
          db,
          "modules",
          moduleId,
          "parts",
          partDoc.id,
          "exercises"
        );
        const exercisesQuery = query(exercisesRef, orderBy("order"));
        const exercisesSnapshot = await getDocs(exercisesQuery);

        const exercises = exercisesSnapshot.docs.map((doc) => ({
          id: doc.id,
          partNumber,
          ...doc.data(),
        }));

        parts.push({
          ...partData,
          partNumber: parseInt(partNumber),
          lessons,
          exercises,
        });
      }

      return {
        ...moduleData,
        parts,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération du module:", error);
      return null;
    }
  };

  // Vérifier l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Charger la progression de l'utilisateur si connecté
  useEffect(() => {
    if (user && moduleId) {
      loadUserProgress(user.uid, moduleId);
    }
  }, [user, moduleId]);

  // Vérifier l'accès au module
  useEffect(() => {
    if (moduleId) {
      const accessResult = canAccessModule(moduleId);
      setHasAccess(accessResult);
    }
  }, [moduleId, isAuthenticated, user]);

  // Récupérer les données du module
  useEffect(() => {
    if (moduleId) {
      const getModuleData = async () => {
        setIsLoading(true);
        const data = await fetchModuleData(moduleId);

        if (data) {
          setModuleData(data);

          // Vérifier si le module utilise la nouvelle structure
          if (data.parts && data.parts.length > 0) {
            setHasParts(true);
            setModuleParts(data.parts);
          } else {
            // Ancienne structure - extraire les parties manuellement
            const parts = [];
            const partTitles = {};

            // Extraire les titres des parties
            Object.entries(data).forEach(([key, value]) => {
              if (key.match(/^part\d+$/) && !key.includes(".")) {
                const partNumber = key.replace("part", "");
                partTitles[partNumber] = value;
              }
            });

            // Extraire les questions par partie
            const questions = {};

            Object.entries(data).forEach(([key, value]) => {
              if (key.match(/^part\d+\.\d+$/)) {
                const [partKey, questionNumber] = key.split(".");
                const partNumber = partKey.replace("part", "");

                if (!questions[partNumber]) {
                  questions[partNumber] = [];
                }

                questions[partNumber].push({
                  id: `${partKey}.${questionNumber}`,
                  content: value,
                  order: parseInt(questionNumber),
                });
              }
            });

            // Créer les objets de partie
            Object.keys(partTitles).forEach((partNumber) => {
              parts.push({
                id: `part${partNumber}`,
                partNumber: parseInt(partNumber),
                title: partTitles[partNumber],
                lessons: questions[partNumber] || [],
              });
            });

            // Trier les parties par numéro
            parts.sort((a, b) => a.partNumber - b.partNumber);

            setHasParts(parts.length > 0);
            setModuleParts(parts);
          }
        }

        setIsLoading(false);
      };

      getModuleData();
    }
  }, [moduleId]);

  // Charger la progression de l'utilisateur
  const loadUserProgress = async (userId, moduleId) => {
    try {
      // Récupérer la progression du module depuis la nouvelle structure
      const moduleProgressRef = doc(db, "users", userId, "progress", moduleId);
      const moduleProgressSnap = await getDoc(moduleProgressRef);

      const progress = {};

      if (moduleProgressSnap.exists()) {
        const moduleData = moduleProgressSnap.data();
        console.log("📊 Données de progression du module:", moduleData);

        // Utiliser la nouvelle structure de progression
        if (moduleData.parts && typeof moduleData.parts === "object") {
          // Traiter les données par partie
          Object.entries(moduleData.parts).forEach(([partId, partData]) => {
            const partNumber = partId.replace("part", "");

            if (!progress[partNumber]) {
              progress[partNumber] = {
                totalAnswered: 0,
                totalQuestions: 0,
                completedExercises: [],
                score: 0,
              };
            }

            // Compter les exercices complétés dans cette partie
            if (partData && typeof partData === "object") {
              const exercisesInPart = Object.keys(partData);
              const correctExercises = exercisesInPart.filter(
                (exerciseId) => partData[exerciseId]?.isCorrect === true
              );

              progress[partNumber].completedExercises = exercisesInPart;
              progress[partNumber].totalAnswered = exercisesInPart.length;
              progress[partNumber].score = correctExercises.length;
            }
          });
        }

        // Fallback vers l'ancienne structure si nécessaire
        if (
          Object.keys(progress).length === 0 &&
          moduleData.completedExercises
        ) {
          console.log("📊 Utilisation de l'ancienne structure de progression");

          moduleData.completedExercises.forEach((exerciseId) => {
            // Extraire le numéro de partie depuis l'ID d'exercice (part1.1, part2.1, etc.)
            const partMatch = exerciseId.match(/^part(\d+)\./);
            if (partMatch) {
              const partNumber = partMatch[1];

              if (!progress[partNumber]) {
                progress[partNumber] = {
                  totalAnswered: 0,
                  totalQuestions: 0,
                  completedExercises: [],
                  score: 0,
                };
              }

              progress[partNumber].completedExercises.push(exerciseId);
              progress[partNumber].totalAnswered += 1;
            }
          });
        }
      } else {
        console.log("📭 Aucune progression trouvée pour le module", moduleId);
      }

      setUserProgress(progress);
    } catch (error) {
      console.error("Erreur lors du chargement de la progression:", error);
    }
  };

  // Fonctions auxiliaires pour l'affichage
  const getModuleTitle = () => {
    if (!moduleData) return "";
    return language === "fr"
      ? moduleData.title
      : moduleData.titleEn || moduleData.title;
  };

  const getModuleDescription = () => {
    if (!moduleData) return "";
    return language === "fr"
      ? moduleData.description
      : moduleData.descriptionEn || moduleData.description;
  };

  const getPartTitle = (part) => {
    return language === "fr" ? part.title : part.titleEn || part.title;
  };

  const getProgressPercentage = (partNumber) => {
    console.log(
      `📊 Calcul pourcentage pour partie ${partNumber}:`,
      userProgress[partNumber]
    );

    if (!userProgress[partNumber]) return 0;

    const part = moduleParts.find((p) => p.partNumber === parseInt(partNumber));
    if (!part) return 0;

    // Utiliser le nombre d'exercices comme base pour le calcul
    const totalExercises = getExercisesCount(part);
    if (totalExercises === 0) return 0;

    // Utiliser le score (exercices corrects) pour calculer le pourcentage
    const correctExercises = userProgress[partNumber].score || 0;
    const percentage = Math.round((correctExercises / totalExercises) * 100);

    console.log(
      `📊 Partie ${partNumber}: ${correctExercises}/${totalExercises} = ${percentage}%`
    );

    return percentage;
  };

  // Obtenir le nombre de leçons dans une partie
  const getLessonsCount = (part) => {
    // Vérification des données réelles
    if (part.lessons && Array.isArray(part.lessons)) {
      return part.lessons.length;
    }
    return 0;
  };

  // Obtenir le nombre d'exercices dans une partie
  const getExercisesCount = (part) => {
    // Vérification des données réelles
    if (part.exercises && Array.isArray(part.exercises)) {
      return part.exercises.length;
    }

    // Si nous n'avons pas les données réelles, utiliser des valeurs connues
    // en fonction de l'ID de la partie (visible sur la capture Firebase)
    if (part.id === "part1") {
      return 9; // 9 exercices dans part1
    } else if (part.id === "part2") {
      return 6; // 6 exercices dans part2
    }

    // Valeur par défaut
    return part.partNumber === 1 ? 9 : 6;
  };

  // Cette fonction est utilisée pour afficher le nombre total de questions/exercices
  const getQuestionsCount = (part) => {
    return getExercisesCount(part);
  };

  // UI transitions
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-black text-lunar-white">
      {/* Message d'avertissement pour modules non autorisés */}
      {moduleId !== "1" && !hasAccess && (
        <div className="bg-red-500/20 text-white border-b border-red-500/50 py-2 px-4 text-center">
          <div className="container mx-auto flex items-center justify-center">
            <Lock className="w-4 h-4 mr-2 text-red-300" />
            <p>
              {language === "fr"
                ? "Vous n'êtes pas autorisé à accéder à ce module. Le contenu affiché peut être limité."
                : "You are not authorized to access this module. The content displayed may be limited."}
            </p>
          </div>
        </div>
      )}

      {/* Fil d'Ariane avec le bouton Dashboard */}
      <header className="flex items-center justify-between p-4 border-b border-neon-blue/20">
        <div className="flex items-center space-x-2 text-sm">
          <Link
            href="/"
            className="text-neon-blue hover:text-neon-blue/80 transition-colors"
          >
            <Home size={16} />
          </Link>
          <span className="text-lunar-white/40">/</span>
          <Link
            href="/modules"
            className="text-neon-blue hover:text-neon-blue/80 transition-colors"
          >
            {language === "fr" ? "Modules" : "Modules"}
          </Link>
          <span className="text-lunar-white/40">/</span>
          <span className="text-lunar-white/80 truncate">
            {getModuleTitle()}
          </span>
        </div>

        {/* Bouton Dashboard */}
        <Link href="/dashboard">
          <Button className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black">
            {language === "fr" ? "Tableau de bord" : "Dashboard"}
          </Button>
        </Link>
      </header>

      {/* Contenu principal avec fond dégradé */}
      <main>
        <motion.div
          className="relative bg-gradient-to-b from-neon-blue/20 to-cosmic-black py-10 px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Bouton Retour aux modules */}
          <motion.div variants={itemVariants} className="mb-6">
            <Link
              href="/modules"
              className="inline-flex items-center text-neon-blue hover:text-neon-blue/80 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              {language === "fr" ? "Retour aux modules" : "Back to modules"}
            </Link>
          </motion.div>

          {/* Titre et description du module */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold text-lunar-white mb-4"
          >
            {getModuleTitle()}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lunar-white/70 max-w-3xl mb-6 italic"
          >
            {getModuleDescription() ||
              (language === "fr"
                ? "Description non disponible"
                : "Description not available")}
          </motion.p>

          {/* Tags */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-2 mb-10"
          >
            {moduleData?.tags?.map((tag, index) => (
              <Badge
                key={index}
                className="bg-cosmic-black/30 hover:bg-cosmic-black/40 text-lunar-white border border-neon-blue/30 transition-colors"
              >
                {tag}
              </Badge>
            )) || (
              <>
                <Badge className="bg-cosmic-black/30 hover:bg-cosmic-black/40 text-lunar-white border border-neon-blue/30 transition-colors">
                  {language === "fr" ? "systèmeSolaire" : "solarSystem"}
                </Badge>
                <Badge className="bg-cosmic-black/30 hover:bg-cosmic-black/40 text-lunar-white border border-neon-blue/30 transition-colors">
                  {language === "fr" ? "planètes" : "planets"}
                </Badge>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Contenu du module */}
        <section className="px-4 py-8 mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-8">
            {language === "fr" ? "Contenu du module" : "Module Content"}
          </h2>

          {/* Parties du module */}
          <div className="space-y-6">
            {hasParts &&
              moduleParts.map((part, index) => (
                <div
                  key={part.id}
                  className="border border-neon-blue/20 rounded-lg overflow-hidden"
                >
                  <div className="p-4 border-b border-neon-blue/10">
                    <h3 className="font-bold text-lunar-white">
                      {getPartTitle(part)}
                    </h3>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-lunar-white/70">
                        {language === "fr" ? "Questions: " : "Questions: "}
                        {getQuestionsCount(part)}
                      </div>
                      <div className="text-sm text-lunar-white/70">
                        {getProgressPercentage(part.partNumber)}%
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-full bg-cosmic-black/50 rounded-full h-1.5 mb-4">
                      <div
                        className="h-1.5 rounded-full bg-neon-blue"
                        style={{
                          width: `${getProgressPercentage(part.partNumber)}%`,
                        }}
                      ></div>
                    </div>

                    {/* Message d'accès si le module n'est pas accessible */}
                    {!hasAccess && index > 0 && (
                      <div className="mb-4 p-2 bg-red-500/10 rounded text-sm text-center flex items-center justify-center">
                        <Lock className="w-4 h-4 mr-2 text-neon-blue" />
                        <span>
                          {getModuleAccessMessage(moduleId, !hasAccess)}
                        </span>
                      </div>
                    )}

                    {/* Boutons */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Link
                        href={
                          hasAccess || index === 0
                            ? `/modules/${moduleId}/lessons?part=${part.partNumber}`
                            : "#"
                        }
                        onClick={(e) =>
                          !hasAccess && index > 0 && e.preventDefault()
                        }
                      >
                        <Button
                          variant="outline"
                          className={`w-full border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 flex items-center justify-center ${
                            !hasAccess && index > 0
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {!hasAccess && index > 0 ? (
                            <Lock className="mr-2 h-4 w-4" />
                          ) : (
                            <Book className="mr-2 h-4 w-4" />
                          )}
                          {language === "fr"
                            ? "Voir la théorie"
                            : "View theory"}
                        </Button>
                      </Link>
                      <Link
                        href={
                          hasAccess || index === 0
                            ? `/modules/${moduleId}/exercises?part=${part.partNumber}`
                            : "#"
                        }
                        onClick={(e) =>
                          !hasAccess && index > 0 && e.preventDefault()
                        }
                      >
                        <Button
                          className={`w-full bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black flex items-center justify-center ${
                            !hasAccess && index > 0
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {!hasAccess && index > 0 ? (
                            <Lock className="mr-2 h-4 w-4" />
                          ) : (
                            <Code className="mr-2 h-4 w-4" />
                          )}
                          {language === "fr"
                            ? "Faire les exercices"
                            : "Do exercises"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
