#!/bin/bash

# Server Setup Script
# Installs and configures basic server dependencies

set -e

SERVER_IP="20.218.139.129"
SSH_USER="onyx"
SSH_PASS="vonqud-kiqze5-hyWtit"

GREEN='\033[0;32m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

remote_exec() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

log_info "Updating system packages..."
remote_exec "sudo apt-get update && sudo apt-get upgrade -y"

log_info "Installing essential packages..."
remote_exec "sudo apt-get install -y \
    curl \
    git \
    ufw \
    software-properties-common \
    ca-certificates \
    gnupg \
    lsb-release"

log_info "Configuring firewall..."
# IMPORTANT: Allow SSH FIRST before enabling firewall!
remote_exec "sudo ufw allow 22/tcp"    # SSH
remote_exec "sudo ufw allow 80/tcp"    # HTTP
remote_exec "sudo ufw allow 443/tcp"   # HTTPS
remote_exec "sudo ufw --force enable"
remote_exec "sudo ufw status"

log_info "Creating application directories..."
remote_exec "mkdir -p ~/apps/{xpos,eservis}"
remote_exec "mkdir -p ~/nginx/conf.d"
remote_exec "mkdir -p ~/nginx/ssl"

log_info "Server setup completed!"
