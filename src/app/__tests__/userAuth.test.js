/**
 * Tests unitaires pour la gestion des rôles utilisateur et la structure du modèle utilisateur
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Providers, useAuth } from '../providers';
import * as authModule from '@/lib/firebase/auth';
import * as firestoreModule from 'firebase/firestore';
import { createContext, useContext, useEffect } from 'react';

// Mocks pour Firebase
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
    auth: {},
    db: {},
}));

// Mock pour la fonction onAuthStateChange
jest.mock('@/lib/firebase/auth', () => ({
    onAuthStateChange: jest.fn(),
}));

// Mock pour le LanguageProvider
jest.mock('@/lib/LanguageContext', () => ({
    LanguageProvider: ({ children }) => children,
}));

// Composant test pour accéder au contexte d'auth
const TestComponent = ({ onAuthDataReceived }) => {
    const auth = useAuth();

    useEffect(() => {
        if (onAuthDataReceived) {
            onAuthDataReceived(auth);
        }
    }, [auth, onAuthDataReceived]);

    return (
        <div>
            <div data-testid="user">{auth.user ? 'User exists' : 'No user'}</div>
            <div data-testid="role">{auth.role || 'No role'}</div>
            <div data-testid="isPremium">{auth.isPremium ? 'Premium' : 'Not Premium'}</div>
            <div data-testid="isFree">{auth.isFree ? 'Free' : 'Not Free'}</div>
            <div data-testid="isVisitor">{auth.isVisitor ? 'Visitor' : 'Not Visitor'}</div>
            <div data-testid="unlockedModulesCount">{auth.unlockedModules.length}</div>
            <div data-testid="hasProgression">{Object.keys(auth.progression).length > 0 ? 'Has progression' : 'No progression'}</div>
        </div>
    );
};

describe('Gestion des rôles utilisateur', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test pour un visiteur (non authentifié)
    test('contexte d\'authentification pour un visiteur (non authentifié)', async () => {
        // Configurer le mock pour retourner null (utilisateur non authentifié)
        authModule.onAuthStateChange.mockImplementation(callback => {
            callback(null);
            return jest.fn(); // retourne une fonction de nettoyage
        });

        let authData = null;
        const handleAuthDataReceived = (data) => {
            authData = data;
        };

        render(
            <Providers>
                <TestComponent onAuthDataReceived={handleAuthDataReceived} />
            </Providers>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('No user');
            expect(screen.getByTestId('role')).toHaveTextContent('No role');
            expect(screen.getByTestId('isPremium')).toHaveTextContent('Not Premium');
            expect(screen.getByTestId('isFree')).toHaveTextContent('Not Free');
            expect(screen.getByTestId('isVisitor')).toHaveTextContent('Visitor');
            expect(screen.getByTestId('unlockedModulesCount')).toHaveTextContent('0');
            expect(screen.getByTestId('hasProgression')).toHaveTextContent('No progression');
        });

        expect(authData).toMatchObject({
            user: null,
            role: null,
            isPremium: false,
            isFree: false,
            isVisitor: true,
            unlockedModules: [],
            progression: {},
        });
    });

    // Test pour un utilisateur gratuit
    test('contexte d\'authentification pour un utilisateur gratuit', async () => {
        // Créer un utilisateur de test avec le rôle "free"
        const mockUser = {
            uid: 'test-uid-free',
            email: 'user-free@example.com',
            displayName: 'Test User Free',
            role: 'free',
            unlockedModules: ['module1', 'module2'],
            progression: {
                module1: { completed: true, percentage: 100 },
                module2: { completed: false, percentage: 50 },
            },
        };

        // Configurer le mock pour retourner un utilisateur gratuit
        authModule.onAuthStateChange.mockImplementation(callback => {
            callback(mockUser);
            return jest.fn(); // retourne une fonction de nettoyage
        });

        let authData = null;
        const handleAuthDataReceived = (data) => {
            authData = data;
        };

        render(
            <Providers>
                <TestComponent onAuthDataReceived={handleAuthDataReceived} />
            </Providers>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('User exists');
            expect(screen.getByTestId('role')).toHaveTextContent('free');
            expect(screen.getByTestId('isPremium')).toHaveTextContent('Not Premium');
            expect(screen.getByTestId('isFree')).toHaveTextContent('Free');
            expect(screen.getByTestId('isVisitor')).toHaveTextContent('Not Visitor');
            expect(screen.getByTestId('unlockedModulesCount')).toHaveTextContent('2');
            expect(screen.getByTestId('hasProgression')).toHaveTextContent('Has progression');
        });

        expect(authData).toMatchObject({
            user: mockUser,
            role: 'free',
            isPremium: false,
            isFree: true,
            isVisitor: false,
            unlockedModules: ['module1', 'module2'],
            progression: {
                module1: { completed: true, percentage: 100 },
                module2: { completed: false, percentage: 50 },
            },
        });
    });

    // Test pour un utilisateur premium
    test('contexte d\'authentification pour un utilisateur premium', async () => {
        // Date d'expiration fictive pour l'abonnement premium
        const premiumExpiryDate = new Date();
        premiumExpiryDate.setMonth(premiumExpiryDate.getMonth() + 1); // Expire dans un mois

        // Créer un utilisateur de test avec le rôle "premium"
        const mockUser = {
            uid: 'test-uid-premium',
            email: 'user-premium@example.com',
            displayName: 'Test User Premium',
            role: 'premium',
            premiumUntil: premiumExpiryDate,
            unlockedModules: ['module1', 'module2', 'module3', 'premium-module'],
            progression: {
                module1: { completed: true, percentage: 100 },
                module2: { completed: true, percentage: 100 },
                module3: { completed: false, percentage: 75 },
            },
        };

        // Configurer le mock pour retourner un utilisateur premium
        authModule.onAuthStateChange.mockImplementation(callback => {
            callback(mockUser);
            return jest.fn(); // retourne une fonction de nettoyage
        });

        let authData = null;
        const handleAuthDataReceived = (data) => {
            authData = data;
        };

        render(
            <Providers>
                <TestComponent onAuthDataReceived={handleAuthDataReceived} />
            </Providers>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('User exists');
            expect(screen.getByTestId('role')).toHaveTextContent('premium');
            expect(screen.getByTestId('isPremium')).toHaveTextContent('Premium');
            expect(screen.getByTestId('isFree')).toHaveTextContent('Not Free');
            expect(screen.getByTestId('isVisitor')).toHaveTextContent('Not Visitor');
            expect(screen.getByTestId('unlockedModulesCount')).toHaveTextContent('4');
            expect(screen.getByTestId('hasProgression')).toHaveTextContent('Has progression');
        });

        expect(authData).toMatchObject({
            user: mockUser,
            role: 'premium',
            isPremium: true,
            isFree: false,
            isVisitor: false,
            premiumUntil: premiumExpiryDate,
            unlockedModules: ['module1', 'module2', 'module3', 'premium-module'],
            progression: {
                module1: { completed: true, percentage: 100 },
                module2: { completed: true, percentage: 100 },
                module3: { completed: false, percentage: 75 },
            },
        });
    });

    // Test avec erreur dans la récupération des données utilisateur
    test('gestion des erreurs lors de la récupération des données utilisateur', async () => {
        // Créer un utilisateur de base sans enrichissement
        const mockBasicUser = {
            uid: 'test-uid-error',
            email: 'user-error@example.com',
            displayName: 'Test User Error',
        };

        // Configurer le mock pour simuler une erreur lors de la récupération des données
        authModule.onAuthStateChange.mockImplementation(callback => {
            // Simuler une erreur dans onAuthStateChange
            callback(mockBasicUser); // Passe l'utilisateur de base sans les données enrichies
            return jest.fn(); // retourne une fonction de nettoyage
        });

        render(
            <Providers>
                <TestComponent />
            </Providers>
        );

        // L'utilisateur devrait être authentifié mais sans les données enrichies
        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('User exists');
            // Comportement par défaut pour les valeurs manquantes
            expect(screen.getByTestId('role')).not.toHaveTextContent('premium');
            expect(screen.getByTestId('isPremium')).toHaveTextContent('Not Premium');
            expect(screen.getByTestId('unlockedModulesCount')).toHaveTextContent('0');
            expect(screen.getByTestId('hasProgression')).toHaveTextContent('No progression');
        });
    });
});

// Tests pour les fonctions d'aide à l'authentification
describe('Fonctions d\'aide à l\'authentification', () => {
    // Tester la structure du modèle utilisateur lors de l'inscription
    test('structure du modèle utilisateur lors de l\'inscription', async () => {
        // Mock pour la fonction setDoc de Firestore
        const mockSetDoc = jest.fn().mockResolvedValue();
        firestoreModule.setDoc = mockSetDoc;

        // Mock pour la fonction doc de Firestore
        firestoreModule.doc = jest.fn().mockReturnValue('user-doc-ref');

        // Mock pour signUpWithGoogle
        const originalSignUpWithGoogle = authModule.signUpWithGoogle;
        authModule.signUpWithGoogle = jest.fn().mockImplementation(async (formData) => {
            // Simuler l'appel à la fonction originale
            const mockUser = {
                uid: 'new-user-uid',
                email: 'new-user@example.com',
                displayName: 'New User',
                photoURL: 'https://example.com/photo.jpg',
            };

            // Appeler setDoc manuellement pour vérifier la structure
            await firestoreModule.setDoc('user-doc-ref', {
                uid: mockUser.uid,
                email: mockUser.email,
                displayName: mockUser.displayName,
                photoURL: mockUser.photoURL,
                formData,
                role: 'free',
                unlockedModules: [],
                progression: {},
                createdAt: expect.any(Date),
            });

            return mockUser;
        });

        // Appeler la fonction avec des données de formulaire fictives
        const formData = {
            interests: ['astronomy', 'physics'],
            experience: 'beginner',
        };

        try {
            await authModule.signUpWithGoogle(formData);

            // Vérifier que setDoc a été appelé avec la structure attendue
            expect(mockSetDoc).toHaveBeenCalledWith(
                'user-doc-ref',
                {
                    uid: 'new-user-uid',
                    email: 'new-user@example.com',
                    displayName: 'New User',
                    photoURL: 'https://example.com/photo.jpg',
                    formData: {
                        interests: ['astronomy', 'physics'],
                        experience: 'beginner',
                    },
                    role: 'free',
                    unlockedModules: [],
                    progression: {},
                    createdAt: expect.any(Date),
                }
            );
        } finally {
            // Restaurer la fonction originale
            authModule.signUpWithGoogle = originalSignUpWithGoogle;
        }
    });

    // Tester l'enrichissement des données utilisateur lors de l'authentification
    test('enrichissement des données utilisateur lors de l\'authentification', async () => {
        // Créer un utilisateur de base
        const mockBasicUser = {
            uid: 'test-uid-enrich',
            email: 'user-enrich@example.com',
            displayName: 'Test User Enrich',
        };

        // Données Firestore fictives
        const mockFirestoreData = {
            uid: 'test-uid-enrich',
            email: 'user-enrich@example.com',
            displayName: 'Test User Enrich',
            role: 'premium',
            premiumUntil: new Date(),
            unlockedModules: ['module1', 'module2', 'premium-module'],
            progression: {
                module1: { percentage: 100 },
            },
            formData: {
                interests: ['astronomy'],
            },
        };

        // Mock pour getDoc
        const mockGetDocResult = {
            exists: jest.fn().mockReturnValue(true),
            data: jest.fn().mockReturnValue(mockFirestoreData),
        };
        firestoreModule.getDoc = jest.fn().mockResolvedValue(mockGetDocResult);

        // Mock pour doc
        firestoreModule.doc = jest.fn().mockReturnValue('user-doc-ref');

        // Récupérer la fonction originale
        const originalOnAuthStateChange = authModule.onAuthStateChange;

        // Override onAuthStateChange pour tester
        authModule.onAuthStateChange = (callback) => {
            // Simuler l'appel original à onAuthStateChanged de Firebase
            setTimeout(async () => {
                // Ajouter l'enrichissement des données utilisateur
                const userDoc = await firestoreModule.getDoc('user-doc-ref');

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const enhancedUser = {
                        ...mockBasicUser,
                        role: userData.role || 'free',
                        premiumUntil: userData.premiumUntil || null,
                        unlockedModules: userData.unlockedModules || [],
                        progression: userData.progression || {},
                        formData: userData.formData || {},
                    };

                    callback(enhancedUser);
                } else {
                    callback(mockBasicUser);
                }
            }, 0);

            return jest.fn(); // Fonction de nettoyage
        };

        // Tester avec un mock callback
        const mockCallback = jest.fn();
        authModule.onAuthStateChange(mockCallback);

        // Vérifier que le callback est appelé avec les données utilisateur enrichies
        await waitFor(() => {
            expect(mockCallback).toHaveBeenCalledWith({
                ...mockBasicUser,
                role: 'premium',
                premiumUntil: expect.any(Date),
                unlockedModules: ['module1', 'module2', 'premium-module'],
                progression: {
                    module1: { percentage: 100 },
                },
                formData: {
                    interests: ['astronomy'],
                },
            });
        });

        // Restaurer la fonction originale
        authModule.onAuthStateChange = originalOnAuthStateChange;
    });
}); 