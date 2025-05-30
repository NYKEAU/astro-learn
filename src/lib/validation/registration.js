import { z } from "zod";

export const registrationSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Le nom doit contenir au moins 2 caractères" })
    .max(50, { message: "Le nom ne peut pas dépasser 50 caractères" }),

  age: z
    .string()
    .refine((val) => !isNaN(parseInt(val)), {
      message: "L'âge doit être un nombre",
    })
    .refine((val) => parseInt(val) >= 7 && parseInt(val) <= 120, {
      message: "L'âge doit être compris entre 7 et 120 ans",
    }),

  educationLevel: z
    .string()
    .min(1, { message: "Veuillez sélectionner un niveau d'études" }),

  knownSubjects: z.array(z.string()).optional().default([]),

  interests: z
    .array(z.string())
    .min(1, { message: "Veuillez sélectionner au moins un centre d'intérêt" }),

  learningPreference: z
    .string()
    .min(1, {
      message: "Veuillez sélectionner une préférence d'apprentissage",
    }),

  learningGoals: z
    .array(z.string())
    .min(1, {
      message: "Veuillez sélectionner au moins un objectif d'apprentissage",
    }),
});

export const defaultValues = {
  fullName: "",
  age: "",
  educationLevel: "",
  knownSubjects: [],
  interests: [],
  learningPreference: "",
  learningGoals: [],
};
