"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import React from "react";
import PropTypes from "prop-types";

export function SlideLayout({ homePage, dashboardPage }) {
  const [currentPage, setCurrentPage] = useState("home");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleScroll = () => {
    if (!isTransitioning && currentPage === "home") {
      setIsTransitioning(true);
      setCurrentPage("dashboard");
    }
  };

  const variants = {
    enter: { y: "100%", opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  };

  return (
    <div className="h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {currentPage === "home" ? (
          <motion.div
            key="home"
            className="h-screen"
            initial={false}
            animate="center"
            exit="exit"
            variants={variants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {homePage}
            <button
              onClick={handleScroll}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
            >
              <ChevronDown className="w-8 h-8" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            className="h-screen"
            initial="enter"
            animate="center"
            variants={variants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {dashboardPage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

SlideLayout.propTypes = {
  homePage: PropTypes.node.isRequired,
  dashboardPage: PropTypes.node.isRequired,
};
