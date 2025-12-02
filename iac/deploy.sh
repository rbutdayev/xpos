#!/bin/bash

# Main Deployment Script
# This script orchestrates the deployment of multiple applications to the server

set -e

# Configuration
SERVER_IP="20.218.139.129"
SSH_USER="onyx"
SSH_PASS="vonqud-kiqze5-hyWtit"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    log_error "sshpass is not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

# Function to execute commands on remote server
remote_exec() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

# Function to copy files to remote server
remote_copy() {
    local src=$1
    local dest=$2
    sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no -r "$src" "$SSH_USER@$SERVER_IP:$dest"
}

# Main deployment flow
main() {
    log_info "Starting infrastructure deployment to $SERVER_IP"

    # Step 1: Initial server setup
    log_info "Step 1: Setting up server dependencies..."
    bash "$SCRIPT_DIR/scripts/01-setup-server.sh"

    # Step 2: Setup Docker
    log_info "Step 2: Setting up Docker..."
    bash "$SCRIPT_DIR/scripts/02-setup-docker.sh"

    # Step 3: Setup Nginx with SSL
    log_info "Step 3: Setting up Nginx with SSL..."
    bash "$SCRIPT_DIR/scripts/03-setup-nginx.sh"

    log_info "Infrastructure deployment completed successfully!"
    log_info ""
    log_info "Server is ready for your applications:"
    log_info "  - Docker and Docker Compose installed"
    log_info "  - Nginx configured for xpos.az (port 8000) and eservis.az (port 8001)"
    log_info "  - Firewall configured (ports 22, 80, 443)"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Point your domains to this server IP: $SERVER_IP"
    log_info "  2. SSH to server and run certbot for SSL certificates"
    log_info "  3. Deploy your applications using Docker"
}

# Run main function
main
