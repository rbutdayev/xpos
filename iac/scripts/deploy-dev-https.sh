#!/bin/bash

# Deploy Dev HTTPS Configuration
# Updates nginx configs on server to fix mixed content issues

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
    sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no "$src" "$SSH_USER@$SERVER_IP:$dest"
}

log_info "Deploying HTTPS-fixed dev configurations..."

# Copy updated config files to server
log_info "Copying dev-xpos.conf to server..."
remote_copy "$SCRIPT_DIR/../configs/nginx/conf.d/dev-xpos.conf" "/tmp/dev-xpos.conf"

log_info "Copying dev-eservis.conf to server..."
remote_copy "$SCRIPT_DIR/../configs/nginx/conf.d/dev-eservis.conf" "/tmp/dev-eservis.conf"

# Install configs to nginx
log_info "Installing nginx configurations..."
remote_exec "sudo cp /tmp/dev-xpos.conf /etc/nginx/sites-available/dev-xpos.conf"
remote_exec "sudo cp /tmp/dev-eservis.conf /etc/nginx/sites-available/dev-eservis.conf"

# Enable configs if not already enabled
log_info "Enabling dev configurations..."
remote_exec "sudo ln -sf /etc/nginx/sites-available/dev-xpos.conf /etc/nginx/sites-enabled/dev-xpos.conf"
remote_exec "sudo ln -sf /etc/nginx/sites-available/dev-eservis.conf /etc/nginx/sites-enabled/dev-eservis.conf"

# Test nginx configuration
log_info "Testing nginx configuration..."
remote_exec "sudo nginx -t"

# Reload nginx
log_info "Reloading nginx..."
remote_exec "sudo systemctl reload nginx"

log_info ""
log_info "=== Deployment Complete! ==="
log_warn ""
log_warn "Updated configurations for:"
log_warn "  - dev.xpos.az (port 8002)"
log_warn "  - dev.eservis.az (port 8003)"
log_warn ""
log_warn "Key changes:"
log_warn "  ✓ HTTP redirects to HTTPS"
log_warn "  ✓ X-Forwarded-Proto header set to 'https'"
log_warn "  ✓ SSL/TLS enabled"
log_warn ""
log_warn "Next steps:"
log_warn "  1. Clear your browser cache"
log_warn "  2. Test at https://dev.xpos.az"
log_warn "  3. Verify no mixed content warnings"
log_info ""
