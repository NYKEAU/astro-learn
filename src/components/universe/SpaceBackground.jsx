"use client";

import { useEffect, useRef } from "react";

export function SpaceBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const stars = [];
    const numStars = 200;

    // Redimensionner le canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Créer les étoiles
    const createStars = () => {
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
        });
      }
    };

    // Animer les étoiles
    const animateStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        // Effet de scintillement
        star.opacity += star.twinkleSpeed;
        if (star.opacity > 1 || star.opacity < 0.2) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        // Dessiner l'étoile
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animateStars);
    };

    // Initialiser
    resizeCanvas();
    createStars();
    animateStars();

    // Gérer le redimensionnement
    window.addEventListener("resize", () => {
      resizeCanvas();
      createStars();
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      {/* Dégradé de fond */}
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic-black via-cosmic-purple/20 to-cosmic-black" />

      {/* Canvas pour les étoiles animées */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-60"
        style={{ pointerEvents: "none" }}
      />

      {/* Nébuleuses subtiles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-neon-pink/5 rounded-full blur-3xl" />
      <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-cosmic-purple/5 rounded-full blur-3xl" />
    </div>
  );
}
