"use client";

import { AnimatePresence } from "framer-motion";
import { BasicInfo } from "@/components/forms/basic-info";
import { AstronomyKnowledge } from "@/components/forms/astronomy-knowledge";
import { InterestsPreferences } from "@/components/forms/interests-preferences";
import { LearningGoals } from "@/components/forms/learning-goals";

export function RegistrationSteps({ form, currentStep }) {
  return (
    <div className="min-h-[400px]">
      <AnimatePresence mode="wait">
        {currentStep === 0 && <BasicInfo key="step-1" form={form} />}
        {currentStep === 1 && <AstronomyKnowledge key="step-2" form={form} />}
        {currentStep === 2 && <InterestsPreferences key="step-3" form={form} />}
        {currentStep === 3 && <LearningGoals key="step-4" form={form} />}
      </AnimatePresence>
    </div>
  );
}
