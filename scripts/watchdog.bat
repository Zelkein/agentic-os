@echo off
title Agentic OS — Watchdog
color 0A
echo Agentic OS Watchdog — Surveille et redemarre automatiquement
echo.

:NODE_ACTIVE
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo [%DATE% %TIME%] Node.js down — redemarrage...
    powershell -ExecutionPolicy Bypass -File "C:\agentic-os-v2\scripts\centre.ps1"
    echo [%DATE% %TIME%] Redemarre.
    timeout /T 30 /NOBREAK >NUL
) else (
    timeout /T 15 /NOBREAK >NUL
)
goto NODE_ACTIVE
