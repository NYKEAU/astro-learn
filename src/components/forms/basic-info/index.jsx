"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { useLanguage } from "@/lib/LanguageContext";

export function BasicInfo({ form }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-exo font-bold text-lunar-white">
          {t?.personalInfo || "Informations personnelles"}
        </h2>
        <p className="text-lunar-white/70 text-sm">
          {t?.personalInfoDesc ||
            "Parlez-nous un peu de vous pour personnaliser votre expérience d'apprentissage."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-lunar-white"
          >
            {t?.fullName || "Nom complet"}{" "}
            <span className="text-neon-pink">*</span>
          </label>
          <Input
            id="fullName"
            placeholder={t?.fullNamePlaceholder || "Entrez votre nom complet"}
            {...form.register("fullName")}
            className="w-full bg-cosmic-black/50 border-neon-blue/30 text-lunar-white placeholder:text-lunar-white/30 focus:border-neon-blue"
          />
          <FormMessage className="text-neon-pink text-xs">
            {form.formState.errors.fullName?.message}
          </FormMessage>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="age"
            className="block text-sm font-medium text-lunar-white"
          >
            {t?.age || "Âge"} <span className="text-neon-pink">*</span>
          </label>
          <Input
            id="age"
            type="number"
            placeholder={t?.agePlaceholder || "Entrez votre âge"}
            {...form.register("age")}
            className="w-full bg-cosmic-black/50 border-neon-blue/30 text-lunar-white placeholder:text-lunar-white/30 focus:border-neon-blue"
          />
          <FormMessage className="text-neon-pink text-xs">
            {form.formState.errors.age?.message}
          </FormMessage>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="educationLevel"
            className="block text-sm font-medium text-lunar-white"
          >
            {t?.educationLevel || "Niveau d'éducation"}{" "}
            <span className="text-neon-pink">*</span>
          </label>
          <select
            id="educationLevel"
            {...form.register("educationLevel")}
            className="w-full h-10 px-3 py-2 bg-cosmic-black/50 border border-neon-blue/30 rounded-md text-lunar-white focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue"
          >
            <option value="">
              {t?.selectEducationLevel ||
                "Sélectionnez votre niveau d'éducation"}
            </option>
            <option value="primary">{t?.primary || "Primaire"}</option>
            <option value="secondary">{t?.secondary || "Secondaire"}</option>
            <option value="highSchool">{t?.highSchool || "Lycée"}</option>
            <option value="bachelor">{t?.bachelor || "Licence"}</option>
            <option value="master">{t?.master || "Master"}</option>
            <option value="phd">{t?.phd || "Doctorat"}</option>
            <option value="other">{t?.other || "Autre"}</option>
          </select>
          <FormMessage className="text-neon-pink text-xs">
            {form.formState.errors.educationLevel?.message}
          </FormMessage>
        </div>
      </div>

      <div className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg mt-6">
        <p className="text-sm text-lunar-white/90 font-jetbrains">
          <span className="text-neon-pink font-bold">
            {t?.tip || "Astuce"} :
          </span>{" "}
          {t?.personalInfoTip ||
            "Ces informations nous aident à adapter le contenu éducatif à votre profil. Toutes vos données sont traitées conformément à notre politique de confidentialité."}
        </p>
      </div>
    </motion.div>
  );
}

BasicInfo.propTypes = {
  form: PropTypes.object.isRequired,
};
