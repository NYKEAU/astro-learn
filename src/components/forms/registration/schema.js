import * as z from "zod";

export const formSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom complet doit contenir au moins 2 caractères"),
  age: z
    .string()
    .refine(
      (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
      "Veuillez entrer un âge valide"
    ),
  educationLevel: z
    .string()
    .min(1, "Veuillez sélectionner votre niveau d'études"),
  knowledgeLevel: z
    .string()
    .min(1, "Veuillez sélectionner votre niveau de connaissance"),
  knownSubjects: z
    .array(z.string())
    .min(1, "Veuillez sélectionner au moins un sujet"),
  usedApps: z.string().min(1, "Veuillez sélectionner une option"),
  interests: z
    .array(z.string())
    .min(1, "Veuillez sélectionner au moins un intérêt"),
  learningPreference: z
    .string()
    .min(1, "Veuillez sélectionner votre préférence d'apprentissage"),
  learningGoals: z
    .array(z.string())
    .min(1, "Veuillez sélectionner au moins un objectif"),
});
