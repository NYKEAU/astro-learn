"use client";

import { useEffect } from "react";

export default function BackgroundEffects() {
  useEffect(() => {
    const canvas = document.getElementById("starsCanvas");
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial stars array
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2,
      opacity: Math.random(),
      speed: 0.005 + Math.random() * 0.008,
    }));

    window.addEventListener("resize", resize);
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        // Update star opacity for twinkling effect
        star.opacity += star.speed;
        if (star.opacity > 1) {
          star.opacity = 0;
        }

        // Draw star
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      id="starsCanvas"
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]"
      style={{ background: "linear-gradient(to bottom, #0f172a, #1e293b)" }}
    />
  );
}
