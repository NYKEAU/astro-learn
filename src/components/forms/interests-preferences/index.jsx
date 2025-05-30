"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";

const interests = [
  { id: "stargazing", label: "Observation des étoiles" },
  { id: "planetExploration", label: "Exploration des planètes" },
  { id: "universeMysteries", label: "Mystères de l'univers" },
  { id: "spaceTechnology", label: "Technologies spatiales" },
  { id: "others", label: "Autres" },
];

export function InterestsPreferences({ form }) {
  // État local pour suivre la valeur sélectionnée
  const [selectedPreference, setSelectedPreference] = useState(
    form.getValues("learningPreference") || ""
  );

  // Mettre à jour la valeur du formulaire lorsque l'état local change
  useEffect(() => {
    form.setValue("learningPreference", selectedPreference, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [selectedPreference, form]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <FormLabel className="text-base font-medium text-white/90">
          Quels aspects de l'astronomie vous intéressent le plus?
        </FormLabel>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {interests.map((interest) => (
            <div key={interest.id} className="flex items-center space-x-2">
              <Checkbox
                id={`interest-${interest.id}`}
                checked={
                  form.watch("interests")?.includes(interest.id) || false
                }
                onCheckedChange={(checked) => {
                  const currentValues = form.getValues("interests") || [];
                  const newValues = checked
                    ? [...currentValues, interest.id]
                    : currentValues.filter((value) => value !== interest.id);

                  form.setValue("interests", newValues, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
                className="checkbox-modern"
              />
              <label
                htmlFor={`interest-${interest.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                {interest.label}
              </label>
            </div>
          ))}
        </div>
        {form.formState.errors.interests && (
          <p className="text-sm text-red-400 mt-1">
            {form.formState.errors.interests.message}
          </p>
        )}
      </div>

      <div>
        <FormLabel className="text-base font-medium text-white/90">
          Comment préférez-vous apprendre?
        </FormLabel>

        {/* Boutons radio simplifiés */}
        <div className="space-y-3 mt-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="videos"
              name="learningPreference"
              value="videos"
              checked={selectedPreference === "videos"}
              onChange={() => setSelectedPreference("videos")}
              className="radio-modern"
            />
            <label
              htmlFor="videos"
              className="text-sm font-medium cursor-pointer"
            >
              Vidéos
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="readings"
              name="learningPreference"
              value="readings"
              checked={selectedPreference === "readings"}
              onChange={() => setSelectedPreference("readings")}
              className="radio-modern"
            />
            <label
              htmlFor="readings"
              className="text-sm font-medium cursor-pointer"
            >
              Lectures
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="ar"
              name="learningPreference"
              value="ar"
              checked={selectedPreference === "ar"}
              onChange={() => setSelectedPreference("ar")}
              className="radio-modern"
            />
            <label htmlFor="ar" className="text-sm font-medium cursor-pointer">
              Interactions RA
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="all"
              name="learningPreference"
              value="all"
              checked={selectedPreference === "all"}
              onChange={() => setSelectedPreference("all")}
              className="radio-modern"
            />
            <label htmlFor="all" className="text-sm font-medium cursor-pointer">
              Tous les formats
            </label>
          </div>
        </div>

        {form.formState.errors.learningPreference && (
          <p className="text-sm text-red-400 mt-1">
            {form.formState.errors.learningPreference.message}
          </p>
        )}
      </div>
    </motion.div>
  );
}

InterestsPreferences.propTypes = {
  form: PropTypes.object.isRequired,
};
