export const aiService = {
  generateLearningPath: async (userProfile, availableModules) => {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: userProfile, availableModules }),
      });
      if (!response.ok) throw new Error("Erreur IA: " + response.status);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error generating learning path:", error);
      return { success: false, error: error.message };
    }
  },
};
