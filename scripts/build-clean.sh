#!/bin/bash

# Script de build sécurisé pour Unix/Linux/macOS
# Ce script nettoie l'environnement avant le build

echo "🚀 Démarrage du build sécurisé..."

# 1. Arrêter tous les processus Node.js (si nécessaire)
echo "📝 Vérification des processus Node.js..."
if pgrep -f "node" > /dev/null; then
    echo "⚠️ Processus Node.js détectés. Arrêt en cours..."
    pkill -f "node" || true
    sleep 2
    echo "✅ Processus Node.js arrêtés"
else
    echo "ℹ️ Aucun processus Node.js actif"
fi

# 2. Supprimer le dossier .next
echo "🧹 Nettoyage du dossier .next..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ Dossier .next supprimé"
else
    echo "ℹ️ Dossier .next n'existe pas"
fi

# 3. Supprimer le cache npm temporaire si nécessaire
if [ "$1" = "--clean-cache" ]; then
    echo "🧹 Nettoyage du cache npm..."
    npm cache clean --force
    echo "✅ Cache npm nettoyé"
fi

# 4. Attendre un peu pour s'assurer que les verrous de fichiers sont libérés
sleep 1

# 5. Lancer le build
echo "🔨 Lancement du build..."
if npm run build; then
    echo "✅ Build réussi !"
    echo "🎉 L'application est prête pour la production"
    echo "📋 Pour démarrer le serveur de production, utilisez: npm start"
else
    echo "❌ Échec du build"
    exit 1
fi 