import { db } from "@/lib/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const profileService = {
  createUserProfile: async (userId, profileData) => {
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        ...profileData,
        createdAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error creating profile:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  getUserProfile: async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return {
          success: true,
          data: userSnap.data(),
        };
      }
      return {
        success: false,
        error: "Profile not found",
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
