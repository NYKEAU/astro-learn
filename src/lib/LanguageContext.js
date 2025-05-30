"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Définition des traductions
const translations = {
  fr: {
    // Navigation et interface générale
    language: "Langue",
    french: "Français",
    english: "Anglais",
    login: "Connexion",
    register: "Inscription",
    dashboard: "Tableau de bord",
    profile: "Profil",
    settings: "Paramètres",
    logout: "Déconnexion",
    signOut: "Déconnexion",
    signedOut: "Déconnexion réussie",

    // Dashboard
    welcome: "Bienvenue !",
    welcomeMessage:
      "Votre voyage astronomique commence ici. Explorez nos cours et ressources pour approfondir vos connaissances.",
    courses: "Cours",
    coursesMessage:
      "Vous n'avez pas encore commencé de cours. Découvrez notre catalogue pour débuter votre apprentissage.",
    events: "Événements",
    eventsMessage:
      "Restez informé des prochains événements astronomiques et des sessions d'observation.",

    // Formulaire d'inscription - Onglets
    registration: "Inscription",
    connection: "Connexion",

    // Formulaire d'inscription - Général
    next: "Suivant",
    previous: "Précédent",
    validate: "Valider",
    validating: "Validation...",
    finalize: "Finaliser avec Google",
    completed: "complété",
    requiredFields: "Veuillez remplir tous les champs obligatoires",
    registrationSuccess:
      "Inscription réussie ! Redirection vers le tableau de bord...",
    registrationError: "Échec de l'inscription. Veuillez réessayer.",
    formCompleted:
      "Formulaire complété ! Veuillez finaliser votre inscription avec Google.",
    tip: "Astuce",
    optional: "optionnel",
    importantGoogleNotice:
      "Pour finaliser votre inscription et sauvegarder vos préférences, vous devez vous connecter avec Google. Sans cette étape, vos données ne pourront pas être enregistrées dans notre système.",

    // Étape 1 - Informations personnelles
    personalInfo: "Informations personnelles",
    personalInfoDesc:
      "Parlez-nous un peu de vous pour personnaliser votre expérience d'apprentissage.",
    fullName: "Nom complet",
    fullNamePlaceholder: "Entrez votre nom complet",
    age: "Âge",
    agePlaceholder: "Entrez votre âge",
    educationLevel: "Niveau d'éducation",
    selectEducationLevel: "Sélectionnez votre niveau d'éducation",
    primary: "Primaire",
    secondary: "Secondaire",
    highSchool: "Lycée",
    bachelor: "Licence",
    master: "Master",
    phd: "Doctorat",
    other: "Autre",
    personalInfoTip:
      "Ces informations nous aident à adapter le contenu éducatif à votre profil. Toutes vos données sont traitées conformément à notre politique de confidentialité.",

    // Étape 2 - Connaissances en astronomie
    astronomyKnowledge: "Connaissances en astronomie",
    astronomyKnowledgeDesc:
      "Évaluez votre niveau actuel de connaissances en astronomie.",
    astronomyLevel: "Niveau en astronomie",
    selectAstronomyLevel: "Sélectionnez votre niveau",
    beginner: "Débutant - Je découvre l'astronomie",
    intermediate: "Intermédiaire - J'ai des connaissances de base",
    advanced: "Avancé - Je pratique régulièrement",
    expert: "Expert - J'ai des connaissances approfondies",
    previousExperience: "Expérience précédente",
    previousExperiencePlaceholder:
      "Décrivez votre expérience précédente en astronomie (cours, observations, etc.)",
    beginnerInfo: "Débutant",
    beginnerDesc:
      "Vous découvrez l'astronomie et souhaitez apprendre les bases. Nous vous guiderons pas à pas.",
    intermediateInfo: "Intermédiaire",
    intermediateDesc:
      "Vous connaissez les bases et souhaitez approfondir certains sujets spécifiques.",
    advancedInfo: "Avancé",
    advancedDesc:
      "Vous pratiquez régulièrement et cherchez à explorer des concepts plus complexes.",
    expertInfo: "Expert",
    expertDesc:
      "Vous avez des connaissances approfondies et recherchez du contenu spécialisé.",

    // Étape 3 - Centres d'intérêt
    interests: "Centres d'intérêt",
    interestsDesc:
      "Sélectionnez les sujets qui vous intéressent le plus en astronomie.",
    selectedInterests: "Intérêts sélectionnés",
    interestsTip:
      "Sélectionnez au moins un sujet d'intérêt. Vos choix nous aideront à personnaliser votre parcours d'apprentissage avec du contenu pertinent.",
    planets: "Planètes",
    stars: "Étoiles",
    galaxies: "Galaxies",
    blackHoles: "Trous noirs",
    cosmology: "Cosmologie",
    spaceExploration: "Exploration spatiale",
    telescopes: "Télescopes",
    astrophotography: "Astrophotographie",
    astrobiology: "Astrobiologie",
    spaceHistory: "Histoire spatiale",
    amateurAstronomy: "Astronomie amateur",
    celestialEvents: "Événements célestes",

    // Étape 4 - Objectifs d'apprentissage
    learningGoals: "Objectifs d'apprentissage",
    learningGoalsDesc:
      "Quels sont vos objectifs d'apprentissage en astronomie ?",
    selectedGoals: "Objectifs sélectionnés",
    basicKnowledge: "Acquérir des connaissances de base",
    deepUnderstanding: "Approfondir ma compréhension",
    stargazing: "Apprendre à observer les étoiles",
    learnAstrophotography: "Pratiquer l'astrophotographie",
    keepUpdated: "Rester informé des découvertes",
    joinCommunity: "Rejoindre une communauté",
    careerAstronomy: "Carrière en astronomie",
    teachOthers: "Enseigner à d'autres",
    additionalInfo: "Informations supplémentaires",
    additionalInfoPlaceholder:
      "Y a-t-il autre chose que vous aimeriez nous faire savoir sur vos objectifs d'apprentissage ?",
    finalStep: "Dernière étape",
    finalStepDesc:
      "Après avoir défini vos objectifs, vous pourrez finaliser votre inscription et commencer votre voyage astronomique !",

    // Formulaire de connexion
    loginWithGoogle: "Se connecter avec Google",
    loginPrompt: "Connectez-vous pour accéder à votre compte",
    loginSuccess: "Connexion réussie ! Redirection vers le tableau de bord...",
    loginError: "Échec de la connexion. Veuillez réessayer.",
  },
  en: {
    // Navigation and general interface
    language: "Language",
    french: "French",
    english: "English",
    login: "Login",
    register: "Register",
    dashboard: "Dashboard",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    signOut: "Sign Out",
    signedOut: "Successfully signed out",

    // Dashboard
    welcome: "Welcome!",
    welcomeMessage:
      "Your astronomical journey begins here. Explore our courses and resources to deepen your knowledge.",
    courses: "Courses",
    coursesMessage:
      "You haven't started any courses yet. Discover our catalog to begin your learning journey.",
    events: "Events",
    eventsMessage:
      "Stay informed about upcoming astronomical events and observation sessions.",

    // Registration form - Tabs
    registration: "Registration",
    connection: "Login",

    // Registration form - General
    next: "Next",
    previous: "Previous",
    validate: "Validate",
    validating: "Validating...",
    finalize: "Finalize with Google",
    completed: "completed",
    requiredFields: "Please fill in all required fields",
    registrationSuccess: "Registration successful! Redirecting to dashboard...",
    registrationError: "Registration failed. Please try again.",
    formCompleted:
      "Form completed! Please finalize your registration with Google.",
    tip: "Tip",
    optional: "optional",
    importantGoogleNotice:
      "To finalize your registration and save your preferences, you must sign in with Google. Without this step, your data cannot be saved in our system.",

    // Step 1 - Personal Information
    personalInfo: "Personal Information",
    personalInfoDesc:
      "Tell us a bit about yourself to personalize your learning experience.",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    age: "Age",
    agePlaceholder: "Enter your age",
    educationLevel: "Education Level",
    selectEducationLevel: "Select your education level",
    primary: "Primary",
    secondary: "Secondary",
    highSchool: "High School",
    bachelor: "Bachelor's Degree",
    master: "Master's Degree",
    phd: "PhD",
    other: "Other",
    personalInfoTip:
      "This information helps us adapt educational content to your profile. All your data is processed in accordance with our privacy policy.",

    // Step 2 - Astronomy Knowledge
    astronomyKnowledge: "Astronomy Knowledge",
    astronomyKnowledgeDesc:
      "Evaluate your current level of knowledge in astronomy.",
    astronomyLevel: "Astronomy Level",
    selectAstronomyLevel: "Select your level",
    beginner: "Beginner - I'm discovering astronomy",
    intermediate: "Intermediate - I have basic knowledge",
    advanced: "Advanced - I practice regularly",
    expert: "Expert - I have in-depth knowledge",
    previousExperience: "Previous Experience",
    previousExperiencePlaceholder:
      "Describe your previous experience in astronomy (courses, observations, etc.)",
    beginnerInfo: "Beginner",
    beginnerDesc:
      "You're discovering astronomy and want to learn the basics. We'll guide you step by step.",
    intermediateInfo: "Intermediate",
    intermediateDesc:
      "You know the basics and want to deepen your knowledge on specific topics.",
    advancedInfo: "Advanced",
    advancedDesc:
      "You practice regularly and are looking to explore more complex concepts.",
    expertInfo: "Expert",
    expertDesc:
      "You have in-depth knowledge and are looking for specialized content.",

    // Step 3 - Interests
    interests: "Interests",
    interestsDesc: "Select the topics that interest you most in astronomy.",
    selectedInterests: "Selected interests",
    interestsTip:
      "Select at least one topic of interest. Your choices will help us personalize your learning path with relevant content.",
    planets: "Planets",
    stars: "Stars",
    galaxies: "Galaxies",
    blackHoles: "Black Holes",
    cosmology: "Cosmology",
    spaceExploration: "Space Exploration",
    telescopes: "Telescopes",
    astrophotography: "Astrophotography",
    astrobiology: "Astrobiology",
    spaceHistory: "Space History",
    amateurAstronomy: "Amateur Astronomy",
    celestialEvents: "Celestial Events",

    // Step 4 - Learning Goals
    learningGoals: "Learning Goals",
    learningGoalsDesc: "What are your learning goals in astronomy?",
    selectedGoals: "Selected goals",
    basicKnowledge: "Acquire basic knowledge",
    deepUnderstanding: "Deepen my understanding",
    stargazing: "Learn to observe stars",
    learnAstrophotography: "Practice astrophotography",
    keepUpdated: "Stay informed about discoveries",
    joinCommunity: "Join a community",
    careerAstronomy: "Career in astronomy",
    teachOthers: "Teach others",
    additionalInfo: "Additional Information",
    additionalInfoPlaceholder:
      "Is there anything else you'd like us to know about your learning goals?",
    finalStep: "Final step",
    finalStepDesc:
      "After defining your goals, you can finalize your registration and begin your astronomical journey!",

    // Login form
    loginWithGoogle: "Sign in with Google",
    loginPrompt: "Sign in to access your account",
    loginSuccess: "Login successful! Redirecting to dashboard...",
    loginError: "Login failed. Please try again.",
  },
};

// Création du contexte
const LanguageContext = createContext();

// Hook personnalisé pour utiliser le contexte de langue
export const useLanguage = () => useContext(LanguageContext);

// Fournisseur de contexte
export function LanguageProvider({ children }) {
  // Définir un état initial sans accéder au localStorage au rendu initial
  const [language, setLanguage] = useState("fr");
  const [isInitialized, setIsInitialized] = useState(false);

  // Charger la langue depuis localStorage uniquement côté client après le montage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    setIsInitialized(true);
  }, []);

  // Mettre à jour localStorage quand la langue change, mais uniquement après initialisation
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("language", language);
    }
  }, [language, isInitialized]);

  // Fonction pour changer de langue
  const changeLanguage = (newLanguage) => {
    if (newLanguage === "fr" || newLanguage === "en") {
      setLanguage(newLanguage);
    }
  };

  // Obtenir les traductions pour la langue actuelle
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
