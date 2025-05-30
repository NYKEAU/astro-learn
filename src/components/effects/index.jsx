"use client";

import dynamic from "next/dynamic";

export const BackgroundEffects = dynamic(() => import("./BackgroundEffects"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-900 to-black" />
  ),
});

export const GrainEffect = dynamic(() => import("./GrainEffect"), {
  ssr: false,
  loading: () => null,
});
