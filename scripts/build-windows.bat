@echo off
echo === Build securise pour Windows ===

echo 1. Arret des processus Node.js...
taskkill /f /im node.exe >nul 2>&1
echo    Processus arretes

echo 2. Suppression du dossier .next...
if exist .next (
    rmdir /s /q .next >nul 2>&1
    echo    Dossier .next supprime
) else (
    echo    Dossier .next inexistant
)

echo 3. Attente liberation des verrous...
timeout /t 3 /nobreak >nul
echo    Attente terminee

echo 4. Lancement du build...
npm run build

if %errorlevel% equ 0 (
    echo.
    echo === BUILD REUSSI ===
    echo L'application est prete pour la production
    echo Commande pour demarrer: npm start
) else (
    echo.
    echo === ECHEC DU BUILD ===
    echo Verifiez les erreurs ci-dessus
    exit /b %errorlevel%
) 