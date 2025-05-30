// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Configuration globale pour les tests Firebase
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global pour les tests Firebase
global.mockFirestoreData = {};

// Helper globaux pour les tests Firebase
global.clearFirestoreData = function () {
  global.mockFirestoreData = {};
};

// Configuration par défaut pour les tests Firebase
beforeEach(() => {
  // Nettoyer les données entre les tests
  if (global.clearFirestoreData) {
    global.clearFirestoreData();
  }
});

// Nettoyage final après chaque test
afterEach(() => {
  // S'assurer qu'il n'y a pas de fuites de données entre les tests
  if (global.clearFirestoreData) {
    global.clearFirestoreData();
  }
});
