"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { RocketIcon, StarIcon, BookOpenIcon, TargetIcon } from "lucide-react";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { BasicInfo } from "@/components/forms/basic-info";
import { AstronomyKnowledge } from "@/components/forms/astronomy-knowledge";
import { Interests } from "@/components/forms/interests";
import { LearningGoals } from "@/components/forms/learning-goals";
import { useLanguage } from "@/lib/LanguageContext";
import { signInWithGoogle } from "@/lib/firebase/auth";

// Schéma de validation
const formSchema = z.object({
  // Informations de base
  fullName: z
    .string()
    .min(2, "Le nom complet doit contenir au moins 2 caractères"),
  age: z.string().refine((val) => !isNaN(val) && parseInt(val) > 0, {
    message: "L'âge doit être un nombre positif",
  }),
  educationLevel: z
    .string()
    .min(1, "Veuillez sélectionner un niveau d'éducation"),

  // Connaissances en astronomie
  astronomyLevel: z.string().min(1, "Veuillez sélectionner votre niveau"),
  previousExperience: z.string(),

  // Intérêts
  interests: z.array(z.string()).min(1, "Sélectionnez au moins un intérêt"),

  // Objectifs d'apprentissage
  learningGoals: z
    .array(z.string())
    .min(1, "Sélectionnez au moins un objectif"),
  additionalInfo: z.string(),
});

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepsValid, setStepsValid] = useState([false, false, false, false]);
  const router = useRouter();
  const { t } = useLanguage();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      age: "",
      educationLevel: "",
      astronomyLevel: "",
      previousExperience: "",
      interests: [],
      learningGoals: [],
      additionalInfo: "",
    },
  });

  const steps = [
    {
      id: "profil",
      name: t?.personalInfo || "Informations personnelles",
      component: <BasicInfo form={form} />,
      icon: <RocketIcon className="h-5 w-5" />,
      fields: ["fullName", "age", "educationLevel"],
    },
    {
      id: "connaissances",
      name: t?.astronomyKnowledge || "Connaissances en astronomie",
      component: <AstronomyKnowledge form={form} />,
      icon: <StarIcon className="h-5 w-5" />,
      fields: ["astronomyLevel", "previousExperience"],
    },
    {
      id: "interets",
      name: t?.interests || "Centres d'intérêt",
      component: <Interests form={form} />,
      icon: <BookOpenIcon className="h-5 w-5" />,
      fields: ["interests"],
    },
    {
      id: "objectifs",
      name: t?.learningGoals || "Objectifs d'apprentissage",
      component: <LearningGoals form={form} />,
      icon: <TargetIcon className="h-5 w-5" />,
      fields: ["learningGoals", "additionalInfo"],
    },
  ];

  // Calculer le pourcentage de progression en fonction de l'étape actuelle et des étapes validées
  const calculateProgress = () => {
    // Compter le nombre d'étapes validées
    const validStepsCount = stepsValid.filter(Boolean).length;

    // Calculer le pourcentage de base en fonction de l'étape actuelle
    const basePercentage = (currentStep / (steps.length - 1)) * 100;

    // Ajouter un bonus pour l'étape actuelle si elle est partiellement remplie
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

    // Calculer le pourcentage final
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

  // Valider l'étape actuelle à chaque changement de formulaire
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
        form.handleSubmit(onSubmit)();
      }
    } else {
      toast.error(
        t?.requiredFields || "Veuillez remplir tous les champs obligatoires"
      );
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    try {
      const { user, error } = await signInWithGoogle();

      if (user) {
        toast.success(
          t?.registrationSuccess ||
            "Inscription réussie ! Redirection vers le tableau de bord..."
        );

        // Redirection vers le tableau de bord
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        toast.error(
          t?.registrationError ||
            "Échec de l'inscription: " + (error || "Veuillez réessayer.")
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      toast.error(
        t?.registrationError || "Échec de l'inscription. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Simuler un délai pour l'envoi des données
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Afficher un message de succès mais ne pas rediriger
      // car l'utilisateur doit encore s'inscrire avec Google
      toast.success(
        t?.formCompleted ||
          "Formulaire complété ! Veuillez finaliser votre inscription avec Google."
      );

      // Désactiver l'état de soumission pour permettre l'inscription avec Google
      setIsSubmitting(false);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error(
        t?.registrationError || "Une erreur est survenue. Veuillez réessayer."
      );
      setIsSubmitting(false);
    }
  };

  // Déterminer si le formulaire est complet (toutes les étapes sont valides)
  const isFormComplete = stepsValid.every((step) => step === true);

  return (
    <div className="w-full max-w-4xl mx-auto bg-cosmic-black/80 backdrop-blur-md p-6 rounded-b-xl shadow-lg border border-neon-blue/20 border-t-0">
      {/* Barre de progression simplifiée et améliorée */}
      <div className="mb-8">
        <div className="flex justify-between items-center relative">
          {/* Ligne de connexion entre toutes les étapes */}
          <div className="absolute top-6 left-0 w-full h-1 bg-cosmic-black/50 -z-10"></div>

          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col items-center relative group"
            >
              {/* Ligne de progression colorée */}
              {index > 0 && (
                <div
                  className="absolute top-6 right-1/2 h-1 -z-10 transition-all duration-500"
                  style={{
                    width: index <= currentStep ? "100%" : "0%",
                    left: "-50%",
                    background:
                      "linear-gradient(to right, hsl(195, 100%, 60%), hsl(330, 100%, 60%))",
                  }}
                />
              )}

              {/* Icône de l'étape */}
              <motion.div
                className={`flex items-center justify-center w-12 h-12 rounded-full z-10 transition-all duration-300
                  ${
                    index < currentStep
                      ? "bg-gradient-to-r from-neon-blue to-neon-pink text-lunar-white"
                      : index === currentStep
                      ? "bg-gradient-to-r from-neon-blue to-neon-pink text-lunar-white ring-4 ring-neon-blue/30"
                      : "bg-cosmic-black/50 text-lunar-white/50 border border-lunar-white/20"
                  } 
                  ${stepsValid[index] ? "ring-2 ring-light-turquoise" : ""}
                `}
                onClick={() => {
                  // Permettre de naviguer vers les étapes précédentes validées
                  if (index < currentStep || stepsValid[index]) {
                    setCurrentStep(index);
                  }
                }}
                style={{
                  cursor:
                    index <= currentStep || stepsValid[index]
                      ? "pointer"
                      : "not-allowed",
                }}
                whileHover={
                  index <= currentStep || stepsValid[index]
                    ? { scale: 1.1 }
                    : {}
                }
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {step.icon}
              </motion.div>

              {/* Nom de l'étape */}
              <span
                className={`mt-2 text-sm font-medium ${
                  index <= currentStep
                    ? "text-lunar-white"
                    : "text-lunar-white/50"
                }`}
              >
                {step.name}
              </span>

              {/* Tooltip d'information sur l'étape */}
              <div className="absolute bottom-full mb-2 w-48 bg-cosmic-black/90 text-lunar-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none left-1/2 -translate-x-1/2">
                {index === 0 && "Informations personnelles de base"}
                {index === 1 && "Votre niveau et expérience en astronomie"}
                {index === 2 && "Vos sujets d'intérêt en astronomie"}
                {index === 3 && "Vos objectifs d'apprentissage"}
              </div>
            </div>
          ))}
        </div>

        {/* Pourcentage de progression */}
        <div className="mt-4 text-right">
          <span className="text-sm font-jetbrains text-lunar-white/70">
            {progressPercentage}% {t?.completed || "complété"}
          </span>
        </div>
      </div>

      {/* Contenu du formulaire */}
      <form>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px]"
          >
            {steps[currentStep].component}
          </motion.div>
        </AnimatePresence>

        {/* Boutons de navigation */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="border-neon-blue/50 text-lunar-white hover:bg-neon-blue/10"
          >
            {t?.previous || "Précédent"}
          </Button>

          {currentStep === steps.length - 1 && isFormComplete ? (
            <div className="flex space-x-4">
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-neon-blue to-neon-pink text-lunar-white hover:opacity-90 shadow-[0_0_15px_rgba(51,204,255,0.5)]"
              >
                {isSubmitting
                  ? t?.validating || "Validation..."
                  : t?.validate || "Valider"}
              </Button>

              <Button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isSubmitting || !isFormComplete}
                className="flex items-center space-x-2 bg-lunar-white text-cosmic-black hover:bg-lunar-white/90"
              >
                <FcGoogle className="w-5 h-5" />
                <span>{t?.finalize || "Finaliser avec Google"}</span>
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-gradient-to-r from-neon-blue to-neon-pink text-lunar-white hover:opacity-90 shadow-[0_0_15px_rgba(51,204,255,0.5)]"
            >
              {t?.next || "Suivant"}
            </Button>
          )}
        </div>
      </form>

      {/* Message d'information sur l'inscription Google */}
      {currentStep === steps.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg"
        >
          <p className="text-sm text-lunar-white/90 font-jetbrains">
            <span className="text-neon-pink font-bold">Important :</span>{" "}
            {t?.importantGoogleNotice ||
              "Pour finaliser votre inscription et sauvegarder vos préférences, vous devez vous connecter avec Google. Sans cette étape, vos données ne pourront pas être enregistrées dans notre système."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
