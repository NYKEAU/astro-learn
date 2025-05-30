# 📱 Guide de Dépannage Mobile - AstroLearn

## 🚨 Problème : Impossible d'accéder au site depuis mobile

### ✅ Solution Rapide

1. **Lancez le script de configuration** (en tant qu'administrateur) :
   ```bash
   scripts/setup-mobile-dev.bat
   ```

2. **Démarrez le serveur mobile** :
   ```bash
   npm run dev:mobile
   ```

3. **Utilisez l'IP locale** sur mobile : `http://192.168.1.28:3000`

---

## 🔍 Diagnostic Étape par Étape

### 1. Vérifier l'IP Locale

```bash
# Windows
ipconfig

# Recherchez "IPv4 Address" dans "Wireless LAN adapter Wi-Fi"
# Exemple : 192.168.1.28
```

### 2. Vérifier le Serveur Next.js

```bash
# ❌ Mauvais (localhost uniquement)
npm run dev

# ✅ Correct (accessible mobile)
npm run dev:mobile
```

**Vérifiez la sortie :**
```
- Local:        http://localhost:3000
- Network:      http://192.168.1.28:3000  ← Cette ligne doit apparaître
```

### 3. Tester la Connectivité

**Sur mobile :**
1. Connectez-vous au **même réseau WiFi**
2. Ouvrez le navigateur
3. Tapez : `http://192.168.1.28:3000`

**Test ping (optionnel) :**
```bash
# Sur mobile (app terminal)
ping 192.168.1.28
```

### 4. Vérifier le Pare-feu Windows

**Méthode automatique :**
```bash
# Exécuter en tant qu'administrateur
scripts/setup-mobile-dev.bat
```

**Méthode manuelle :**
1. Ouvrir "Pare-feu Windows Defender"
2. Cliquer "Paramètres avancés"
3. "Règles de trafic entrant" → "Nouvelle règle"
4. Type : Port → TCP → Port 3000 → Autoriser

---

## 🛠️ Solutions par Problème

### ❌ "Ce site est inaccessible"

**Causes possibles :**
- Serveur lancé avec `npm run dev` au lieu de `npm run dev:mobile`
- Mauvaise IP utilisée
- Pare-feu bloque le port 3000

**Solutions :**
1. Relancer avec `npm run dev:mobile`
2. Vérifier l'IP avec `ipconfig`
3. Configurer le pare-feu

### ❌ "Connexion refusée"

**Causes possibles :**
- Appareils sur des réseaux différents
- Pare-feu trop restrictif
- Port 3000 utilisé par autre application

**Solutions :**
1. Vérifier le réseau WiFi (même SSID)
2. Redémarrer le routeur
3. Changer de port : `npm run dev:mobile -- --port 3001`

### ❌ "Chargement très lent"

**Causes possibles :**
- Réseau WiFi surchargé
- Mode développement (normal)
- Modèles 3D volumineux

**Solutions :**
1. Se rapprocher du routeur WiFi
2. Fermer autres apps sur mobile
3. Utiliser le diagnostic réseau intégré

---

## 🔧 Outils de Diagnostic

### 1. Diagnostic Intégré

- Bouton **🔧** en bas à gauche de la page
- Affiche IP locale, URLs de test, infos réseau
- Disponible uniquement en développement

### 2. API de Diagnostic

```bash
# Tester l'API réseau
curl http://localhost:3000/api/network-info
```

### 3. Commandes Utiles

```bash
# Voir les connexions réseau
netstat -an | findstr :3000

# Tester la connectivité
telnet 192.168.1.28 3000

# Voir les règles pare-feu
netsh advfirewall firewall show rule name="Next.js Dev Server"
```

---

## 📋 Checklist de Vérification

- [ ] **Même réseau WiFi** (PC et mobile)
- [ ] **Serveur lancé** avec `npm run dev:mobile`
- [ ] **IP correcte** (192.168.x.x, pas localhost)
- [ ] **Pare-feu configuré** (port 3000 autorisé)
- [ ] **URL complète** (http://IP:3000/chemin)

---

## 🌐 Alternatives de Partage

### 1. QR Code (Réseau Local)
- Utilise automatiquement l'IP locale
- Scan direct depuis desktop

### 2. Code Temporaire (Universel)
- Fonctionne sans réseau local
- Code à 6 caractères (ex: ABC123)
- Expire en 10 minutes

### 3. Tunneling (Avancé)
```bash
# Avec ngrok (installation requise)
npx ngrok http 3000

# URL publique temporaire
# https://abc123.ngrok.io
```

---

## 🚀 Configuration Optimale

### next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Autoriser les connexions externes
  experimental: {
    allowedHosts: ['*']
  }
};

export default nextConfig;
```

### package.json
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:mobile": "next dev --hostname 0.0.0.0",
    "dev:tunnel": "next dev --hostname 0.0.0.0 --port 3000"
  }
}
```

---

## 📞 Support Avancé

### Logs de Debug
```bash
# Activer les logs détaillés
DEBUG=* npm run dev:mobile
```

### Variables d'Environnement
```bash
# .env.local
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_MOBILE_DEBUG=true
```

### Redémarrage Complet
```bash
# Nettoyer et redémarrer
npm run build
rm -rf .next
npm run dev:mobile
```

---

## 🎯 Résumé Rapide

**Votre IP locale :** `192.168.1.28`

**Commandes essentielles :**
```bash
npm run dev:mobile                    # Serveur mobile
http://192.168.1.28:3000             # URL mobile
scripts/setup-mobile-dev.bat         # Config pare-feu
```

**En cas de problème :** Utilisez le diagnostic intégré (bouton 🔧) pour identifier la cause exacte.

---

*Ce guide couvre 99% des problèmes de connectivité mobile en développement local. Pour des cas spécifiques, consultez les logs du serveur et du navigateur mobile.* 