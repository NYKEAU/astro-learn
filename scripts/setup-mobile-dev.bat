@echo off
echo ========================================
echo Configuration pour développement mobile
echo ========================================
echo.

echo 1. Configuration du pare-feu Windows...
echo.

REM Ajouter une règle pour autoriser le port 3000 en entrée
netsh advfirewall firewall add rule name="Next.js Dev Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000

echo ✅ Règle pare-feu ajoutée pour le port 3000
echo.

echo 2. Affichage de l'adresse IP locale...
echo.

REM Afficher l'IP locale
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%a"
    setlocal enabledelayedexpansion
    set "ip=!ip: =!"
    echo 📱 Votre IP locale : !ip!
    echo 🌐 URL mobile : http://!ip!:3000
    endlocal
)

echo.
echo 3. Instructions :
echo.
echo ✓ Lancez le serveur avec : npm run dev:mobile
echo ✓ Sur votre mobile, connectez-vous au même WiFi
echo ✓ Ouvrez l'URL mobile affichée ci-dessus
echo.

pause 