"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/custom-tabs";
import { BasicInfo } from "./BasicInfo";
import { AstronomyKnowledge } from "./AstronomyKnowledge";
import { InterestsPreferences } from "./InterestsPreferences";
import { LearningGoals } from "./LearningGoals";
import { Rocket, Stars, Telescope, Target } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { GoogleSignIn } from "../auth/GoogleSignIn";
import { toast } from "sonner";
import BackgroundEffects from "@/components/effects/BackgroundEffects";
import GrainEffect from "@/components/effects/GrainEffect";
import "@/styles/form.css";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.string().refine((val) => !isNaN(val) && parseInt(val) > 0, {
    message: "Please enter a valid age",
  }),
  educationLevel: z.string(),
  knownSubjects: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  learningPreference: z.string(),
  learningGoals: z.array(z.string()).optional(),
});

export function RegistrationForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      age: "",
      educationLevel: "",
      knownSubjects: [],
      interests: [],
      learningPreference: "",
      learningGoals: [],
    },
  });

  const steps = [
    {
      id: "basic-info",
      label: "Basic Info",
      icon: Rocket,
      component: BasicInfo,
    },
    {
      id: "astronomy-knowledge",
      label: "Knowledge",
      icon: Stars,
      component: AstronomyKnowledge,
    },
    {
      id: "interests",
      label: "Interests",
      icon: Telescope,
      component: InterestsPreferences,
    },
    {
      id: "goals",
      label: "Goals",
      icon: Target,
      component: LearningGoals,
    },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const onSubmit = async (data) => {
    try {
      // Ici vous pouvez ajouter la logique de soumission du formulaire
      // Par exemple, sauvegarder les données ou naviguer vers une autre page
      toast.success("Form submitted successfully!");
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form");
    }
  };

  return (
    <>
      <BackgroundEffects />
      <GrainEffect />
      <div className="min-h-screen flex items-center justify-center py-12 relative z-10">
        <motion.div className="w-full max-w-2xl mx-auto p-8 form-container rounded-lg h-[800px] flex flex-col">
          <div className="tabs-list grid w-full grid-cols-4 mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  disabled={index !== currentStep}
                  className={cn(
                    "tab-trigger flex flex-col items-center gap-1 py-2 px-1 rounded-md",
                    index === currentStep && "active"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">{step.label}</span>
                </button>
              );
            })}
          </div>

          <Form
            form={form}
            onSubmit={onSubmit}
            className="flex flex-col flex-1"
          >
            <div className="flex-1">
              <CurrentStepComponent form={form} />
            </div>

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0}
                className="nav-button"
              >
                Previous
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="nav-button"
                >
                  Next
                </Button>
              ) : (
                <GoogleSignIn form={form} />
              )}
            </div>
          </Form>
        </motion.div>
      </div>
    </>
  );
}
