import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

const CosmicDashboard = () => {
  const { language } = useLanguage();

  // Contenus des modules
  const modules = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-neon-blue"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
      title: {
        fr: "Explorer l'espace en 3D",
        en: "Explore space in 3D",
      },
      description: {
        fr: "Manipulez planètes, étoiles et galaxies en 3D. Ces modèles interactifs vous permettent d'observer les détails et de comprendre les phénomènes astronomiques.",
        en: "Manipulate planets, stars and galaxies in 3D. These interactive models allow you to observe details and understand astronomical phenomena.",
      },
      features: [
        {
          fr: "Visualisation haute précision",
          en: "High precision visualization",
        },
        {
          fr: "Simulation de phénomènes",
          en: "Phenomena simulation",
        },
        {
          fr: "Création d'hypothèses",
          en: "Hypothesis creation",
        },
      ],
      color: "neon-blue",
      hoverBg: "bg-neon-blue/5",
      borderHover: "hover:border-neon-blue/40",
      iconBg: "bg-neon-blue/10",
      textColor: "text-neon-blue",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-cosmic-purple"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      title: {
        fr: "Apprenez en immersion totale",
        en: "Learn in total immersion",
      },
      description: {
        fr: "Plongez dans un documentaire spatial grâce à notre réalité augmentée. Explorez les phénomènes depuis votre espace et interagissez avec pour mémoriser efficacement.",
        en: "Dive into a space documentary thanks to our augmented reality. Explore phenomena from your space and interact with them to memorize effectively.",
      },
      features: [
        {
          fr: "Simulation environnementale",
          en: "Environmental simulation",
        },
        {
          fr: "Interaction tactile avancée",
          en: "Advanced tactile interaction",
        },
        {
          fr: "Données scientifiques réelles",
          en: "Real scientific data",
        },
      ],
      color: "cosmic-purple",
      hoverBg: "bg-cosmic-purple/5",
      borderHover: "hover:border-cosmic-purple/40",
      iconBg: "bg-cosmic-purple/10",
      textColor: "text-cosmic-purple",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-neon-blue"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      title: {
        fr: "Testez vos connaissances",
        en: "Test your knowledge",
      },
      description: {
        fr: "Validez votre apprentissage avec nos quiz interactifs et défis engageants. Progressez à votre rythme, recevez des recommandations personnalisées pour approfondir vos connaissances.",
        en: "Validate your learning with our interactive quizzes and engaging challenges. Progress at your own pace, receive personalized recommendations to deepen your knowledge.",
      },
      features: [
        {
          fr: "Adaptation au niveau",
          en: "Level adaptation",
        },
        {
          fr: "Analyse des performances",
          en: "Performance analysis",
        },
        {
          fr: "Parcours personnalisé",
          en: "Personalized journey",
        },
      ],
      color: "neon-blue",
      hoverBg: "bg-neon-blue/5",
      borderHover: "hover:border-neon-blue/40",
      iconBg: "bg-neon-blue/10",
      textColor: "text-neon-blue",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {modules.map((module, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
            }}
            className="relative bg-cosmic-black/60 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden group transition-all"
            whileHover={{
              y: -3,
              transition: {
                type: "spring",
                stiffness: 500,
                damping: 30,
                duration: 0.2,
              },
            }}
            whileTap={{ y: 0 }}
          >
            {/* Effet de lueur au survol */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${module.hoverBg}`}
            ></div>

            {/* Bordure supérieure colorée */}
            <div
              className={`absolute top-0 left-0 right-0 h-[2px] ${module.textColor} opacity-40`}
            ></div>

            {/* Haut de la carte avec l'icône et le titre */}
            <div className="flex items-center p-4 border-b border-gray-800 relative z-10">
              <div className={`p-2 rounded-lg ${module.iconBg} mr-3`}>
                {module.icon}
              </div>
              <h3 className="text-xl font-bold font-exo text-lunar-white group-hover:text-white transition-colors">
                {module.title[language]}
              </h3>
            </div>

            {/* Contenu */}
            <div className="p-5 relative z-10">
              <p className="text-lunar-white/70 font-jetbrains text-sm leading-relaxed mb-5 group-hover:text-lunar-white/90 transition-colors">
                {module.description[language]}
              </p>

              {/* Fonctionnalités */}
              <div className={`${module.textColor} text-sm font-medium mb-3`}>
                {language === "fr" ? "Fonctionnalités" : "Features"}
              </div>
              <ul className="space-y-3">
                {module.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span
                      className={`inline-flex items-center justify-center h-5 w-5 rounded-full ${module.iconBg} ${module.textColor} text-xs flex-shrink-0 mt-0.5`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-lunar-white/70 font-jetbrains group-hover:text-lunar-white/90 transition-colors">
                      {feature[language]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CosmicDashboard;
