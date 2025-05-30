"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import BackgroundEffects from "../effects/BackgroundEffects";
import LoadingTransition from "../effects/LoadingTransition";
import FrozenRoute from "./FrozenRoute";

export default function AnimationLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen overflow-hidden">
      <BackgroundEffects />
      <AnimatePresence mode="wait">
        <motion.div key={pathname}>
          <FrozenRoute>{children}</FrozenRoute>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
