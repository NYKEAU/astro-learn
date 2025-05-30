"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { motion } from "framer-motion";
import { onAuthStateChange } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy,
} from "firebase/firestore";

export default function LessonsPage() {
  const params = useParams();
  const { moduleId } = params;
  const { language } = useLanguage();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activePart, setActivePart] = useState(1);
  const [activeLesson, setActiveLesson] = useState(null);

  // Vérifier l'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setUser(user);
      setLoading(false);

      if (!user) {
        router.push("/register");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Charger le contenu du module et les leçons
  useEffect(() => {
    if (!moduleId) return;

    const fetchModule = async () => {
      setIsLoading(true);
      try {
        // Récupérer le document principal du module
        const moduleDoc = await getDoc(doc(db, "modules", moduleId));

        if (!moduleDoc.exists()) {
          console.error("Module non trouvé:", moduleId);
          router.push("/modules");
          return;
        }

        const moduleData = { id: moduleDoc.id, ...moduleDoc.data() };
        setModule(moduleData);

        // Récupérer les parties du module (nouvelle structure)
        const partsRef = collection(db, "modules", moduleId, "parts");
        const partsQuery = query(partsRef, orderBy("order"));
        const partsSnapshot = await getDocs(partsQuery);

        if (partsSnapshot.empty) {
          console.log("Aucune partie trouvée pour ce module");
          return;
        }

        // Récupérer toutes les leçons de toutes les parties
        const allLessons = [];
        const parts = [];

        for (const partDoc of partsSnapshot.docs) {
          const partData = { id: partDoc.id, ...partDoc.data() };
          const partNumber = partData.id.replace("part", "");

          // Ajouter la partie à la liste
          parts.push({
            id: partDoc.id,
            partNumber: parseInt(partNumber),
            title: partData.title || `Partie ${partNumber}`,
            order: partData.order,
          });

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

          if (!lessonsSnapshot.empty) {
            lessonsSnapshot.docs.forEach((doc) => {
              const lessonData = doc.data();
              allLessons.push({
                id: doc.id,
                partId: partDoc.id,
                partNumber: parseInt(partNumber),
                partTitle: partData.title || `Partie ${partNumber}`,
                ...lessonData,
              });
            });
          } else {
            console.log(
              `Aucune leçon trouvée dans la partie ${partData.id}, création d'une leçon par défaut`
            );

            // Si aucune leçon n'existe, créer une leçon par défaut
            allLessons.push({
              id: "lesson1",
              partId: partDoc.id,
              partNumber: parseInt(partNumber),
              partTitle: partData.title || `Partie ${partNumber}`,
              title: `Leçon 1: ${partData.title}`,
              content: `<h2>Contenu à venir pour ${partData.title}</h2><p>Cette section est en cours de développement.</p>`,
              order: 1,
            });
          }
        }

        // Trier les leçons par partie puis par ordre
        allLessons.sort((a, b) => {
          if (a.partNumber === b.partNumber) {
            return a.order - b.order;
          }
          return a.partNumber - b.partNumber;
        });

        if (allLessons.length > 0) {
          setLessons(allLessons);
          // Sélectionner la première leçon par défaut
          setActiveLesson(allLessons[0]);
          setActivePart(allLessons[0].partNumber);
        } else {
          console.error("Aucune leçon trouvée pour ce module");
        }
      } catch (error) {
        console.error("Erreur lors du chargement du module:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModule();
  }, [moduleId, router]);

  const changePart = (partNumber) => {
    setActivePart(partNumber);
    const lessonOfPart = lessons.find(
      (lesson) => lesson.partNumber === partNumber
    );
    if (lessonOfPart) {
      setActiveLesson(lessonOfPart);
    }
  };

  const changeLesson = (lesson) => {
    setActiveLesson(lesson);
    setActivePart(lesson.partNumber);
  };

  if (loading || isLoading) {
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

  // Regrouper les leçons par partie
  const lessonsByPart = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.partNumber]) {
      acc[lesson.partNumber] = [];
    }
    acc[lesson.partNumber].push(lesson);
    return acc;
  }, {});

  // Obtenir la liste des parties uniques avec leurs titres
  const getPartsWithTitles = () => {
    const partsMap = new Map();

    lessons.forEach((lesson) => {
      if (!partsMap.has(lesson.partNumber)) {
        partsMap.set(lesson.partNumber, {
          partNumber: lesson.partNumber,
          title: lesson.partTitle || `Partie ${lesson.partNumber}`,
        });
      }
    });

    return Array.from(partsMap.values()).sort(
      (a, b) => a.partNumber - b.partNumber
    );
  };

  const partsWithTitles = getPartsWithTitles();

  return (
    <div className="min-h-screen flex flex-col bg-cosmic-black">
      {/* Navigation */}
      <nav className="bg-cosmic-black/80 backdrop-blur-md border-b border-neon-blue/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-lunar-white font-exo">
              AstroLearn
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Link href="/dashboard">
              <Button className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black">
                {language === "fr" ? "Tableau de bord" : "Dashboard"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href={`/modules/${moduleId}`}
                className="inline-flex items-center text-lunar-white/70 hover:text-lunar-white transition-colors mb-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {language === "fr" ? "Retour au module" : "Back to module"}
              </Link>

              <h1 className="text-3xl font-bold text-lunar-white font-exo">
                {module &&
                  (language === "fr"
                    ? module.title
                    : module.titleEn || module.title)}
              </h1>
            </div>

            <Link href={`/modules/${moduleId}/exercises`}>
              <Button className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black">
                {language === "fr" ? "Passer aux exercices" : "Go to exercises"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation des parties */}
        <div className="flex overflow-x-auto pb-2 mb-6 gap-2">
          {partsWithTitles.map((part) => (
            <button
              key={part.partNumber}
              onClick={() => changePart(part.partNumber)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activePart === part.partNumber
                  ? "bg-neon-blue text-cosmic-black"
                  : "bg-cosmic-black/40 text-lunar-white/70 hover:bg-neon-blue/20 hover:text-lunar-white"
                }`}
            >
              {part.title}
            </button>
          ))}
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar des leçons */}
          <div className="md:col-span-1 space-y-2">
            {lessonsByPart[activePart]?.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => changeLesson(lesson)}
                className={`w-full text-left p-3 rounded-lg transition-all ${activeLesson?.id === lesson.id
                    ? "bg-neon-blue/20 border border-neon-blue text-lunar-white"
                    : "bg-cosmic-black/40 border border-neon-blue/20 text-lunar-white/70 hover:text-lunar-white hover:border-neon-blue/50"
                  }`}
              >
                <span className="block text-sm">
                  {lesson.title || `Leçon ${lesson.order || 1}`}
                </span>
              </button>
            ))}
          </div>

          {/* Contenu de la leçon */}
          <div className="md:col-span-3">
            <div className="bg-cosmic-black/80 backdrop-blur-md rounded-lg border border-neon-blue/20 p-6">
              {activeLesson ? (
                <>
                  <h2 className="text-2xl font-bold text-lunar-white mb-6">
                    {activeLesson.title}
                  </h2>

                  <div className="prose prose-invert max-w-none">
                    <div
                      dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                      className="text-lunar-white/90 space-y-4"
                    />
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button
                      onClick={() => {
                        const currentIndex = lessons.findIndex(
                          (l) => l.id === activeLesson.id
                        );
                        if (currentIndex > 0) {
                          changeLesson(lessons[currentIndex - 1]);
                        }
                      }}
                      disabled={
                        lessons.findIndex((l) => l.id === activeLesson.id) === 0
                      }
                      className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue disabled:opacity-50"
                    >
                      {language === "fr" ? "Précédent" : "Previous"}
                    </Button>

                    {lessons.findIndex((l) => l.id === activeLesson.id) <
                      lessons.length - 1 ? (
                      <Button
                        onClick={() => {
                          const currentIndex = lessons.findIndex(
                            (l) => l.id === activeLesson.id
                          );
                          if (currentIndex < lessons.length - 1) {
                            changeLesson(lessons[currentIndex + 1]);
                          }
                        }}
                        className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black"
                      >
                        {language === "fr" ? "Suivant" : "Next"}
                      </Button>
                    ) : (
                      <Link href={`/modules/${moduleId}/exercises`}>
                        <Button className="bg-gradient-to-r from-neon-blue to-neon-pink text-cosmic-black hover:opacity-90">
                          {language === "fr"
                            ? "Passer aux exercices"
                            : "Go to exercises"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-lunar-white/70">
                    {language === "fr"
                      ? "Sélectionnez une leçon pour commencer"
                      : "Select a lesson to start"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
