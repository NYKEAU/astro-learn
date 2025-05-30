import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Désactiver le cache temporairement pour résoudre les problèmes
  staticPageGenerationTimeout: 180,
  onDemandEntries: {
    // période (en ms) où les pages générées seront conservées en mémoire
    maxInactiveAge: 60 * 1000,
    // nombre de pages à conserver en mémoire
    pagesBufferLength: 5,
  },

  // Configuration webpack
  webpack: (config) => {
    // Configurez les alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };

    // Règle pour les fichiers SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Configuration des images
  images: {
    domains: ['firebasestorage.googleapis.com', 'placekitten.com'],
  },
};

export default nextConfig;
