import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration conditionnelle pour l'export Firebase
const isFirebaseExport = process.env.FIREBASE_EXPORT === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Configuration conditionnelle pour Firebase Hosting
  ...(isFirebaseExport && {
    output: "export",
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: "out",
  }),

  // Désactiver le cache temporairement pour résoudre les problèmes
  staticPageGenerationTimeout: 180,
  onDemandEntries: {
    // période (en ms) où les pages générées seront conservées en mémoire
    maxInactiveAge: 60 * 1000,
    // nombre de pages à conserver en mémoire
    pagesBufferLength: 5,
  },

  // Configuration des headers pour CORS (désactivé en mode export)
  async headers() {
    if (isFirebaseExport) return [];

    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },

  // Configuration des rewrites pour proxy Firebase Storage (désactivé en mode export)
  async rewrites() {
    if (isFirebaseExport) return [];

    return [
      {
        source: "/api/proxy-model/:path*",
        destination: "https://firebasestorage.googleapis.com/:path*",
      },
    ];
  },

  // Configuration webpack
  webpack: (config) => {
    // Configurez les alias
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(__dirname, "src"),
    };

    // Règle pour les fichiers SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  // Configuration des images
  images: {
    domains: ["firebasestorage.googleapis.com", "placekitten.com"],
    ...(isFirebaseExport && {
      unoptimized: true,
    }),
  },

  // Configuration pour l'export statique
  ...(isFirebaseExport && {
    experimental: {
      missingSuspenseWithCSRBailout: false,
    },
  }),

  // Désactiver ESLint temporairement pour le build de prod
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Désactiver TypeScript check temporairement
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    // Activer le App Router
    appDir: true,
  },

  images: {
    domains: ["firebasestorage.googleapis.com", "lh3.googleusercontent.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Optimisations de build
  swcMinify: true,
  output: "standalone",

  // Headers CORS pour les modèles 3D
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },

  // Réécritures pour supporter les fichiers modèles 3D
  async rewrites() {
    return [
      {
        source: "/models/:path*",
        destination: "/api/proxy-model/:path*",
      },
    ];
  },

  // Configuration webpack pour supporter les ressources GLTF
  webpack: (config, { isServer }) => {
    // Support pour les fichiers .glb et .gltf
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: {
        loader: "file-loader",
        options: {
          publicPath: "/_next/static/models/",
          outputPath: `${isServer ? "../" : ""}static/models/`,
        },
      },
    });

    return config;
  },
};

export default nextConfig;
