"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  {
    id: 1,
    title: "Visualisation Interactive",
    description:
      "Explorez vos données de manière intuitive avec des visualisations interactives",
  },
  {
    id: 2,
    title: "Analyse en Temps Réel",
    description:
      "Obtenez des insights instantanés grâce à notre moteur d'analyse avancé",
  },
  {
    id: 3,
    title: "Personnalisation",
    description: "Adaptez l'interface selon vos besoins et préférences",
  },
];

const FeatureCard = ({ title, description }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white/10 p-6 rounded-lg"
  >
    <h3 className="text-xl font-bold mb-4">{title}</h3>
    <p>{description}</p>
  </motion.div>
);

const CTAButton = () => (
  <motion.div whileHover={{ scale: 1.1 }}>
    <Link
      href="/app"
      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-300"
    >
      Commencer maintenant
    </Link>
  </motion.div>
);

export default function DynamicContent() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-16 text-center"
      >
        <h2 className="text-3xl font-bold mb-4">
          Une nouvelle façon d'apprendre
        </h2>
        <p className="text-lg text-gray-300">
          Découvrez une approche innovante de l'apprentissage spatial
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>

      <div className="text-center">
        <CTAButton />
      </div>
    </>
  );
}
