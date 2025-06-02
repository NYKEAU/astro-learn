@echo off
echo 🚀 Déploiement AstroLearn Production
echo.

echo 📦 Build de l'application...
call npm run build:firebase
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)

echo ✅ Build terminé avec succès
echo.

echo 🔒 Déploiement des règles de sécurité...
call firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du déploiement des règles Firestore
    pause
    exit /b 1
)

call firebase deploy --only storage:rules
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du déploiement des règles Storage
    pause
    exit /b 1
)

echo ✅ Règles de sécurité déployées
echo.

echo 🌐 Déploiement de l'application...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du déploiement de l'hosting
    pause
    exit /b 1
)

echo ✅ Application déployée avec succès!
echo.

echo ⚠️  IMPORTANT: Configuration CORS requise
echo Veuillez configurer CORS manuellement:
echo 1. Allez sur https://console.firebase.google.com/
echo 2. Sélectionnez votre projet space-learn-a2406
echo 3. Storage ^> Configuration ^> CORS
echo 4. Appliquez le fichier storage.cors.json
echo.
echo Ou utilisez: gsutil cors set storage.cors.json gs://space-learn-a2406.firebasestorage.app
echo.

echo 🔍 URLs de vérification:
echo - App: https://astrolearn.nicolaslhommeau.com
echo - Firebase: https://space-learn-a2406.web.app
echo.

echo 🎉 Déploiement terminé!
pause 