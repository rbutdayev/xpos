#!/bin/bash

# Deploy Nginx Configuration to Production
# Copies updated nginx config and restarts nginx

set -e

SERVER_IP="20.218.170.234"
SSH_USER="onyx"
SSH_PASS="QFxOxVYJ4SPiPC"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NGINX_CONFIGS="$PROJECT_ROOT/configs/nginx"

log_info "Backing up current nginx configuration..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)"

log_info "Copying nginx configuration files..."
sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no \
    "$NGINX_CONFIGS/nginx.conf" \
    "$SSH_USER@$SERVER_IP:~/nginx.conf"

sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no \
    "$NGINX_CONFIGS/conf.d/prod.xpos.conf" \
    "$SSH_USER@$SERVER_IP:~/prod.xpos.conf"

log_info "Moving configuration files to nginx directory..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "sudo mv ~/nginx.conf /etc/nginx/nginx.conf && \
     sudo mv ~/prod.xpos.conf /etc/nginx/conf.d/prod.xpos.conf"

log_info "Testing nginx configuration..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "sudo nginx -t"

log_info "Reloading nginx..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "sudo systemctl reload nginx"

log_info "Checking nginx status..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" \
    "sudo systemctl status nginx --no-pager | head -10"

log_info "Nginx configuration deployed successfully!"
log_warning "If you also updated PHP settings, remember to restart the Laravel application!"
