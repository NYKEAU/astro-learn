"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export function RegistrationNavigation({
  currentStep,
  setCurrentStep,
  stepsCount,
  isLastStep,
  isSubmitting,
}) {
  return (
    <div className="flex justify-between mt-8">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        {currentStep > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={isSubmitting}
            className="border-white/20 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLastStep ? (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-200 shadow-lg"
          >
            {isSubmitting ? "Inscription..." : "Terminer l'inscription"}
            <Rocket className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-200 shadow-lg"
          >
            Suivant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </motion.div>
    </div>
  );
}
