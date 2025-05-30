"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/lib/LanguageContext";

export function AuthTab() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();

      if (result.success) {
        toast.success(t("auth.login.success"));
        router.push("/dashboard");
      } else {
        toast.error(result.error || t("auth.error.default"));
      }
    } catch (error) {
      toast.error(t("auth.error.unexpected"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <div className="space-y-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-2">
            {t("auth.login.title")}
          </h2>
          <p className="text-muted-foreground">{t("auth.login.subtitle")}</p>
        </motion.div>
      </div>

      <Button
        onClick={handleGoogleAuth}
        variant="outline"
        size="lg"
        className="w-full max-w-sm flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        <FcGoogle className="h-5 w-5" />
        {isLoading ? t("auth.loading") : t("auth.continueWithGoogle")}
      </Button>
    </div>
  );
}
