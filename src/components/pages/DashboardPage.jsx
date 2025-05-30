"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        toast.success("Successfully signed out!");
        router.push("/");
      } else {
        toast.error(result.error || "Failed to sign out");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-end mb-8">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="flex items-center gap-2"
        >
          Sign Out
        </Button>
      </div>

      <div className="h-full overflow-auto bg-background p-6">
        <motion.div
          className="max-w-7xl mx-auto space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-4">Current Progress</h2>
            <div className="w-full h-4 bg-primary/20 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-primary" />
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">Module {i}</h3>
                <p className="text-muted-foreground">
                  Sample module description...
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p>Activity {i}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
