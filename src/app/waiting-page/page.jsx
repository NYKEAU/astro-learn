"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";

export default function WaitingPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const initSteps = [
    {
      id: 1,
      message: t("initialization.analyzing"),
      duration: 800,
    },
    {
      id: 2,
      message: t("initialization.personalizing"),
      duration: 600,
    },
    {
      id: 3,
      message: t("initialization.preparing"),
      duration: 600,
    },
    {
      id: 4,
      message: t("initialization.ready"),
      duration: 400,
    },
  ];

  useEffect(() => {
    let timeout;

    const runSteps = async () => {
      for (let i = 0; i < initSteps.length; i++) {
        setCurrentStep(i);
        const startProgress = (i / initSteps.length) * 100;
        const endProgress = ((i + 1) / initSteps.length) * 100;
        const stepDuration = initSteps[i].duration;
        const increment = (endProgress - startProgress) / (stepDuration / 50);

        for (let p = startProgress; p <= endProgress; p += increment) {
          await new Promise((resolve) => {
            timeout = setTimeout(resolve, 50);
          });
          setProgress(Math.min(p, 100));
        }
      }

      router.push("/dashboard");
    };

    runSteps();

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        className="text-center space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h1 className="text-3xl font-bold">{t("initialization.title")}</h1>
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 animate-spin">🚀</div>
        </div>
        <p className="text-xl">{initSteps[currentStep].message}</p>
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </div>
  );
}
