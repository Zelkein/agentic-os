#!/usr/bin/env bash
set -euo pipefail

# Agentic OS - WSL Service Launcher
# Used by systemd + Hermes watchdog

CENTRE_DIR="/home/zelkein/agentic-os/command-centre"
PORT="${PORT:-3000}"
LOG="/home/zelkein/agentic-os/service.log"

cd "$CENTRE_DIR"

# Ensure dependencies
if [[ ! -d "node_modules" ]]; then
    npm install --no-audit --no-fund >> "$LOG" 2>&1
fi

# Clean stale .next on crash
if [[ -f ".next/trace" ]]; then
    rm -f .next/trace
fi

echo "[$(date)] Starting Agentic OS on port $PORT..." >> "$LOG"
exec npm run dev >> "$LOG" 2>&1
