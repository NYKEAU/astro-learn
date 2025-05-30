"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const tabs = [
  { id: 0, label: "Profil" },
  { id: 1, label: "Connaissances" },
  { id: 2, label: "Intérêts" },
  { id: 3, label: "Objectifs" },
];

export function RegistrationTabs({ currentStep, setCurrentStep }) {
  return (
    <div className="flex justify-between items-center mb-8 relative">
      <div className="absolute h-1 bg-white/10 left-0 right-0 top-1/2 -translate-y-1/2 z-0" />

      {tabs.map((tab) => (
        <div
          key={tab.id}
          className="z-10 flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => setCurrentStep(tab.id)}
        >
          <motion.div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep >= tab.id
                ? "bg-primary text-white"
                : "bg-white/10 text-white/50"
            )}
            initial={{ scale: 0.8 }}
            animate={{
              scale: currentStep === tab.id ? 1.1 : 1,
              backgroundColor:
                currentStep >= tab.id
                  ? "var(--primary)"
                  : "rgba(255, 255, 255, 0.1)",
            }}
            transition={{ duration: 0.2 }}
          >
            {tab.id + 1}
          </motion.div>
          <span
            className={cn(
              "text-xs font-medium",
              currentStep >= tab.id ? "text-white" : "text-white/50"
            )}
          >
            {tab.label}
          </span>
        </div>
      ))}
    </div>
  );
}
