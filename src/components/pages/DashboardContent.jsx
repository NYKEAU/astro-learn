"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import { lazy, Suspense } from "react";

// Import dynamique des composants non critiques
const DashboardChart = lazy(() =>
  import("@/components/dashboard/DashboardChart")
);

export default function DashboardContent() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        toast.success(t?.signedOut || "Déconnexion réussie");
        router.push("/register");
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Erreur inattendue: ${error.message}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center"
        >
          <h1 className="text-3xl font-bold text-lunar-white font-exo">
            {t?.dashboard || "Tableau de bord"}
          </h1>
          <Button
            onClick={handleSignOut}
            className="bg-neon-blue hover:bg-neon-blue/80 text-lunar-white"
          >
            {t?.signOut || "Déconnexion"}
          </Button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Cartes d'information du dashboard */}
          <motion.div
            variants={itemVariants}
            className="bg-cosmic-black/80 backdrop-blur-md p-6 rounded-xl border border-neon-blue/20 shadow-lg"
          >
            <h2 className="text-xl font-exo text-neon-blue mb-4">
              {t?.welcome || "Bienvenue !"}
            </h2>
            <p className="text-lunar-white/80">
              {t?.welcomeMessage ||
                "Votre voyage astronomique commence ici. Explorez nos cours et ressources pour approfondir vos connaissances."}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-cosmic-black/80 backdrop-blur-md p-6 rounded-xl border border-neon-pink/20 shadow-lg"
          >
            <h2 className="text-xl font-exo text-neon-pink mb-4">
              {t?.courses || "Cours"}
            </h2>
            <p className="text-lunar-white/80">
              {t?.coursesMessage ||
                "Vous n'avez pas encore commencé de cours. Découvrez notre catalogue pour débuter votre apprentissage."}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-cosmic-black/80 backdrop-blur-md p-6 rounded-xl border border-light-turquoise/20 shadow-lg"
          >
            <h2 className="text-xl font-exo text-light-turquoise mb-4">
              {t?.events || "Événements"}
            </h2>
            <p className="text-lunar-white/80">
              {t?.eventsMessage ||
                "Restez informé des prochains événements astronomiques et des sessions d'observation."}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
