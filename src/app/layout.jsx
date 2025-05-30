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
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
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
