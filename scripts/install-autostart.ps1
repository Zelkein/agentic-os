# Install Agentic OS as auto-start service
# Run this PowerShell as Administrator once

$TaskName = "AgenticOS"
$ScriptPath = "C:\agentic-os-v2\scripts\centre.ps1"
$RepoRoot = "C:\agentic-os-v2"

# Remove old task if exists
schtasks /Delete /TN $TaskName /F 2>$null

# Create task: starts at user login
schtasks /Create /TN $TaskName /SC ONLOGON /DELAY 0000:30 /TR "powershell.exe -ExecutionPolicy Bypass -WindowStyle Normal -File '$ScriptPath'" /RL HIGHEST /F

# Set restart on failure (3 attempts)
schtasks /Change /TN $TaskName /RU $env:USERNAME

Write-Host "✅ Tache planifiee creee: $TaskName"
Write-Host "   Demarre: 30s apres connexion"
Write-Host "   Commande: powershell -File $ScriptPath"

# Also create a simple shortcut in shell:startup for redundancy
$WshShell = New-Object -ComObject WScript.Shell
$StartupFolder = [Environment]::GetFolderPath("Startup")
$ShortcutPath = Join-Path $StartupFolder "AgenticOS.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Normal -File `"$ScriptPath`""
$Shortcut.WorkingDirectory = $RepoRoot
$Shortcut.Description = "Agentic OS Command Centre"
$Shortcut.Save()

Write-Host "✅ Raccourci demarrage: $ShortcutPath"
Write-Host ""
Write-Host "Pour demarrer immediatement:"
Write-Host "  powershell -File $ScriptPath"
