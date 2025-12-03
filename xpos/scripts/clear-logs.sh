#!/bin/bash

# =====================================================
# ONYX XPOS - Clear Laravel Logs Script
# =====================================================
# This script clears all Laravel logs from the server
# Run: ./clear-logs.sh [server_ip]
# Example: ./clear-logs.sh 192.168.1.100

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check parameters
if [ $# -lt 1 ]; then
    print_error "Usage: $0 <server_ip>"
    print_error "Example: $0 192.168.1.100"
    exit 1
fi

SERVER_IP="$1"
APP_NAME="xpos"
APP_PATH="/var/www/$APP_NAME"

# SSH configuration
SSH_USER="onyx"
SSH_PASS="QFxOxVYJ4SPiPC"
SSH_OPTIONS="-o StrictHostKeyChecking=no"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass is not installed. Please install it first:"
    print_error "  macOS: brew install sshpass"
    print_error "  Linux: sudo apt-get install sshpass"
    exit 1
fi

print_status "Connecting to $SERVER_IP to clear Laravel logs..."

# Clear all logs
sshpass -p "$SSH_PASS" ssh $SSH_OPTIONS $SSH_USER@$SERVER_IP << 'ENDSSH'
# Export variables for the SSH session
export APP_PATH="/var/www/xpos"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if logs directory exists
if [ ! -d "$APP_PATH/storage/logs" ]; then
    print_error "Logs directory not found: $APP_PATH/storage/logs"
    exit 1
fi

print_status "Listing current log files..."
ls -lh "$APP_PATH/storage/logs/" 2>/dev/null || print_warning "Cannot list directory"
echo ""

# Count log files before deletion
LOG_COUNT=$(find "$APP_PATH/storage/logs" -type f -name "*.log" 2>/dev/null | wc -l)
print_status "Found $LOG_COUNT log file(s) to delete"

if [ "$LOG_COUNT" -eq 0 ]; then
    print_success "No log files to delete"
    exit 0
fi

# Clear all log files
print_status "Clearing all Laravel log files..."

# Remove all .log files
sudo rm -f "$APP_PATH/storage/logs/"*.log 2>/dev/null || true

# Also clear Laravel cache logs if any
sudo rm -f "$APP_PATH/storage/logs/"*.txt 2>/dev/null || true

# Verify deletion
REMAINING=$(find "$APP_PATH/storage/logs" -type f -name "*.log" 2>/dev/null | wc -l)

if [ "$REMAINING" -eq 0 ]; then
    print_success "All log files cleared successfully"
    print_status "Deleted $LOG_COUNT log file(s)"
else
    print_warning "Some log files remain: $REMAINING file(s)"
fi

# Show directory after cleanup
echo ""
print_status "Logs directory after cleanup:"
ls -lh "$APP_PATH/storage/logs/" 2>/dev/null || print_warning "Cannot list directory"

# Clear Laravel application cache (optional but recommended)
print_status "Clearing Laravel cache..."
cd "$APP_PATH"
sudo -u www-data php artisan cache:clear 2>/dev/null || print_warning "Could not clear cache"
sudo -u www-data php artisan view:clear 2>/dev/null || print_warning "Could not clear view cache"

print_success "Log cleanup completed"

ENDSSH

print_success "Done!"
