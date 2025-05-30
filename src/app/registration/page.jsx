// Ce fichier sera supprimé car nous consolidons tout dans la route /register
// Toutes les fonctionnalités importantes ont été vérifiées et intégrées dans /register

"use client";

import { RegistrationForm } from "@/components/forms/registration";
import { Toaster } from "sonner";

export default function RegistrationPage() {
  return (
    <div className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-exo font-bold text-center text-lunar-white mb-8">
          Inscription à <span className="text-neon-blue">Astro</span>
          <span className="text-neon-pink">Learn</span>
        </h1>

        <RegistrationForm />
      </div>

      <Toaster position="top-center" />
    </div>
  );
}
