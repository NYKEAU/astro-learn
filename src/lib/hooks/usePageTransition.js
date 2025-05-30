import { useRouter } from "next/navigation";

export const usePageTransition = () => {
  const router = useRouter();

  const navigateToProfile = () => {
    // Ajouter une classe ou un état pour indiquer la direction de transition
    sessionStorage.setItem("pageTransition", "toProfile");
    router.push("/profile");
  };

  const navigateToSettings = () => {
    // Ajouter une classe ou un état pour indiquer la direction de transition
    sessionStorage.setItem("pageTransition", "toSettings");
    router.push("/settings");
  };

  const navigateToDashboard = () => {
    sessionStorage.setItem("pageTransition", "toDashboard");
    router.push("/dashboard");
  };

  const getTransitionDirection = () => {
    if (typeof window !== "undefined") {
      const direction = sessionStorage.getItem("pageTransition");
      sessionStorage.removeItem("pageTransition"); // Nettoyer après utilisation
      return direction;
    }
    return null;
  };

  return {
    navigateToProfile,
    navigateToSettings,
    navigateToDashboard,
    getTransitionDirection,
  };
};
