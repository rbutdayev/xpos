#!/bin/bash

# Docker Setup Script
# Installs Docker and Docker Compose on the server

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

log_info "Checking if Docker is already installed..."
if remote_exec "command -v docker &> /dev/null"; then
    log_info "Docker is already installed, skipping installation"
else
    log_info "Installing Docker..."

    # Add Docker's official GPG key
    remote_exec "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg"

    # Set up the Docker repository
    remote_exec "echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null"

    # Install Docker
    remote_exec "sudo apt-get update"
    remote_exec "sudo apt-get install -y docker-ce docker-ce-cli containerd.io"

    # Add user to docker group
    remote_exec "sudo usermod -aG docker $SSH_USER"

    log_info "Docker installed successfully"
fi

log_info "Checking if Docker Compose is already installed..."
if remote_exec "command -v docker-compose &> /dev/null"; then
    log_info "Docker Compose is already installed, skipping installation"
else
    log_info "Installing Docker Compose..."
    remote_exec "sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    remote_exec "sudo chmod +x /usr/local/bin/docker-compose"
    log_info "Docker Compose installed successfully"
fi

log_info "Starting Docker service..."
remote_exec "sudo systemctl enable docker"
remote_exec "sudo systemctl start docker"

log_info "Docker setup completed!"
remote_exec "docker --version"
remote_exec "docker-compose --version"
