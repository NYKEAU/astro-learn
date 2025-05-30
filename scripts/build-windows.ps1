# Script de build securise pour Windows - Version simplifiee
Write-Host "=== Build securise pour Windows ===" -ForegroundColor Green

# Etape 1: Arreter tous les processus Node.js
Write-Host "1. Arret des processus Node.js..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null
Write-Host "   Processus arretes" -ForegroundColor Green

# Etape 2: Supprimer le dossier .next
Write-Host "2. Suppression du dossier .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "   Dossier .next supprime" -ForegroundColor Green
} else {
    Write-Host "   Dossier .next inexistant" -ForegroundColor Blue
}

# Etape 3: Attendre la liberation des verrous
Write-Host "3. Attente liberation des verrous..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "   Attente terminee" -ForegroundColor Green

# Etape 4: Lancer le build
Write-Host "4. Lancement du build..." -ForegroundColor Yellow
npm run build

# Verification du resultat
if ($LASTEXITCODE -eq 0) {
    Write-Host "" -ForegroundColor White
    Write-Host "=== BUILD REUSSI ===" -ForegroundColor Green
    Write-Host "L'application est prete pour la production" -ForegroundColor Green
    Write-Host "Commande pour demarrer: npm start" -ForegroundColor Cyan
} else {
    Write-Host "" -ForegroundColor White
    Write-Host "=== ECHEC DU BUILD ===" -ForegroundColor Red
    Write-Host "Verifiez les erreurs ci-dessus" -ForegroundColor Red
    exit $LASTEXITCODE
} 