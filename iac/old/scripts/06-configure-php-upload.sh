#!/bin/bash

# PHP Upload Configuration Script
# Updates PHP upload limits for production server

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

remote_exec() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

log_info "Checking current PHP version..."
PHP_VERSION=$(remote_exec "php -r 'echo PHP_MAJOR_VERSION . \".\" . PHP_MINOR_VERSION;'")
log_info "PHP Version: $PHP_VERSION"

log_info "Finding PHP-FPM configuration file..."
PHP_FPM_INI="/etc/php/$PHP_VERSION/fpm/php.ini"
log_info "PHP-FPM INI: $PHP_FPM_INI"

log_info "Current upload settings:"
remote_exec "php -r \"echo 'upload_max_filesize: ' . ini_get('upload_max_filesize') . PHP_EOL;\""
remote_exec "php -r \"echo 'post_max_size: ' . ini_get('post_max_size') . PHP_EOL;\""
remote_exec "php -r \"echo 'max_execution_time: ' . ini_get('max_execution_time') . PHP_EOL;\""
remote_exec "php -r \"echo 'memory_limit: ' . ini_get('memory_limit') . PHP_EOL;\""

log_info "Updating PHP-FPM upload settings..."
remote_exec "sudo sed -i 's/^upload_max_filesize = .*/upload_max_filesize = 20M/' $PHP_FPM_INI"
remote_exec "sudo sed -i 's/^post_max_size = .*/post_max_size = 25M/' $PHP_FPM_INI"
remote_exec "sudo sed -i 's/^max_execution_time = .*/max_execution_time = 300/' $PHP_FPM_INI"
remote_exec "sudo sed -i 's/^memory_limit = .*/memory_limit = 2G/' $PHP_FPM_INI"

log_info "Restarting PHP-FPM to apply changes..."
remote_exec "sudo systemctl restart php$PHP_VERSION-fpm"

log_info "New upload settings (after restart):"
remote_exec "php -r \"echo 'upload_max_filesize: ' . ini_get('upload_max_filesize') . PHP_EOL;\""
remote_exec "php -r \"echo 'post_max_size: ' . ini_get('post_max_size') . PHP_EOL;\""
remote_exec "php -r \"echo 'max_execution_time: ' . ini_get('max_execution_time') . PHP_EOL;\""
remote_exec "php -r \"echo 'memory_limit: ' . ini_get('memory_limit') . PHP_EOL;\""

log_info "Verifying PHP-FPM status..."
remote_exec "sudo systemctl status php$PHP_VERSION-fpm --no-pager | head -5"

log_info "PHP upload configuration completed and PHP-FPM restarted!"
