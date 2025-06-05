import { Inter, Exo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import ClientOnly from "@/components/ui/ClientOnly";
import { RouteGuard } from "@/components/auth/RouteGuard";

const exo = Exo({
  subsets: ["latin"],
  variable: "--font-exo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "Astro Learn - Plateforme d'apprentissage de l'astronomie",
  description: "Découvrez l'univers fascinant de l'astronomie avec Astro Learn",
  keywords: [
    "astronomie",
    "apprentissage",
    "espace",
    "étoiles",
    "planètes",
    "univers",
    "éducation",
  ],
  authors: [{ name: "AstroLearn Team" }],
  creator: "AstroLearn",
  publisher: "AstroLearn",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/Logo Final NT.png?v=2",
    shortcut: "/Logo Final NT.png?v=2",
    apple: "/Logo Final NT.png?v=2",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://astrolearn.nicolaslhommeau.com",
    title: "AstroLearn - Plateforme d'apprentissage de l'astronomie",
    description:
      "Découvrez l'univers fascinant de l'astronomie avec AstroLearn. Explorez les étoiles, planètes et mystères du cosmos dans un parcours d'apprentissage interactif.",
    siteName: "AstroLearn",
    images: [
      {
        url: "/Logo Final NT.png",
        width: 1200,
        height: 630,
        alt: "AstroLearn - Plateforme d'apprentissage de l'astronomie",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AstroLearn - Plateforme d'apprentissage de l'astronomie",
    description:
      "Découvrez l'univers fascinant de l'astronomie avec AstroLearn",
    images: ["/Logo Final NT.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link
          rel="icon"
          href="/Logo Final NT.png?v=2"
          type="image/png"
          sizes="any"
        />
        <link
          rel="shortcut icon"
          href="/Logo Final NT.png?v=2"
          type="image/png"
        />
        <link rel="apple-touch-icon" href="/Logo Final NT.png?v=2" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/Logo Final NT.png?v=2"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#00D4FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AstroLearn" />
      </head>
      <body
        className={`${exo.variable} ${jetbrainsMono.variable} font-sans bg-cosmic-black min-h-screen`}
      >
        <div className="stars-container fixed inset-0 overflow-hidden z-0">
          {/* Génération d'étoiles avec animation ralentie */}
          {Array.from({ length: 100 }).map((_, i) => {
            // Taille aléatoire entre 1 et 3 pixels
            const size = Math.random() * 2 + 1;

            // Durée d'animation plus longue (entre 8 et 15 secondes)
            const duration = Math.random() * 7 + 8;

            // Délai plus long (entre 0 et 10 secondes)
            const delay = Math.random() * 10;

            return (
              <div
                key={i}
                className="star"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  "--duration": `${duration}s`,
                  "--delay": `${delay}s`,
                }}
              />
            );
          })}
        </div>
        <main className="relative z-10">
          <Providers>
            <ClientOnly>
              <RouteGuard>{children}</RouteGuard>
            </ClientOnly>
          </Providers>
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
