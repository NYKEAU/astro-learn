"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function DashboardChart() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Simuler des données de graphique
    const data = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * (height * 0.8))
    );

    // Dessiner le graphique
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, height - data[0]);

    data.forEach((value, index) => {
      const x = (width / (data.length - 1)) * index;
      const y = height - value;
      ctx.lineTo(x, y);
    });

    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800/30 p-4 rounded-lg"
    >
      <h3 className="text-xl font-medium mb-4">Learning Progress</h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="w-full h-auto"
      />
    </motion.div>
  );
}
