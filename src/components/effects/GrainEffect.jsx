"use client";

import { useEffect } from "react";

export default function GrainEffect() {
  useEffect(() => {
    const canvas = document.getElementById("grainCanvas");
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createNoise = () => {
      if (!ctx) return;
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255 * 0.15;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    resize();
    createNoise();

    window.addEventListener("resize", () => {
      resize();
      createNoise();
    });

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      id="grainCanvas"
      className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-30 mix-blend-overlay"
    />
  );
}
