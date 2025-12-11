#!/bin/bash

# Check Production Logs and PHP Settings

set -e

SERVER_IP="20.218.170.234"
SSH_USER="onyx"
SSH_PASS="QFxOxVYJ4SPiPC"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

remote_exec() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

log_info "Checking current PHP settings..."
remote_exec "php -r \"echo 'upload_max_filesize: ' . ini_get('upload_max_filesize') . PHP_EOL;\""
remote_exec "php -r \"echo 'post_max_size: ' . ini_get('post_max_size') . PHP_EOL;\""
remote_exec "php -r \"echo 'memory_limit: ' . ini_get('memory_limit') . PHP_EOL;\""
remote_exec "php -r \"echo 'max_execution_time: ' . ini_get('max_execution_time') . PHP_EOL;\""

log_info "Checking PHP-FPM status..."
remote_exec "sudo systemctl status php*-fpm --no-pager | head -10"

log_info "Last 30 lines of Laravel log..."
remote_exec "tail -30 ~/apps/xpos/storage/logs/laravel.log"

log_info "Last 20 lines of nginx error log..."
remote_exec "sudo tail -20 /var/log/nginx/prod_xpos_error.log"
