#!/bin/bash
# One-time setup: install Agentic OS systemd service
# Run: bash ~/agentic-os/scripts/install-service.sh
# You'll be prompted for sudo password once.

SERVICE_SRC="/home/zelkein/agentic-os/scripts/agentic-os.service"
SERVICE_DST="/etc/systemd/system/agentic-os.service"

# Prompt for sudo password
echo "Installing Agentic OS service (sudo required)..."
sudo cp "$SERVICE_SRC" "$SERVICE_DST"
sudo systemctl daemon-reload
sudo systemctl enable agentic-os.service
sudo systemctl start agentic-os.service
echo ""
echo "✅ Service installed and started!"
systemctl status agentic-os.service --no-pager
