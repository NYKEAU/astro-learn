"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { RocketIcon, StarIcon, BookOpenIcon, TargetIcon, SkipForward, ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BasicInfo } from "@/components/forms/basic-info";
import { AstronomyKnowledge } from "@/components/forms/astronomy-knowledge";
import { Interests } from "@/components/forms/interests";
import { LearningGoals } from "@/components/forms/learning-goals";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/app/providers";
import { profileService } from "@/lib/services/profileService";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, getDocs, collection } from "firebase/firestore";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const formSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  age: z.string().refine((val) => !isNaN(val) && parseInt(val) > 0, {
    message: "L'âge doit être un nombre positif",
  }),
  educationLevel: z.string().min(1, "Veuillez sélectionner un niveau d'éducation"),
  astronomyLevel: z.string().min(1, "Veuillez sélectionner votre niveau"),
  previousExperience: z.string(),
  interests: z.array(z.string()).min(1, "Sélectionnez au moins un intérêt"),
  learningGoals: z.array(z.string()).min(1, "Sélectionnez au moins un objectif"),
  additionalInfo: z.string(),
  knownSubjects: z.array(z.string()).optional(),
  usedApps: z.string().optional(),
});

function createStars() {
  const stars = [];
  const starCount = {
    small: Math.floor((typeof window !== "undefined" ? window.innerWidth : 100) / 10),
    medium: Math.floor((typeof window !== "undefined" ? window.innerWidth : 100) / 25),
    large: Math.floor((typeof window !== "undefined" ? window.innerWidth : 100) / 50),
    shooting: 1,
  };

  for (let i = 0; i < starCount.small; i++) {
    const size = Math.random() * 1 + 0.5;
    stars.push(
      <div
        key={`small-${i}`}
        className="star"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 10 + 5}s`,
          animationDelay: `${Math.random() * 5}s`,
          opacity: Math.random() * 0.7 + 0.3,
        }}
      />
    );
  }

  for (let i = 0; i < starCount.medium; i++) {
    const size = Math.random() * 1.5 + 1;
    stars.push(
      <div
        key={`medium-${i}`}
        className="star"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 15 + 10}s`,
          animationDelay: `${Math.random() * 8}s`,
          opacity: Math.random() * 0.8 + 0.2,
          boxShadow: `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`,
        }}
      />
    );
  }

  for (let i = 0; i < starCount.large; i++) {
    const size = Math.random() * 2 + 1.5;
    stars.push(
      <div
        key={`large-${i}`}
        className="star"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 20 + 15}s`,
          animationDelay: `${Math.random() * 10}s`,
          opacity: Math.random() * 0.9 + 0.1,
          boxShadow: `0 0 ${size * 3}px rgba(255, 255, 255, 0.9)`,
        }}
      />
    );
  }

  return stars;
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepsValid, setStepsValid] = useState([false, false, false, false]);
  const [stars, setStars] = useState([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.displayName || "",
      age: "",
      educationLevel: "",
      astronomyLevel: "",
      previousExperience: "",
      interests: [],
      learningGoals: [],
      additionalInfo: "",
      knownSubjects: [],
      usedApps: "",
    },
  });

  useEffect(() => {
    if (user?.displayName) {
      form.setValue("fullName", user.displayName, { shouldValidate: true });
    }
  }, [user, form]);

  useEffect(() => {
    document.body.classList.add("register-page");
    setStars(createStars());
    return () => {
      document.body.classList.remove("register-page");
    };
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/register");
    }
  }, [user, router]);

  const steps = [
    {
      id: "profil",
      name: language === "fr" ? "Profil" : "Profile",
      component: <BasicInfo form={form} />,
      icon: <RocketIcon className="h-5 w-5" />,
      fields: ["fullName", "age", "educationLevel"],
    },
    {
      id: "connaissances",
      name: language === "fr" ? "Connaissances" : "Knowledge",
      component: <AstronomyKnowledge form={form} />,
      icon: <StarIcon className="h-5 w-5" />,
      fields: ["astronomyLevel", "previousExperience"],
    },
    {
      id: "interets",
      name: language === "fr" ? "Intérêts" : "Interests",
      component: <Interests form={form} />,
      icon: <BookOpenIcon className="h-5 w-5" />,
      fields: ["interests"],
    },
    {
      id: "objectifs",
      name: language === "fr" ? "Objectifs" : "Goals",
      component: <LearningGoals form={form} />,
      icon: <TargetIcon className="h-5 w-5" />,
      fields: ["learningGoals", "additionalInfo"],
    },
  ];

  const calculateProgress = () => {
    const validStepsCount = stepsValid.filter(Boolean).length;
    const basePercentage = (currentStep / (steps.length - 1)) * 100;
    const currentStepFields = steps[currentStep].fields;
    const formValues = form.getValues();
    let filledFieldsCount = 0;

    for (const field of currentStepFields) {
      if (field === "interests" || field === "learningGoals") {
        if (formValues[field] && formValues[field].length > 0) {
          filledFieldsCount++;
        }
      } else if (
        field !== "previousExperience" &&
        field !== "additionalInfo" &&
        formValues[field]
      ) {
        filledFieldsCount++;
      }
    }

    const currentStepProgress =
      (filledFieldsCount / currentStepFields.length) * (100 / steps.length);

    return Math.min(100, Math.round(basePercentage + currentStepProgress));
  };

  const progressPercentage = calculateProgress();

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    const formValues = form.getValues();
    let isValid = true;

    for (const field of step.fields) {
      if (field === "interests" || field === "learningGoals") {
        if (!formValues[field] || formValues[field].length === 0) {
          isValid = false;
          break;
        }
      } else if (
        field !== "previousExperience" &&
        field !== "additionalInfo" &&
        !formValues[field]
      ) {
        isValid = false;
        break;
      }
    }

    const newStepsValid = [...stepsValid];
    newStepsValid[stepIndex] = isValid;
    setStepsValid(newStepsValid);

    return isValid;
  };

  useEffect(() => {
    const subscription = form.watch(() => {
      validateStep(currentStep);
    });
    return () => subscription.unsubscribe();
  }, [form, currentStep]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmitAll();
      }
    } else {
      toast.error(
        language === "fr"
          ? "Veuillez remplir tous les champs obligatoires"
          : "Please fill in all required fields"
      );
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveOnboardingData = async (formData) => {
    if (!user?.uid) return;

    setIsSubmitting(true);
    try {
      const modulesSnapshot = await getDocs(collection(db, "modules"));
      const availableModules = modulesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sortedModules = availableModules
        .sort((a, b) => {
          const aNum = parseInt(a.id);
          const bNum = parseInt(b.id);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return a.id.localeCompare(b.id);
        })
        .map((module) => module.id);

      const personalizedPath = sortedModules;

      await profileService.createOrUpdateProfileInfos(user.uid, {
        ...formData,
        personalizedPath,
      });

      await updateDoc(doc(db, "users", user.uid), {
        onboardingCompleted: true,
      });

      toast.success(
        language === "fr"
          ? "Profil sauvegardé ! Bienvenue sur AstroLearn."
          : "Profile saved! Welcome to AstroLearn."
      );

      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(
        language === "fr"
          ? "Erreur lors de la sauvegarde. Veuillez réessayer."
          : "Error saving data. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAll = () => {
    const formData = form.getValues();
    saveOnboardingData(formData);
  };

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkipAll();
    }
  };

  const handleSkipAll = async () => {
    if (!user?.uid) return;

    setIsSubmitting(true);
    try {
      const formData = form.getValues();

      const modulesSnapshot = await getDocs(collection(db, "modules"));
      const availableModules = modulesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sortedModules = availableModules
        .sort((a, b) => {
          const aNum = parseInt(a.id);
          const bNum = parseInt(b.id);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return a.id.localeCompare(b.id);
        })
        .map((module) => module.id);

      const hasAnyData = formData.fullName || formData.interests?.length > 0 || formData.learningGoals?.length > 0;

      if (hasAnyData) {
        await profileService.createOrUpdateProfileInfos(user.uid, {
          ...formData,
          personalizedPath: sortedModules,
        });
      }

      await updateDoc(doc(db, "users", user.uid), {
        onboardingCompleted: true,
      });

      toast.success(
        language === "fr"
          ? "Bienvenue sur AstroLearn ! Vous pourrez compléter votre profil plus tard."
          : "Welcome to AstroLearn! You can complete your profile later."
      );

      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur lors du skip:", error);
      toast.error(
        language === "fr"
          ? "Une erreur est survenue. Veuillez réessayer."
          : "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-cosmic-black text-lunar-white relative overflow-hidden flex flex-col items-center justify-center">
      <div className="stars-container absolute inset-0 overflow-hidden z-0">
        {stars}
      </div>

      <header className="w-full max-w-6xl mx-auto p-4 border-b border-neon-blue/20 bg-cosmic-black/90 backdrop-blur-md flex justify-between items-center z-10 relative">
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard"
            className="text-neon-blue hover:text-neon-blue/80 transition-colors"
          >
            <Home size={20} />
          </Link>
          <span className="text-lunar-white/40">/</span>
          <span className="text-lunar-white/80 font-medium">
            {language === "fr" ? "Onboarding" : "Onboarding"}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
        </div>
      </header>

      <main className="w-full flex flex-col items-center justify-center flex-1 py-8 z-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-3xl mx-auto"
        >
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <img
                src="/Logo Final RTL.svg"
                alt="AstroLearn"
                className="h-16 w-auto"
              />
            </div>
            <p className="text-lunar-white/70">
              {language === "fr"
                ? "Personnalisez votre expérience d'apprentissage"
                : "Personalize your learning experience"}
            </p>
          </div>

          <Card className="bg-cosmic-black/60 backdrop-blur-sm border border-neon-blue/20 rounded-2xl overflow-hidden shadow-md w-full max-w-3xl">
            <CardContent className="p-6">
              {/* Barre de progression */}
              <div className="w-full flex flex-col items-center mb-6">
                <div className="flex items-center justify-between w-full max-w-md mb-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          index === currentStep
                            ? "bg-neon-blue text-cosmic-black scale-110"
                            : index < currentStep || stepsValid[index]
                            ? "bg-neon-blue/50 text-lunar-white"
                            : "bg-cosmic-black/60 border border-neon-blue/30 text-lunar-white/50"
                        }`}
                      >
                        {step.icon}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`h-0.5 w-8 sm:w-16 mx-4 transition-all duration-300 ${
                            index < currentStep || stepsValid[index]
                              ? "bg-neon-blue"
                              : "bg-neon-blue/20"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <span className="text-xs text-lunar-white/70 font-medium tracking-wide mb-2">
                  {progressPercentage}% {language === "fr" ? "complété" : "completed"}
                </span>
                <div className="w-full max-w-md h-3 bg-cosmic-black/60 rounded-full overflow-hidden border border-neon-blue/30">
                  <div
                    className="h-full bg-neon-blue transition-all duration-500"
                    style={{
                      width: `${progressPercentage}%`,
                      borderRadius: "9999px",
                    }}
                  />
                </div>
              </div>

              {/* Contenu de l'étape */}
              <form>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[260px]"
                  >
                    {steps[currentStep].component}
                  </motion.div>
                </AnimatePresence>

                {/* Boutons de navigation */}
                <div className="flex flex-col space-y-3 mt-6">
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      className="px-4 py-2 rounded-xl bg-cosmic-black/60 border border-neon-blue/30 text-lunar-white hover:bg-neon-blue/10 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      {language === "fr" ? "Précédent" : "Previous"}
                    </Button>

                    <div className="flex space-x-2">
                      {currentStep > 0 && (
                        <Button
                          type="button"
                          onClick={handleSkipStep}
                          className="px-4 py-2 rounded-xl bg-cosmic-black/60 border border-lunar-white/20 text-lunar-white/70 hover:bg-lunar-white/10 hover:text-lunar-white transition-colors text-sm"
                        >
                          <SkipForward className="w-4 h-4 mr-1" />
                          {language === "fr" ? "Passer cette étape" : "Skip this step"}
                        </Button>
                      )}

                      {currentStep === steps.length - 1 && (
                        <Button
                          type="button"
                          onClick={handleSubmitAll}
                          disabled={isSubmitting}
                          className="px-4 py-2 rounded-xl bg-neon-blue text-cosmic-black hover:bg-neon-blue/90 shadow-lg transition-all font-medium"
                        >
                          {isSubmitting
                            ? language === "fr"
                              ? "Sauvegarde..."
                              : "Saving..."
                            : language === "fr"
                            ? "Terminer"
                            : "Finish"}
                        </Button>
                      )}

                      {currentStep < steps.length - 1 && (
                        <Button
                          type="button"
                          onClick={handleNext}
                          className="px-4 py-2 rounded-xl bg-neon-blue text-cosmic-black hover:bg-neon-blue/90 shadow-lg transition-all font-medium"
                        >
                          {language === "fr" ? "Suivant" : "Next"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Bouton Skip Global */}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      onClick={handleSkipAll}
                      disabled={isSubmitting}
                      variant="ghost"
                      className="text-lunar-white/50 hover:text-lunar-white text-sm"
                    >
                      {language === "fr"
                        ? "Passer tout et aller au dashboard →"
                        : "Skip all and go to dashboard →"}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Info message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 p-3 bg-neon-blue/10 border border-neon-blue/30 rounded-xl"
              >
                <p className="text-xs text-lunar-white/90">
                  <span className="text-neon-pink font-bold">
                    {language === "fr" ? "Astuce" : "Tip"} :
                  </span>{" "}
                  {currentStep === 0
                    ? language === "fr"
                      ? "Vous pouvez passer cette étape — votre nom Google sera utilisé par défaut."
                      : "You can skip this step — your Google name will be used by default."
                    : language === "fr"
                    ? "Ces informations nous aident à personnaliser votre parcours, mais vous pouvez les complèter plus tard depuis votre profil."
                    : "This information helps personalize your path, but you can complete it later from your profile."}
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}