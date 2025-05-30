"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PageTransition = ({ children, direction = "none", className = "" }) => {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  // Variants pour les différentes directions
  const variants = {
    // Slide depuis la gauche (pour profil)
    fromLeft: {
      initial: { x: "-100%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-100%", opacity: 0 },
    },
    // Slide depuis la droite (pour paramètres)
    fromRight: {
      initial: { x: "100%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "100%", opacity: 0 },
    },
    // Slide vers la gauche (retour depuis paramètres)
    toLeft: {
      initial: { x: "100%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-100%", opacity: 0 },
    },
    // Slide vers la droite (retour depuis profil)
    toRight: {
      initial: { x: "-100%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "100%", opacity: 0 },
    },
    // Fade par défaut
    none: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
  };

  const currentVariant = variants[direction] || variants.none;

  const transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    duration: 0.3,
  };

  return (
    <motion.div
      className={`min-h-screen ${className}`}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={currentVariant}
      transition={transition}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
