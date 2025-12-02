#!/bin/bash

# Redis Setup Script
# Installs and runs Redis in a Docker container

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

log_info "Creating Docker network for app containers..."
remote_exec "docker network create app-network || true"

log_info "Setting up Redis container..."

# Stop and remove existing Redis container if exists
remote_exec "docker stop redis || true"
remote_exec "docker rm redis || true"

# Run Redis container on the app network
log_info "Starting Redis container..."
remote_exec "docker run -d \
  --name redis \
  --network app-network \
  --restart unless-stopped \
  redis:7-alpine redis-server --appendonly yes"

log_info "Redis container started successfully!"
log_info "Redis is available at:"
log_info "  - From other containers: redis:6379"
log_info "  - Network: app-network"
log_info ""
log_info "Connect from your app containers with:"
log_info "  REDIS_HOST=redis"
log_info "  REDIS_PORT=6379"
log_info "  REDIS_PASSWORD=null"

# Verify Redis is running
remote_exec "docker ps | grep redis"
