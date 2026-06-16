<#
.SYNOPSIS
    Démarre le serveur WindowsComputerUse pour le contrôle PC par Nova.
.DESCRIPTION
    Vérifie Python, installe/met à jour win-computer-use, puis démarre
    le serveur MCP en mode SSE sur le port 8899.
.NOTES
    Auteur: Nova (Agentic OS)
    Version: 1.0
#>

$ErrorActionPreference = "Stop"
$LogFile = "$env:USERPROFILE\.win_computer_use\server.log"
$Port = 8899

# S'assurer que le dossier de log existe
$logDir = Split-Path $LogFile -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $LogFile -Append
    Write-Host "$timestamp - $Message"
}

Write-Log "=== Démarrage de WindowsComputerUse ==="

# 1. Vérifier Python
try {
    $pythonVersion = python --version 2>&1
    Write-Log "Python: $pythonVersion"
} catch {
    Write-Log "ERREUR: Python n'est pas installé ou pas dans le PATH"
    exit 1
}

# 2. Installer/mettre à jour win-computer-use
Write-Log "Installation/mise à jour de win-computer-use..."
try {
    $install = pip install --upgrade win-computer-use 2>&1
    Write-Log "Installation réussie"
} catch {
    Write-Log "ERREUR: Impossible d'installer win-computer-use: $_"
    exit 1
}

# 3. Config par défaut si elle n'existe pas
$configPath = "$env:USERPROFILE\.win_computer_use\config.json"
if (-not (Test-Path $configPath)) {
    Write-Log "Création de la config par défaut..."
    $defaultConfig = @{
        bypass = $false
        allowed_apps = @(
            "msedge.exe", "chrome.exe", "firefox.exe",
            "explorer.exe", "notepad.exe", "calc.exe",
            "Code.exe", "outlook.exe", "Teams.exe",
            "Excel.exe", "WINWORD.EXE", "POWERPNT.EXE"
        )
        blocked_apps = @()
        max_screenshot_dim = 1920
        mouse_move_duration_s = 0.6
        fail_safe = $true
        agent_name = "Nova"
        cursor_color = "#8B5CF6"
        overlay_enabled = $true
        showcase_mode = $true
        emergency_hotkey = "ctrl+shift+x"
    }
    $defaultConfig | ConvertTo-Json | Out-File -FilePath $configPath -Encoding UTF8
    Write-Log "Config créée: $configPath"
}

# 4. Démarrer le serveur
Write-Log "Démarrage du serveur sur le port $Port..."
try {
    # Lancer en arrière-plan avec logging
    $process = Start-Process -FilePath "python" -ArgumentList @(
        "-m", "win_computer_use",
        "--transport", "sse",
        "--port", $Port.ToString()
    ) -NoNewWindow -PassThru -RedirectStandardOutput "$env:USERPROFILE\.win_computer_use\server_stdout.log" -RedirectStandardError "$env:USERPROFILE\.win_computer_use\server_stderr.log"

    Write-Log "Serveur démarré (PID: $($process.Id))"
    Write-Log "Endpoint: http://localhost:$Port/mcp"

    # Attendre que le processus reste actif
    $process.WaitForExit()
    Write-Log "Serveur arrêté (code: $($process.ExitCode))"
} catch {
    Write-Log "ERREUR: Impossible de démarrer le serveur: $_"
    exit 1
}