"use client";

import { motion } from "framer-motion";

const variants = {
  hidden: { opacity: 0, scale: 0.8, y: 500 },
  enter: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8, y: -500 },
};

export default function Template({ children }) {
  return (
    <motion.main
      variants={variants}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      }}
    >
      {children}
    </motion.main>
  );
}
