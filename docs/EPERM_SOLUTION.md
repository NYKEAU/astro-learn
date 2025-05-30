# Solution à l'erreur EPERM lors du build Next.js sous Windows

## Problème

L'erreur `EPERM: operation not permitted, open '.next\trace'` se produit lors du build de production Next.js sous Windows. Cette erreur est causée par des processus Node.js qui verrouillent les fichiers dans le dossier `.next`.

## Solution Immédiate

### Méthode Manuelle (PowerShell)

```powershell
# 1. Arrêter tous les processus Node.js
taskkill /f /im node.exe

# 2. Supprimer le dossier .next
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 3. Attendre quelques secondes
Start-Sleep -Seconds 3

# 4. Relancer le build
npm run build
```

### Méthode Automatisée

Utilisez le script de build sécurisé :

```bash
# Windows
.\scripts\build-windows.bat

# Unix/Linux/macOS
bash scripts/build-clean.sh
```

## Scripts Automatisés Disponibles

### 1. Script Windows (build-windows.bat)

- Arrête automatiquement tous les processus Node.js
- Supprime le dossier `.next`
- Attend la libération des verrous de fichiers
- Lance le build de production
- Affiche le statut de réussite/échec

### 2. Script Unix (build-clean.sh)

- Détecte et arrête les processus Node.js
- Nettoie le dossier `.next`
- Option de nettoyage du cache npm (`--clean-cache`)
- Compatible Linux/macOS

## Commandes NPM Disponibles

```bash
# Build sécurisé automatique (détecte l'OS)
npm run build:safe

# Build sécurisé Windows
npm run build:windows

# Build sécurisé Unix/Linux/macOS
npm run build:unix

# Build avec nettoyage complet du cache
npm run build:clean
```

## Causes de l'Erreur EPERM

1. **Processus Node.js actifs** : Serveurs de développement (`npm run dev`) non arrêtés
2. **Verrous de fichiers** : Windows verrouille les fichiers plus agressivement que Unix
3. **Permissions insuffisantes** : Parfois nécessite des droits administrateur
4. **Cache corrompu** : Cache npm ou dossier `.next` corrompu

## Procédure de Dépannage Complète

### Étape 1 : Solution Standard

```bash
npm run build:windows
```

### Étape 2 : Si l'erreur persiste

```powershell
# Nettoyage complet
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
npm run build:windows
```

### Étape 3 : En dernier recours

- Exécuter le terminal en tant qu'administrateur
- Redémarrer l'ordinateur si nécessaire
- Vérifier les permissions du dossier du projet

## Prévention

1. **Toujours arrêter les serveurs de développement** avant le build
2. **Utiliser les scripts automatisés** plutôt que `npm run build` directement
3. **Éviter d'interrompre brutalement** les processus Node.js
4. **Nettoyer régulièrement** le cache npm et le dossier `.next`

## Validation de la Solution

La solution a été testée et validée sur :

- ✅ Windows 10/11 avec PowerShell
- ✅ Build de production Next.js 15.3.1
- ✅ Environnement de développement local
- ✅ Scripts automatisés fonctionnels

## Portabilité

Les scripts sont conçus pour être portables :

- **Windows** : Utilise des commandes batch/PowerShell natives
- **Unix/Linux/macOS** : Utilise bash et des commandes POSIX standard
- **Détection automatique** : `npm run build:safe` détecte l'OS automatiquement

Cette solution élimine définitivement l'erreur EPERM lors des builds Next.js sous Windows.
