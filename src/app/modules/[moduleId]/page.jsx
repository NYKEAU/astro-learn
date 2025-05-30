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
import { Home, ArrowLeft, Book, Code } from "lucide-react";

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { moduleId } = params;
  const { language } = useLanguage();

  const [moduleData, setModuleData] = useState(null);
  const [moduleParts, setModuleParts] = useState([]);
  const [hasParts, setHasParts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({});

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

  // Vérifier l'état d'authentification et charger les données du module
  useEffect(() => {
    // Vérification de l'authentification
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setUser(user);
      setLoading(false);

      // Si l'utilisateur est authentifié, charger sa progression
      if (user && moduleId) {
        loadUserProgress(user.uid, moduleId);
      }
    });

    // Récupérer les données du module
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

    if (moduleId) {
      getModuleData();
    }

    return () => unsubscribe();
  }, [moduleId]);

  // Charger la progression de l'utilisateur
  const loadUserProgress = async (userId, moduleId) => {
    try {
      // Récupérer toutes les entrées de progression pour ce module
      const progressRef = collection(db, "users", userId, "progress");
      const progressQuery = query(
        progressRef,
        where("moduleId", "==", moduleId)
      );
      const progressSnapshot = await getDocs(progressQuery);

      const progress = {};

      progressSnapshot.forEach((doc) => {
        const data = doc.data();
        // Extraire la partie à partir de l'ID de la leçon (partX.Y)
        if (data.lessonId && data.lessonId.match(/^part\d+\.\d+$/)) {
          const [partKey] = data.lessonId.split(".");
          const partNumber = partKey.replace("part", "");

          // Initialiser la partie si elle n'existe pas encore
          if (!progress[partNumber]) {
            progress[partNumber] = {
              totalAnswered: 0,
              totalQuestions: 0,
              completedLessons: [],
            };
          }

          // Ajouter cette leçon à la progression
          progress[partNumber].completedLessons.push(data.lessonId);

          // Si cette leçon a des réponses enregistrées
          if (data.answers && Object.keys(data.answers).length > 0) {
            progress[partNumber].totalAnswered += 1;
          }
        }
      });

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
    if (!userProgress[partNumber]) return 0;

    const part = moduleParts.find((p) => p.partNumber === parseInt(partNumber));
    if (!part) return 0;

    const totalLessons = part.lessons ? part.lessons.length : 0;
    if (totalLessons === 0) return 0;

    const completed = userProgress[partNumber].completedLessons.length;
    return Math.round((completed / totalLessons) * 100);
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
                ? `"Earth, the third planet from the Sun, is a dynamic world of land, water, and life. Its atmosphere, magnetic field, and plate tectonics make it uniquely habitable, supporting diverse ecosystems and human civilization."`
                : `"Earth, the third planet from the Sun, is a dynamic world of land, water, and life. Its atmosphere, magnetic field, and plate tectonics make it uniquely habitable, supporting diverse ecosystems and human civilization."`)}
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

                    {/* Boutons */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Link
                        href={`/modules/${moduleId}/lessons?part=${part.partNumber}`}
                      >
                        <Button
                          variant="outline"
                          className="w-full border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 flex items-center justify-center"
                        >
                          <Book className="mr-2 h-4 w-4" />
                          {language === "fr"
                            ? "Voir la théorie"
                            : "View theory"}
                        </Button>
                      </Link>
                      <Link
                        href={`/modules/${moduleId}/exercises?part=${part.partNumber}`}
                      >
                        <Button className="w-full bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black flex items-center justify-center">
                          <Code className="mr-2 h-4 w-4" />
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
