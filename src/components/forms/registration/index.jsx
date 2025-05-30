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
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { aiService } from "@/lib/services/aiService";
import { profileService } from "@/lib/services/profileService";
import { db } from "@/lib/firebase/config";
import { getDocs, collection } from "firebase/firestore";

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

  // Nouveaux champs pour la nouvelle structure
  knownSubjects: z.array(z.string()).optional(),
  usedApps: z.string().optional(),
});

export function RegistrationForm({ compact = false, twoColumns = false }) {
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepsValid, setStepsValid] = useState([false, false, false, false]);
  const router = useRouter();

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
      knownSubjects: [],
      usedApps: "",
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
      // 1. Récupérer les infos du formulaire
      const formData = form.getValues();

      // 2. Récupérer la liste des modules disponibles (depuis Firestore)
      const modulesSnapshot = await getDocs(collection(db, "modules"));
      const availableModules = modulesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 3. Appeler l'IA pour générer le personalizedPath (numéros de module)
      const aiResult = await aiService.generateLearningPath(
        formData,
        availableModules
      );
      // Fusionner tous les modules dans l'ordre easy, medium, hard
      const personalizedPath = [
        ...(aiResult.easyModules || []),
        ...(aiResult.mediumModules || []),
        ...(aiResult.hardModules || []),
      ];

      // 4. Authentification Google
      const { user, error } = await signInWithGoogle();

      if (user) {
        // 5. Sauvegarder le profil dans profilesInfos (Firestore)
        await profileService.createOrUpdateProfileInfos(user.uid, {
          ...formData,
          personalizedPath,
        });
        toast.success(
          t?.registrationSuccess ||
            "Inscription réussie ! Redirection vers le tableau de bord..."
        );
        router.push("/dashboard");
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

  // Helper pour afficher les champs d'une étape sur deux colonnes si possible
  function renderStepComponent() {
    const current = steps[currentStep];
    if (!twoColumns) return current.component;
    if (current.id === "profil") {
      return (
        <>
          <div className="md:col-span-2 text-center mb-2">
            <h2 className="text-2xl font-bold text-lunar-white mb-1">
              Informations personnelles
            </h2>
            <p className="text-lunar-white/70 mb-4">
              Parlez-nous un peu de vous pour personnaliser votre expérience
              d'apprentissage.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonne gauche */}
            <div className="flex flex-col space-y-4">
              {/* Nom complet */}
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-lunar-white"
                >
                  Nom complet <span className="text-neon-pink">*</span>
                </label>
                <Input
                  id="fullName"
                  placeholder="Entrez votre nom complet"
                  {...form.register("fullName")}
                  className="w-full bg-cosmic-black/50 border-neon-blue/30 text-lunar-white placeholder:text-lunar-white/30 focus:border-neon-blue"
                />
                <FormMessage className="text-neon-pink text-xs">
                  {form.formState.errors.fullName?.message}
                </FormMessage>
              </div>
              {/* Âge */}
              <div className="space-y-2">
                <label
                  htmlFor="age"
                  className="block text-sm font-medium text-lunar-white"
                >
                  Âge <span className="text-neon-pink">*</span>
                </label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Entrez votre âge"
                  {...form.register("age")}
                  className="w-full bg-cosmic-black/50 border-neon-blue/30 text-lunar-white placeholder:text-lunar-white/30 focus:border-neon-blue"
                />
                <FormMessage className="text-neon-pink text-xs">
                  {form.formState.errors.age?.message}
                </FormMessage>
              </div>
            </div>
            {/* Colonne droite */}
            <div className="flex flex-col space-y-4">
              {/* Niveau d'éducation */}
              <div className="space-y-2">
                <label
                  htmlFor="educationLevel"
                  className="block text-sm font-medium text-lunar-white"
                >
                  Niveau d'éducation <span className="text-neon-pink">*</span>
                </label>
                <select
                  id="educationLevel"
                  {...form.register("educationLevel")}
                  className="w-full h-10 px-3 py-2 bg-cosmic-black/50 border border-neon-blue/30 rounded-md text-lunar-white focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue"
                >
                  <option value="">
                    Sélectionnez votre niveau d'éducation
                  </option>
                  <option value="primary">Primaire</option>
                  <option value="secondary">Secondaire</option>
                  <option value="highSchool">Lycée</option>
                  <option value="bachelor">Licence</option>
                  <option value="master">Master</option>
                  <option value="phd">Doctorat</option>
                  <option value="other">Autre</option>
                </select>
                <FormMessage className="text-neon-pink text-xs">
                  {form.formState.errors.educationLevel?.message}
                </FormMessage>
              </div>
            </div>
          </div>
          {/* Astuce/info */}
          <div className="md:col-span-2 mt-4">
            <div className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
              <p className="text-sm text-lunar-white/90 font-jetbrains">
                <span className="text-neon-pink font-bold">Astuce :</span> Ces
                informations nous aident à adapter le contenu éducatif à votre
                profil. Toutes vos données sont traitées conformément à notre
                politique de confidentialité.
              </p>
            </div>
          </div>
        </>
      );
    }
    if (current.id === "connaissances") {
      return (
        <>
          <div className="md:col-span-2 text-center mb-2">
            <h2 className="text-2xl font-bold text-lunar-white mb-1">
              Connaissances en astronomie
            </h2>
            <p className="text-lunar-white/70 mb-4">
              Indiquez votre niveau et votre expérience en astronomie.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonne gauche */}
            <div className="flex flex-col space-y-4">
              {/* Niveau en astronomie */}
              <FormField
                control={form.control}
                name="astronomyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lunar-white">
                      Niveau en astronomie{" "}
                      <span className="text-neon-pink">*</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full h-10 px-3 py-2 bg-cosmic-black/50 border border-neon-blue/30 rounded-md text-lunar-white font-jetbrains focus:outline-none focus:border-neon-blue"
                      >
                        <option value="" disabled>
                          Sélectionnez votre niveau
                        </option>
                        <option value="debutant">Débutant</option>
                        <option value="intermediaire">Intermédiaire</option>
                        <option value="avance">Avancé</option>
                        <option value="expert">Expert</option>
                      </select>
                    </FormControl>
                    <FormMessage className="text-neon-pink" />
                  </FormItem>
                )}
              />
              {/* Sujets connus */}
              <div>
                <FormLabel className="text-base font-medium text-white/90">
                  Quels sujets astronomiques connaissez-vous déjà?
                </FormLabel>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {[
                    { id: "planets", label: "Planètes" },
                    { id: "stars", label: "Étoiles" },
                    { id: "galaxies", label: "Galaxies" },
                    { id: "blackHoles", label: "Trous noirs" },
                    { id: "others", label: "Autres" },
                  ].map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={
                          form.watch("knownSubjects")?.includes(subject.id) ||
                          false
                        }
                        onCheckedChange={(checked) => {
                          const currentValues =
                            form.getValues("knownSubjects") || [];
                          const newValues = checked
                            ? [...currentValues, subject.id]
                            : currentValues.filter(
                                (value) => value !== subject.id
                              );
                          form.setValue("knownSubjects", newValues, {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                        }}
                        className="checkbox-modern"
                      />
                      <label
                        htmlFor={`subject-${subject.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {subject.label}
                      </label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.knownSubjects && (
                  <p className="text-sm text-red-400 mt-1">
                    {form.formState.errors.knownSubjects.message}
                  </p>
                )}
              </div>
            </div>
            {/* Colonne droite */}
            <div className="flex flex-col space-y-4">
              {/* Expérience précédente */}
              <FormField
                control={form.control}
                name="previousExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lunar-white">
                      Expérience précédente
                    </FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Décrivez votre expérience précédente en astronomie (optionnel)"
                        {...field}
                        className="w-full min-h-[120px] px-3 py-2 bg-cosmic-black/50 border border-neon-blue/30 rounded-md text-lunar-white font-jetbrains focus:outline-none focus:border-neon-blue resize-none"
                      />
                    </FormControl>
                    <FormMessage className="text-neon-pink" />
                  </FormItem>
                )}
              />
              {/* Apps éducatives */}
              <FormField
                control={form.control}
                name="usedApps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-white/90">
                      Avez-vous déjà utilisé des applications éducatives sur
                      l'astronomie?
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full mt-1.5 form-select-modern"
                      >
                        <option value="" disabled>
                          Sélectionnez votre réponse
                        </option>
                        <option value="true">Oui</option>
                        <option value="false">Non</option>
                      </select>
                    </FormControl>
                    <FormMessage className="text-sm text-red-400 mt-1" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </>
      );
    }
    if (current.id === "interets") {
      // Affichage vertical d'origine (grille sur toute la largeur)
      return (
        <>
          <div className="md:col-span-2 text-center mb-2">
            <h2 className="text-2xl font-bold text-lunar-white mb-1">
              Centres d'intérêt
            </h2>
            <p className="text-lunar-white/70 mb-4">
              Sélectionnez les sujets qui vous intéressent le plus en
              astronomie.
            </p>
          </div>
          <Interests form={form} />
        </>
      );
    }
    if (current.id === "objectifs") {
      return (
        <>
          <div className="md:col-span-2 text-center mb-2">
            <h2 className="text-2xl font-bold text-lunar-white mb-1">
              Objectifs d'apprentissage
            </h2>
            <p className="text-lunar-white/70 mb-4">
              Quels sont vos objectifs d'apprentissage en astronomie ?
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonne gauche : grille d'objectifs */}
            <div className="flex flex-col space-y-4">
              <LearningGoals form={form} fields={["learningGoals"]} />
            </div>
            {/* Colonne droite : infos supplémentaires + astuce */}
            <div className="flex flex-col space-y-4">
              <LearningGoals form={form} fields={["additionalInfo", "tip"]} />
            </div>
          </div>
        </>
      );
    }
    return current.component;
  }

  return (
    <div className={compact ? "p-4 max-w-2xl mx-auto" : "p-6"}>
      {/* Barre de progression horizontale */}
      <div className="w-full flex flex-col items-center mb-6">
        <span className="mt-2 text-xs text-lunar-white/70 font-medium tracking-wide mb-2">
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
      {/* Contenu du formulaire en deux colonnes si demandé */}
      <form>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={compact ? "min-h-[260px]" : "min-h-[400px]"}
          >
            {renderStepComponent()}
          </motion.div>
        </AnimatePresence>
        {/* Boutons de navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl bg-cosmic-black/60 border border-neon-blue/30 text-lunar-white hover:bg-neon-blue/10 transition-colors"
          >
            {language === "fr" ? "Précédent" : "Previous"}
          </Button>
          {currentStep === steps.length - 1 && isFormComplete ? (
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-neon-blue text-cosmic-black hover:bg-neon-blue/90 shadow-lg transition-all font-medium"
              >
                {isSubmitting
                  ? language === "fr"
                    ? "Validation..."
                    : "Validating..."
                  : language === "fr"
                  ? "Valider"
                  : "Validate"}
              </Button>
              <Button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isSubmitting || !isFormComplete}
                className="px-4 py-2 rounded-xl flex items-center space-x-2 bg-lunar-white text-cosmic-black hover:bg-lunar-white/90 shadow-lg transition-all font-medium"
              >
                <FcGoogle className="w-5 h-5" />
                <span>
                  {language === "fr"
                    ? "Finaliser avec Google"
                    : "Complete with Google"}
                </span>
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-neon-blue text-cosmic-black hover:bg-neon-blue/90 shadow-lg transition-all font-medium"
            >
              {language === "fr" ? "Suivant" : "Next"}
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
          className="mt-4 p-3 bg-neon-blue/10 border border-neon-blue/30 rounded-xl"
        >
          <p className="text-xs text-lunar-white/90">
            <span className="text-neon-pink font-bold">
              {language === "fr" ? "Important" : "Important"}:
            </span>{" "}
            {language === "fr"
              ? "Pour finaliser votre inscription et sauvegarder vos préférences, vous devez vous connecter avec Google. Sans cette étape, vos données ne pourront pas être enregistrées."
              : "To complete your registration and save your preferences, you must sign in with Google. Without this step, your data cannot be saved."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
