# Jasper Auto-Launch Script
# Run this once to set up auto-launch on Windows startup

$taskName = "JasperOrchestrator"
$taskExists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($taskExists) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Removed existing task"
}

$action = New-ScheduledTaskAction `
    -Execute "C:\Users\Frank\AppData\Local\Python\pythoncore-3.14-64\python.exe" `
    -Argument "-u P:\Ai\Agentic OS\jasper.py" `
    -WorkingDirectory "P:\Ai\Agentic OS" `
    -ErrorAction Stop

$trigger = New-ScheduledTaskTrigger -AtStartup -ErrorAction Stop

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force

Write-Host "✓ Jasper Orchestrator scheduled to launch on Windows startup"
Write-Host "  Task: Scheduled Tasks > Task Scheduler Library > JasperOrchestrator"
