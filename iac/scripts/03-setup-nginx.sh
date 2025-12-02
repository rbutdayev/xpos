#!/bin/bash

# Nginx Setup Script
# Installs and configures Nginx with SSL using Certbot

set -e

SERVER_IP="20.218.139.129"
SSH_USER="onyx"
SSH_PASS="vonqud-kiqze5-hyWtit"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

remote_exec() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

remote_copy() {
    local src=$1
    local dest=$2
    sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no -r "$src" "$SSH_USER@$SERVER_IP:$dest"
}

log_info "Installing Nginx..."
remote_exec "sudo apt-get update"
remote_exec "sudo apt-get install -y nginx"

log_info "Installing Certbot for SSL certificates..."
remote_exec "sudo apt-get install -y certbot python3-certbot-nginx"

log_info "Copying Nginx configuration files..."
remote_copy "$SCRIPT_DIR/../configs/nginx/" "$SSH_USER@$SERVER_IP:~/nginx/"

log_info "Stopping Nginx temporarily..."
remote_exec "sudo systemctl stop nginx || true"

# Copy configurations to Nginx directory
log_info "Setting up Nginx configurations..."
remote_exec "sudo cp ~/nginx/nginx.conf /etc/nginx/nginx.conf"
remote_exec "sudo cp ~/nginx/conf.d/xpos.conf /etc/nginx/sites-available/xpos.conf"
remote_exec "sudo cp ~/nginx/conf.d/eservis.conf /etc/nginx/sites-available/eservis.conf"

# Create symlinks
remote_exec "sudo ln -sf /etc/nginx/sites-available/xpos.conf /etc/nginx/sites-enabled/xpos.conf"
remote_exec "sudo ln -sf /etc/nginx/sites-available/eservis.conf /etc/nginx/sites-enabled/eservis.conf"

# Remove default site
remote_exec "sudo rm -f /etc/nginx/sites-enabled/default"

log_info "Testing Nginx configuration..."
remote_exec "sudo nginx -t"

log_info "Starting Nginx..."
remote_exec "sudo systemctl start nginx"
remote_exec "sudo systemctl enable nginx"

log_warn "SSL Certificate Setup:"
log_warn "To obtain SSL certificates, run these commands on the server:"
log_warn "  sudo certbot --nginx -d xpos.az -d www.xpos.az"
log_warn "  sudo certbot --nginx -d eservis.az -d www.eservis.az"
log_warn ""
log_warn "Make sure your domains are pointing to the server IP ($SERVER_IP) before running certbot"

log_info "Nginx setup completed!"
