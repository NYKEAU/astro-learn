"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";
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
import { useModuleAccess } from "@/lib/hooks/useModuleAccess";
import { Lock } from "lucide-react";
import { ThreeDViewerButton } from "@/components/ui/3d-viewer-button";
import { toast } from "sonner";
import { check3DModelExists, get3DModelURL } from "@/lib/firebase/storage";
import { Toaster } from "sonner";
import { lazy, Suspense } from "react";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

// Lazy load du ModelViewer
const ModelViewer = lazy(() => import("@/components/3d/ModelViewer"));

export default function LessonsPage() {
  const params = useParams();
  const { moduleId: moduleSlug } = params;
  const { language } = useLanguage();
  const router = useRouter();
  const { canAccessModule } = useModuleAccess();

  // Détection mobile simple et fiable
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkIfMobile = () => {
      const isMobile = window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileDevice(isMobile);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Extraire l'ID réel du module à partir du slug (ex: "1-la_terre" -> "1")
  const moduleId = moduleSlug.split("-")[0];

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activePart, setActivePart] = useState(1);
  const [activeLesson, setActiveLesson] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [has3DModel, setHas3DModel] = useState(false);
  const [model3DURL, setModel3DURL] = useState(null);
  const [checking3DModel, setChecking3DModel] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);

  // Vérifier l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Vérifier l'existence du modèle 3D
  useEffect(() => {
    console.log("🚀 useEffect 3D déclenché, moduleId:", moduleId);
    console.log("📦 Fonctions importées:", { check3DModelExists, get3DModelURL });

    const check3DModel = async () => {
      if (!moduleId) {
        console.log("❌ Pas de moduleId, arrêt");
        return;
      }

      console.log(`🔍 Vérification du modèle 3D pour le module: ${moduleId}`);
      setChecking3DModel(true);
      try {
        const modelExists = await check3DModelExists(moduleId);
        console.log(`📦 Modèle 3D existe pour le module ${moduleId}:`, modelExists);
        setHas3DModel(modelExists);

        if (modelExists) {
          const modelURL = await get3DModelURL(moduleId);
          console.log(`🔗 URL du modèle 3D:`, modelURL);
          setModel3DURL(modelURL);
        }
      } catch (error) {
        console.error("❌ Erreur lors de la vérification du modèle 3D:", error);
        setHas3DModel(false);
        setModel3DURL(null);
      } finally {
        setChecking3DModel(false);
      }
    };

    check3DModel();
  }, [moduleId]);

  // Vérifier l'accès au module
  useEffect(() => {
    if (moduleId) {
      const moduleAccess = canAccessModule(moduleId);
      setHasAccess(moduleAccess);

      // Rediriger si l'utilisateur n'a pas accès au module, sauf pour "1"
      if (!moduleAccess && moduleId !== "1") {
        console.log("Accès refusé au module:", moduleId);
        router.push("/modules");
      }
    }
  }, [moduleId, isAuthenticated, user, router]);

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
            console.log(`Aucune leçon trouvée dans la partie ${partData.id}`);
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
        // En cas d'erreur de permissions, rediriger
        if (error.code === "permission-denied") {
          console.log(
            "Erreur de permissions, redirection vers la liste des modules"
          );
          router.push("/modules");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchModule();
  }, [moduleId, router, isAuthenticated]);

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

  // Fonction pour gérer l'ouverture du viewer 3D avec vérification des droits
  const handle3DViewerToggle = () => {
    if (!hasAccess && moduleId !== "1") {
      toast.error(
        language === "fr"
          ? "Cette leçon n'est pas encore accessible"
          : "This lesson is not yet accessible"
      );
      return;
    }
    setShow3DViewer(!show3DViewer);
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

            <div className="flex items-center gap-3">
              {/* Bouton 3D */}
              {has3DModel && (
                <ThreeDViewerButton
                  onClick={handle3DViewerToggle}
                  isLoading={checking3DModel}
                  hasAccess={hasAccess || moduleId === "1"}
                  language={language}
                />
              )}

              <Link href={`/modules/${moduleId}/exercises`}>
                <Button className="bg-neon-blue hover:bg-neon-blue/80 text-cosmic-black">
                  {language === "fr" ? "Passer aux exercices" : "Go to exercises"}
                </Button>
              </Link>
            </div>
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

      {/* Viewer 3D */}
      <AnimatePresence>
        {show3DViewer && (hasAccess || moduleId === "1") && isClient && (
          <>
            {isMobileDevice ? (
              // Version mobile : plein écran
              <ModelViewer
                modelURL={model3DURL}
                onClose={() => setShow3DViewer(false)}
                language={language}
                isMobile={true}
              />
            ) : (
              // Version desktop : modal
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShow3DViewer(false)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-cosmic-black/90 backdrop-blur-md rounded-lg border border-neon-blue/30 p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header du modal */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-lunar-white">
                      {language === "fr" ? "Exploration 3D" : "3D Exploration"}
                    </h3>
                    <button
                      onClick={() => setShow3DViewer(false)}
                      className="text-lunar-white/70 hover:text-lunar-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Instructions */}
                  <p className="text-lunar-white/70 text-sm mb-4">
                    {language === "fr"
                      ? "Utilisez la souris pour faire tourner, zoomer et explorer l'objet en 3D"
                      : "Use your mouse to rotate, zoom and explore the 3D object"}
                  </p>

                  {/* Viewer 3D */}
                  <div className="h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-neon-blue/20">
                    <Suspense fallback={
                      <div className="h-full flex items-center justify-center bg-cosmic-black/50">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
                      </div>
                    }>
                      <ModelViewer
                        modelURL={model3DURL}
                        language={language}
                        isMobile={false}
                      />
                    </Suspense>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      <Toaster />
    </div>
  );
}
