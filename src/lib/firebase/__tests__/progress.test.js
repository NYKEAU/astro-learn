/**
 * Tests unitaires pour la logique de progression des exercices
 * @jest-environment node
 */

// Mock la configuration Firebase
jest.mock("../config", () => ({
  db: {
    type: "mocked-db",
    name: "test-firestore",
  },
}));

// Mock Firestore avec des fonctions de base
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "mocked-timestamp"),
}));

// Import après les mocks
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import {
  initializeModuleProgress,
  saveExerciseAnswer,
  getModuleProgress,
  getExerciseAnswer,
  getPartAnswers,
  markModuleCompleted,
  getAllModulesProgress,
  validateProgressStructure,
} from "../progress";

// Données de test persistantes
let mockFirestoreData = {};

// Helper pour nettoyer les données Firestore simulées
function clearFirestoreData() {
  mockFirestoreData = {};
  console.log("🧹 Données Firestore nettoyées");
}

// Helper pour créer une référence de document mockée
function createMockDocRef(path) {
  return {
    path,
    id: path.split("/").pop(),
    parent: { id: path.split("/").slice(-2, -1)[0] },
  };
}

// Helper pour simuler getDoc
function mockGetDocImplementation(docRef) {
  const data = mockFirestoreData[docRef.path];
  return Promise.resolve({
    exists: () => !!data,
    data: () => data || null,
    id: docRef.id,
    ref: docRef,
  });
}

// Helper pour simuler setDoc
function mockSetDocImplementation(docRef, data) {
  mockFirestoreData[docRef.path] = { ...data };
  console.log(`💾 setDoc simulé pour ${docRef.path}:`, data);
  return Promise.resolve();
}

// Helper pour simuler updateDoc
function mockUpdateDocImplementation(docRef, data) {
  if (mockFirestoreData[docRef.path]) {
    mockFirestoreData[docRef.path] = {
      ...mockFirestoreData[docRef.path],
      ...data,
    };
    console.log(`🔄 updateDoc simulé pour ${docRef.path}:`, data);
  } else {
    console.error(
      `❌ Tentative d'update sur un document inexistant: ${docRef.path}`
    );
  }
  return Promise.resolve();
}

describe("Progress Management", () => {
  const mockUserId = "test-user-123";
  const mockModuleId = "1";
  const mockPartId = "part1";
  const mockExerciseId = "ex1";

  beforeEach(() => {
    // Nettoyer les données entre chaque test
    clearFirestoreData();

    // Reset tous les mocks
    jest.clearAllMocks();

    // Configurer les mocks avec des implémentations réalistes
    doc.mockImplementation((db, ...pathSegments) => {
      const path = pathSegments.join("/");
      return createMockDocRef(path);
    });

    getDoc.mockImplementation(mockGetDocImplementation);
    setDoc.mockImplementation(mockSetDocImplementation);
    updateDoc.mockImplementation(mockUpdateDocImplementation);
  });

  afterEach(() => {
    // Nettoyage final après chaque test
    clearFirestoreData();
  });

  describe("initializeModuleProgress", () => {
    test("should initialize new module progress", async () => {
      const result = await initializeModuleProgress(mockUserId, mockModuleId);

      expect(result).toBe(true);
      expect(setDoc).toHaveBeenCalled();

      // Vérifier que les données ont été sauvegardées
      const savedData =
        mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`];
      expect(savedData).toMatchObject({
        moduleId: mockModuleId,
        parts: {},
        completedExercises: [],
        totalExercises: 0,
        score: 0,
        percentage: 0,
        completed: false,
        completedAt: null,
      });
    });

    test("should not overwrite existing progress", async () => {
      // Pré-remplir avec des données existantes
      const existingData = {
        moduleId: mockModuleId,
        score: 5,
        completed: true,
      };
      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        existingData;

      const result = await initializeModuleProgress(mockUserId, mockModuleId);

      expect(result).toBe(true);
      expect(setDoc).not.toHaveBeenCalled();

      // Vérifier que les données existantes n'ont pas été modifiées
      const currentData =
        mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`];
      expect(currentData).toEqual(existingData);
    });

    test("should handle missing parameters", async () => {
      const result = await initializeModuleProgress(null, mockModuleId);
      expect(result).toBe(false);
    });
  });

  describe("saveExerciseAnswer", () => {
    beforeEach(() => {
      // Initialiser une progression de base pour les tests
      const baseProgressData = {
        moduleId: mockModuleId,
        parts: {},
        completedExercises: [],
        totalExercises: 0,
        score: 0,
        percentage: 0,
        completed: false,
        startedAt: "2023-12-01T00:00:00.000Z",
        lastUpdated: "2023-12-01T00:00:00.000Z",
        completedAt: null,
      };
      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        baseProgressData;
    });

    test("should save new correct answer", async () => {
      const result = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        mockPartId,
        mockExerciseId,
        "correct answer",
        true
      );

      expect(result).toBeTruthy();
      expect(result.parts[mockPartId][mockExerciseId]).toMatchObject({
        userAnswer: "correct answer",
        isCorrect: true,
        timestamp: expect.any(String),
      });
      expect(result.score).toBe(1);
      expect(result.completedExercises).toContain(mockExerciseId);
      expect(result.percentage).toBe(100); // 1/1 = 100%
      expect(result.completed).toBe(true); // 100% >= 80%
    });

    test("should save new incorrect answer", async () => {
      const result = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        mockPartId,
        mockExerciseId,
        "wrong answer",
        false
      );

      expect(result).toBeTruthy();
      expect(result.parts[mockPartId][mockExerciseId]).toMatchObject({
        userAnswer: "wrong answer",
        isCorrect: false,
        timestamp: expect.any(String),
      });
      expect(result.score).toBe(0);
      expect(result.completedExercises).toContain(mockExerciseId);
      expect(result.percentage).toBe(0); // 0/1 = 0%
      expect(result.completed).toBe(false); // 0% < 80%
    });

    test("should update existing answer from wrong to correct", async () => {
      // D'abord ajouter une réponse incorrecte
      const existingProgressData = {
        moduleId: mockModuleId,
        parts: {
          [mockPartId]: {
            [mockExerciseId]: {
              userAnswer: "wrong answer",
              isCorrect: false,
              timestamp: "2023-01-01T00:00:00.000Z",
            },
          },
        },
        completedExercises: [mockExerciseId],
        totalExercises: 1,
        score: 0,
        percentage: 0,
        completed: false,
        startedAt: "2023-12-01T00:00:00.000Z",
        lastUpdated: "2023-12-01T00:00:00.000Z",
        completedAt: null,
      };
      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        existingProgressData;

      const result = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        mockPartId,
        mockExerciseId,
        "correct answer",
        true
      );

      expect(result).toBeTruthy();
      expect(result.score).toBe(1); // Score devrait augmenter
      expect(result.parts[mockPartId][mockExerciseId].isCorrect).toBe(true);
      expect(result.percentage).toBe(100); // 1/1 = 100%
      expect(result.completed).toBe(true); // 100% >= 80%
    });

    test("should update existing answer from correct to wrong", async () => {
      const existingProgressData = {
        moduleId: mockModuleId,
        parts: {
          [mockPartId]: {
            [mockExerciseId]: {
              userAnswer: "correct answer",
              isCorrect: true,
              timestamp: "2023-01-01T00:00:00.000Z",
            },
          },
        },
        completedExercises: [mockExerciseId],
        totalExercises: 1,
        score: 1,
        percentage: 100,
        completed: true,
        startedAt: "2023-12-01T00:00:00.000Z",
        lastUpdated: "2023-12-01T00:00:00.000Z",
        completedAt: "2023-12-01T00:00:00.000Z",
      };
      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        existingProgressData;

      const result = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        mockPartId,
        mockExerciseId,
        "wrong answer",
        false
      );

      expect(result).toBeTruthy();
      expect(result.score).toBe(0); // Score devrait diminuer
      expect(result.parts[mockPartId][mockExerciseId].isCorrect).toBe(false);
      expect(result.percentage).toBe(0); // 0/1 = 0%
      expect(result.completed).toBe(false); // 0% < 80%
    });

    test("should mark module as completed when score reaches 80%", async () => {
      const progressData = {
        moduleId: mockModuleId,
        parts: {},
        completedExercises: ["ex1", "ex2", "ex3", "ex4"],
        totalExercises: 5,
        score: 3, // 60%
        percentage: 60,
        completed: false,
        startedAt: "2023-12-01T00:00:00.000Z",
        lastUpdated: "2023-12-01T00:00:00.000Z",
        completedAt: null,
      };
      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        progressData;

      const result = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        mockPartId,
        "ex5",
        "correct answer",
        true
      );

      expect(result).toBeTruthy();
      expect(result.score).toBe(4); // Score: 3 + 1 = 4
      expect(result.percentage).toBe(80); // 4/5 = 80%
      expect(result.completed).toBe(true); // 80% >= 80%
      expect(result.completedAt).toBeTruthy();
    });

    test("should handle missing parameters", async () => {
      const result = await saveExerciseAnswer(
        null,
        mockModuleId,
        mockPartId,
        mockExerciseId,
        "answer",
        true
      );
      expect(result).toBeNull();
    });
  });

  describe("getModuleProgress", () => {
    test("should retrieve existing progress", async () => {
      const mockData = { moduleId: mockModuleId, score: 5 };
      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        mockData;

      const result = await getModuleProgress(mockUserId, mockModuleId);

      expect(result).toEqual(mockData);
    });

    test("should return null for non-existing progress", async () => {
      const result = await getModuleProgress(mockUserId, mockModuleId);

      expect(result).toBeNull();
    });
  });

  describe("getExerciseAnswer", () => {
    test("should retrieve specific exercise answer", async () => {
      const exerciseAnswer = {
        userAnswer: "test answer",
        isCorrect: true,
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const mockData = {
        parts: {
          [mockPartId]: {
            [mockExerciseId]: exerciseAnswer,
          },
        },
      };

      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        mockData;

      const result = await getExerciseAnswer(
        mockUserId,
        mockModuleId,
        mockPartId,
        mockExerciseId
      );

      expect(result).toEqual(exerciseAnswer);
    });

    test("should return null for non-existing exercise", async () => {
      const mockData = { parts: {} };
      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        mockData;

      const result = await getExerciseAnswer(
        mockUserId,
        mockModuleId,
        mockPartId,
        mockExerciseId
      );

      expect(result).toBeNull();
    });
  });

  describe("getPartAnswers", () => {
    test("should retrieve all answers for a part", async () => {
      const partAnswers = {
        ex1: {
          userAnswer: "answer1",
          isCorrect: true,
          timestamp: "2023-01-01T00:00:00.000Z",
        },
        ex2: {
          userAnswer: "answer2",
          isCorrect: false,
          timestamp: "2023-01-01T00:01:00.000Z",
        },
      };

      const mockData = {
        parts: {
          [mockPartId]: partAnswers,
        },
      };

      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        mockData;

      const result = await getPartAnswers(mockUserId, mockModuleId, mockPartId);

      expect(result).toEqual(partAnswers);
    });
  });

  describe("markModuleCompleted", () => {
    test("should mark module as completed", async () => {
      const mockData = {
        moduleId: mockModuleId,
        score: 8,
        percentage: 80,
        completed: false,
      };
      mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`] =
        mockData;

      const result = await markModuleCompleted(mockUserId, mockModuleId, 10);

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalled();

      // Vérifier que les données ont été mises à jour
      const updatedData =
        mockFirestoreData[`users/${mockUserId}/progress/${mockModuleId}`];
      expect(updatedData).toMatchObject({
        completed: true,
        percentage: 100,
        score: 10,
      });
    });

    test("should handle non-existing progress", async () => {
      const result = await markModuleCompleted(mockUserId, mockModuleId);

      expect(result).toBe(false);
    });
  });

  describe("validateProgressStructure", () => {
    test("should validate correct structure", () => {
      const validProgress = {
        moduleId: "1",
        parts: {},
        completedExercises: [],
        score: 0,
        percentage: 0,
        completed: false,
      };

      const result = validateProgressStructure(validProgress);
      expect(result).toBe(true);
    });

    test("should reject invalid structure", () => {
      const invalidProgress = {
        moduleId: "1",
        // missing required fields
      };

      const result = validateProgressStructure(invalidProgress);
      expect(result).toBe(false);
    });

    test("should reject non-object input", () => {
      const result = validateProgressStructure(null);
      expect(result).toBe(false);
    });
  });

  describe("Integration Tests", () => {
    test("should handle complete user journey through a module", async () => {
      // Initialisation du module
      await initializeModuleProgress(mockUserId, mockModuleId);

      // Vérifier que le module a été initialisé
      let progress = await getModuleProgress(mockUserId, mockModuleId);
      expect(progress).toBeTruthy();
      expect(progress.score).toBe(0);
      expect(progress.completed).toBe(false);

      // Simulation d'un module avec 5 exercices
      // Exercice 1: correct
      const result1 = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        "part1",
        "ex1",
        "answer1",
        true,
        5 // Total de 5 exercices
      );
      expect(result1).toBeTruthy();
      expect(result1.score).toBe(1);
      expect(result1.percentage).toBe(20); // 1/5 = 20%
      expect(result1.completed).toBe(false); // 20% < 80%

      // Exercice 2: incorrect
      const result2 = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        "part1",
        "ex2",
        "wrong answer",
        false,
        5
      );
      expect(result2).toBeTruthy();
      expect(result2.score).toBe(1); // Reste à 1
      expect(result2.percentage).toBe(20); // 1/5 = 20%
      expect(result2.completed).toBe(false);

      // Exercice 3: correct
      const result3 = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        "part2",
        "ex3",
        "answer3",
        true,
        5
      );
      expect(result3).toBeTruthy();
      expect(result3.score).toBe(2);
      expect(result3.percentage).toBe(40); // 2/5 = 40%
      expect(result3.completed).toBe(false);

      // Exercice 4: correct
      const result4 = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        "part2",
        "ex4",
        "answer4",
        true,
        5
      );
      expect(result4).toBeTruthy();
      expect(result4.score).toBe(3);
      expect(result4.percentage).toBe(60); // 3/5 = 60%
      expect(result4.completed).toBe(false);

      // Exercice 5: correct - devrait déclencher la complétion (4/5 = 80%)
      const result5 = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        "part2",
        "ex5",
        "answer5",
        true,
        5
      );
      expect(result5).toBeTruthy();
      expect(result5.score).toBe(4);
      expect(result5.percentage).toBe(80); // 4/5 = 80%
      expect(result5.completed).toBe(true); // 80% >= 80%
      expect(result5.completedAt).toBeTruthy();

      // Correction de l'exercice 2 (de incorrect à correct)
      const result6 = await saveExerciseAnswer(
        mockUserId,
        mockModuleId,
        "part1",
        "ex2",
        "corrected answer",
        true,
        5
      );
      expect(result6).toBeTruthy();
      expect(result6.score).toBe(5); // Tous les exercices corrects
      expect(result6.percentage).toBe(100); // 5/5 = 100%
      expect(result6.completed).toBe(true);

      // Vérifier l'état final
      progress = await getModuleProgress(mockUserId, mockModuleId);
      expect(progress.score).toBe(5);
      expect(progress.percentage).toBe(100);
      expect(progress.completed).toBe(true);
      expect(progress.completedExercises).toHaveLength(5);
      expect(progress.completedExercises).toContain("ex1");
      expect(progress.completedExercises).toContain("ex2");
      expect(progress.completedExercises).toContain("ex3");
      expect(progress.completedExercises).toContain("ex4");
      expect(progress.completedExercises).toContain("ex5");

      // Vérifier les réponses individuelles
      const ex1Answer = await getExerciseAnswer(
        mockUserId,
        mockModuleId,
        "part1",
        "ex1"
      );
      expect(ex1Answer).toMatchObject({
        userAnswer: "answer1",
        isCorrect: true,
      });

      const ex2Answer = await getExerciseAnswer(
        mockUserId,
        mockModuleId,
        "part1",
        "ex2"
      );
      expect(ex2Answer).toMatchObject({
        userAnswer: "corrected answer",
        isCorrect: true,
      });

      // Vérifier les réponses d'une partie
      const part1Answers = await getPartAnswers(
        mockUserId,
        mockModuleId,
        "part1"
      );
      expect(Object.keys(part1Answers)).toHaveLength(2);
      expect(part1Answers.ex1.isCorrect).toBe(true);
      expect(part1Answers.ex2.isCorrect).toBe(true);
    });

    test("should handle edge case: exactly 80% completion", async () => {
      await initializeModuleProgress(mockUserId, mockModuleId);

      // Module avec 10 exercices - 8 corrects = exactement 80%
      const totalExercises = 10;
      const correctAnswers = 8;

      // Sauvegarder 8 réponses correctes
      for (let i = 1; i <= correctAnswers; i++) {
        const result = await saveExerciseAnswer(
          mockUserId,
          mockModuleId,
          "part1",
          `ex${i}`,
          `answer${i}`,
          true,
          totalExercises
        );

        if (i === correctAnswers) {
          // Le 8ème exercice devrait déclencher la complétion
          expect(result.score).toBe(correctAnswers);
          expect(result.percentage).toBe(80);
          expect(result.completed).toBe(true);
        }
      }

      // Sauvegarder 2 réponses incorrectes
      for (let i = correctAnswers + 1; i <= totalExercises; i++) {
        const result = await saveExerciseAnswer(
          mockUserId,
          mockModuleId,
          "part1",
          `ex${i}`,
          `wrong answer${i}`,
          false,
          totalExercises
        );

        expect(result.score).toBe(correctAnswers); // Score reste à 8
        expect(result.percentage).toBe(80); // 8/10 = 80%
        expect(result.completed).toBe(true); // Reste complété
      }
    });
  });
});
