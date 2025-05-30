"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Composant pour une carte d'objet
function ObjectCard({ object, isSelected, onSelect, language }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case "star":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case "planet":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case "system":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <circle
              cx="12"
              cy="12"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle
              cx="12"
              cy="12"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        );
      case "nebula":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              opacity="0.6"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "star":
        return "text-yellow-400";
      case "planet":
        return "text-blue-400";
      case "system":
        return "text-purple-400";
      case "nebula":
        return "text-pink-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <motion.div
      whileHover={{
        scale: 1.01,
        boxShadow: "0 8px 32px rgba(0, 207, 255, 0.15)",
      }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative p-4 rounded-lg border cursor-pointer transition-all duration-200 overflow-hidden
        ${
          isSelected
            ? "bg-neon-blue/20 border-neon-blue/50 shadow-lg shadow-neon-blue/25"
            : "bg-cosmic-black/60 border-neon-blue/20 hover:border-neon-blue/40 hover:bg-cosmic-black/80"
        }
      `}
      onClick={() => onSelect(object.id)}
      style={{
        transformOrigin: "center center",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icône du type */}
        <div className={`flex-shrink-0 ${getTypeColor(object.type)}`}>
          {getTypeIcon(object.type)}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lunar-white font-medium text-sm mb-1 truncate">
            {object.name[language] || object.name.fr}
          </h3>

          <p className="text-lunar-white/60 text-xs leading-relaxed">
            {object.description[language] || object.description.fr}
          </p>

          {/* Badge du type */}
          <div className="mt-2">
            <span
              className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${
                object.type === "star" ? "bg-yellow-400/20 text-yellow-400" : ""
              }
              ${object.type === "planet" ? "bg-blue-400/20 text-blue-400" : ""}
              ${
                object.type === "system"
                  ? "bg-purple-400/20 text-purple-400"
                  : ""
              }
              ${object.type === "nebula" ? "bg-pink-400/20 text-pink-400" : ""}
            `}
            >
              {object.type === "star" &&
                (language === "fr" ? "Étoile" : "Star")}
              {object.type === "planet" &&
                (language === "fr" ? "Planète" : "Planet")}
              {object.type === "system" &&
                (language === "fr" ? "Système" : "System")}
              {object.type === "nebula" &&
                (language === "fr" ? "Nébuleuse" : "Nebula")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Composant principal du panneau
export function ObjectPanel({
  objects,
  selectedObject,
  onObjectSelect,
  language,
  isMobile = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Filtrer les objets
  const filteredObjects = objects.filter((object) => {
    const matchesSearch =
      object.name[language]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      object.name.fr?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || object.type === filterType;
    return matchesSearch && matchesType;
  });

  // Types disponibles
  const availableTypes = [...new Set(objects.map((obj) => obj.type))];

  return (
    <div
      className={`
      h-full flex flex-col
      ${
        isMobile
          ? "p-4"
          : "bg-cosmic-black/80 backdrop-blur-md border-l border-neon-blue/20 p-6"
      }
    `}
    >
      {/* En-tête */}
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-xl font-bold text-lunar-white mb-4 font-exo">
          {language === "fr" ? "Objets Débloqués" : "Unlocked Objects"}
        </h2>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder={language === "fr" ? "Rechercher..." : "Search..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cosmic-black/60 border border-neon-blue/20 rounded-lg px-4 py-2 text-lunar-white placeholder-lunar-white/50 focus:border-neon-blue/50 focus:outline-none"
          />
          <svg
            className="absolute right-3 top-2.5 w-4 h-4 text-lunar-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filtre par type */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${
                filterType === "all"
                  ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/50"
                  : "bg-cosmic-black/60 text-lunar-white/70 border border-neon-blue/20 hover:border-neon-blue/40"
              }
            `}
          >
            {language === "fr" ? "Tous" : "All"}
          </button>

          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${
                  filterType === type
                    ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/50"
                    : "bg-cosmic-black/60 text-lunar-white/70 border border-neon-blue/20 hover:border-neon-blue/40"
                }
              `}
            >
              {type === "star" && (language === "fr" ? "Étoiles" : "Stars")}
              {type === "planet" &&
                (language === "fr" ? "Planètes" : "Planets")}
              {type === "system" &&
                (language === "fr" ? "Systèmes" : "Systems")}
              {type === "nebula" &&
                (language === "fr" ? "Nébuleuses" : "Nebulae")}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des objets */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-2 -mr-2">
        <AnimatePresence>
          {filteredObjects.length > 0 ? (
            filteredObjects.map((object) => (
              <motion.div
                key={object.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <ObjectCard
                  object={object}
                  isSelected={selectedObject === object.id}
                  onSelect={onObjectSelect}
                  language={language}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="text-lunar-white/50 mb-2">
                <svg
                  className="w-12 h-12 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-lunar-white/70 text-sm">
                {language === "fr" ? "Aucun objet trouvé" : "No objects found"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Statistiques */}
      <div className="flex-shrink-0 mt-6 pt-4 border-t border-neon-blue/20">
        <div className="text-center">
          <p className="text-lunar-white/70 text-sm">
            {language === "fr"
              ? `${filteredObjects.length} objet${
                  filteredObjects.length > 1 ? "s" : ""
                } affiché${filteredObjects.length > 1 ? "s" : ""}`
              : `${filteredObjects.length} object${
                  filteredObjects.length > 1 ? "s" : ""
                } displayed`}
          </p>
          <p className="text-lunar-white/50 text-xs mt-1">
            {language === "fr"
              ? `${objects.length} total débloqué${
                  objects.length > 1 ? "s" : ""
                }`
              : `${objects.length} total unlocked`}
          </p>
        </div>
      </div>
    </div>
  );
}
