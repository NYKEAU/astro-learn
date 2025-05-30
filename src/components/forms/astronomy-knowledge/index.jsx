"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";

const subjects = [
  { id: "planets", label: "Planètes" },
  { id: "stars", label: "Étoiles" },
  { id: "galaxies", label: "Galaxies" },
  { id: "blackHoles", label: "Trous noirs" },
  { id: "others", label: "Autres" },
];

export function AstronomyKnowledge({ form }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-exo font-bold text-lunar-white mb-6">
        Connaissances en astronomie
      </h2>

      <FormField
        control={form.control}
        name="astronomyLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-lunar-white">
              Niveau en astronomie <span className="text-neon-pink">*</span>
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

      <div>
        <FormLabel className="text-base font-medium text-white/90">
          Quels sujets astronomiques connaissez-vous déjà?
        </FormLabel>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center space-x-2">
              <Checkbox
                id={`subject-${subject.id}`}
                checked={
                  form.watch("knownSubjects")?.includes(subject.id) || false
                }
                onCheckedChange={(checked) => {
                  const currentValues = form.getValues("knownSubjects") || [];
                  const newValues = checked
                    ? [...currentValues, subject.id]
                    : currentValues.filter((value) => value !== subject.id);

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
              <select {...field} className="w-full mt-1.5 form-select-modern">
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
    </motion.div>
  );
}

AstronomyKnowledge.propTypes = {
  form: PropTypes.object.isRequired,
};
