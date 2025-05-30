const STORAGE_KEY = "astronomy_registration";

export const registrationService = {
  saveRegistration: (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error saving registration:", error);
      return false;
    }
  },

  getRegistration: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error retrieving registration:", error);
      return null;
    }
  },

  clearRegistration: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing registration:", error);
      return false;
    }
  },
};
