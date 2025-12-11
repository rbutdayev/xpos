#!/bin/bash

# Environment Switching Script
# Switches between development and production environments

set -e

SERVER_IP="20.218.139.129"
SSH_USER="onyx"
SSH_PASS="vonqud-kiqze5-hyWtit"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

remote_exec() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

show_current_env() {
    log_info "Checking current environment..."
    remote_exec "ls -la /etc/nginx/sites-enabled/ | grep -E '(dev|prod)' || echo 'No environment configs found'"
}

switch_to_dev() {
    log_info "Switching to DEVELOPMENT environment..."

    # Disable production
    remote_exec "sudo rm -f /etc/nginx/sites-enabled/prod.*.conf"

    # Enable development
    remote_exec "sudo ln -sf /etc/nginx/sites-available/dev.xpos.conf /etc/nginx/sites-enabled/dev.xpos.conf"
    remote_exec "sudo ln -sf /etc/nginx/sites-available/dev.eservis.conf /etc/nginx/sites-enabled/dev.eservis.conf"

    # Test and reload
    remote_exec "sudo nginx -t"
    remote_exec "sudo systemctl reload nginx"

    log_info "Switched to DEVELOPMENT environment"
    log_warn "Active domains:"
    log_warn "  - dev.xpos.az → localhost:8000"
    log_warn "  - dev.eservis.az → localhost:8001"
}

switch_to_prod() {
    log_warn "Switching to PRODUCTION environment..."
    log_warn "This will disable dev subdomains and enable production domains!"

    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_error "Aborted"
        exit 1
    fi

    # Disable development
    remote_exec "sudo rm -f /etc/nginx/sites-enabled/dev.*.conf"

    # Enable production
    remote_exec "sudo ln -sf /etc/nginx/sites-available/prod.xpos.conf /etc/nginx/sites-enabled/prod.xpos.conf"
    remote_exec "sudo ln -sf /etc/nginx/sites-available/prod.eservis.conf /etc/nginx/sites-enabled/prod.eservis.conf"

    # Test and reload
    remote_exec "sudo nginx -t"
    remote_exec "sudo systemctl reload nginx"

    log_info "Switched to PRODUCTION environment"
    log_warn "Active domains:"
    log_warn "  - app.xpos.az → localhost:8002"
    log_warn "  - eservis.az → localhost:8003"
    log_warn ""
    log_warn "Don't forget to obtain SSL certificates:"
    log_warn "  sudo certbot --nginx -d app.xpos.az"
    log_warn "  sudo certbot --nginx -d eservis.az -d www.eservis.az"
}

# Main menu
case "${1:-}" in
    dev)
        switch_to_dev
        ;;
    prod)
        switch_to_prod
        ;;
    status)
        show_current_env
        ;;
    *)
        echo "Usage: $0 {dev|prod|status}"
        echo ""
        echo "Commands:"
        echo "  dev     - Switch to development environment (dev.xpos.az, dev.eservis.az)"
        echo "  prod    - Switch to production environment (app.xpos.az, eservis.az)"
        echo "  status  - Show current active environment"
        exit 1
        ;;
esac
