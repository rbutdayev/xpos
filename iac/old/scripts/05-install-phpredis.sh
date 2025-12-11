#!/bin/bash

# PHP Redis Extension Installation Script
# Installs phpredis extension for PHP in Docker containers

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

log_info "Installing phpredis extension..."
log_warn ""
log_warn "NOTE: This script provides instructions for installing phpredis."
log_warn "The installation method depends on your Docker setup."
log_warn ""

# Check if containers are running
log_info "Checking running containers..."
containers=$(remote_exec "docker ps --format '{{.Names}}' | grep -E '(xpos|eservis)' || true")

if [ -z "$containers" ]; then
    log_error "No xpos or eservis containers found running!"
    log_warn "Please ensure your application containers are running first."
    exit 1
fi

log_info "Found containers:"
echo "$containers"
log_warn ""

log_warn "=== Installation Instructions ==="
log_warn ""
log_warn "If using official PHP Docker images (php:8.x-fpm or similar):"
log_warn "Add these lines to your Dockerfile BEFORE the final CMD/ENTRYPOINT:"
log_warn ""
echo 'RUN pecl install redis && docker-php-ext-enable redis'
log_warn ""
log_warn "Then rebuild your containers:"
log_warn "  docker-compose build"
log_warn "  docker-compose up -d"
log_warn ""
log_warn "=== Alternative: Install in running container (temporary) ==="
log_warn ""
log_warn "To install in a running container (will be lost on restart):"
log_warn ""

for container in $containers; do
    log_info "For container: $container"
    log_warn "Run on server:"
    echo "  docker exec $container bash -c 'pecl install redis && docker-php-ext-enable redis'"
    echo "  docker restart $container"
    log_warn ""
done

log_warn "=== Verify Installation ==="
log_warn ""
log_warn "After installation, verify phpredis is loaded:"
log_warn ""

for container in $containers; do
    log_info "For container: $container"
    echo "  docker exec $container php -m | grep redis"
    log_warn ""
done

log_warn "=== Testing Redis Connection ==="
log_warn ""
log_warn "Test Redis connection from Laravel:"
log_warn "SSH to server and run:"
log_warn ""
for container in $containers; do
    log_info "For container: $container"
    echo "  docker exec $container php artisan tinker"
    echo "  >>> Redis::connection()->ping()"
    echo "  >>> // Should return '+PONG'"
    log_warn ""
done

log_info "Installation guide complete!"
log_warn ""
log_warn "IMPORTANT: For permanent installation, update your Dockerfile"
log_warn "and rebuild your containers as shown above."
