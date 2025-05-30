export const metadata = {
  title: "Inscription | Astro Learn",
  description:
    "Créez votre profil d'apprentissage personnalisé pour l'astronomie",
};

export default function RegisterLayout({ children }) {
  return (
    <div className="bg-cover bg-center bg-no-repeat min-h-screen">
      {children}
    </div>
  );
}
