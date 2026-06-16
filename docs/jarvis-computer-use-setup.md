# 🖥️ Projet Jarvis — Contrôle PC par la voix

**Objectif :** Contrôler le curseur, ouvrir des applications, cliquer, taper du texte, et interagir avec le bureau Windows — le tout commandé vocalement via Nova.

---

## Architecture

```
Ta voix → Telegram → Nova (WSL) → HTTP → WindowsComputerUse (Windows) → Desktop
```

- **Nova** tourne dans WSL sur le NucBox
- **WindowsComputerUse** est un serveur MCP qui tourne sur Windows (host)
- La communication se fait via HTTP/SSE sur le port **8899**
- WindowsComputerUse utilise PyAutoGUI + Win32 API pour contrôler le bureau

---

## Installation

### 1. Prérequis

- Windows 10 ou 11
- Python 3.10+ installé sur Windows
  - Télécharger : https://www.python.org/downloads/
  - **Important** : cocher "Add Python to PATH" pendant l'installation

### 2. Installer WindowsComputerUse

Ouvrir **PowerShell (Admin)** et exécuter :

```powershell
# Installer le package
pip install win-computer-use
```

### 3. Configurer le serveur

Créer le fichier de config à `%USERPROFILE%\.win_computer_use\config.json` :

```json
{
  "bypass": false,
  "allowed_apps": [
    "msedge.exe",
    "chrome.exe",
    "firefox.exe",
    "explorer.exe",
    "notepad.exe",
    "calc.exe",
    "mspaint.exe",
    "outlook.exe",
    "Teams.exe",
    "Code.exe",
    "AutoCAD.exe",
    "Revit.exe",
    "Bluebeam.exe",
    "Acrobat.exe",
    "Excel.exe",
    "WINWORD.EXE",
    "POWERPNT.EXE"
  ],
  "blocked_apps": [],
  "max_screenshot_dim": 1920,
  "mouse_move_duration_s": 0.6,
  "fail_safe": true,
  "agent_name": "Nova",
  "cursor_color": "#8B5CF6",
  "overlay_enabled": true,
  "showcase_mode": true,
  "emergency_hotkey": "ctrl+shift+x"
}
```

### 4. Démarrer le serveur

```powershell
# Mode SSE (recommandé pour la communication WSL → Windows)
win-computer-use --transport sse --port 8899
```

Le serveur écoute sur `http://localhost:8899/mcp`.

### 5. Ajouter au démarrage de Windows

**Option A — Script de démarrage (recommandé) :**

1. Ouvrir `shell:startup` (Win+R → `shell:startup`)
2. Créer un raccourci vers `C:\agentic-os-v2\scripts\start-computer-use.ps1`

**Option B — Task Scheduler :**
1. Ouvrir Task Scheduler
2. Créer une tâche : au login → démarrer `powershell.exe` avec args `-File C:\agentic-os-v2\scripts\start-computer-use.ps1`

---

## Connexion depuis Nova (WSL)

Le fichier de config Hermes est à : `C:\agentic-os-v2\.hermes\mcp-computer-use.json`

```json
{
  "mcpServers": {
    "windows-computer-use": {
      "transport": "http",
      "url": "http://host.docker.internal:8899/mcp",
      "enabled": true
    }
  }
}
```

`host.docker.internal` résout l'adresse IP du host Windows depuis WSL/Docker.

---

## Utilisation

Une fois connecté, Nova peut exécuter des commandes comme :

| Commande vocale | Action |
|----------------|--------|
| "Ouvre Chrome" | Lance Chrome |
| "Clique à X 500 Y 300" | Déplace le curseur et clique |
| "Tape 'bonjour'" | Tape du texte |
| "Capture d'écran" | Prend un screenshot |
| "Ouvre le dossier Projets" | Ouvre l'Explorateur |
| "Appuie sur Ctrl+S" | Simule Ctrl+S |
| "Trouve le texte 'Soumettre' et clique" | OCR + clic |

---

## Sécurité

- **Emergency Stop** : `Ctrl+Shift+X` → freeze toutes les actions
- **Allowlist** : seules les apps dans `allowed_apps` peuvent être lancées
- **Fail-safe** : envoyer le curseur dans un coin de l'écran annule l'action
- **Curseur virtuel** : les clics utilisent PostMessage par défaut — ton vrai curseur n'est pas dérangé

---

## Dépannage

| Problème | Solution |
|----------|----------|
| "Connection refused" | Le serveur Windows n'est pas démarré. Lancer `start-computer-use.ps1` |
| Les clics ne fonctionnent pas dans Chrome | Ajouter `use_real_cursor: true` à l'appel |
| Écran noir dans les screenshots | Activer WGC : `use_wgc: true` |
| Le serveur ne démarre pas au boot | Vérifier le Task Scheduler ou le raccourci Startup |