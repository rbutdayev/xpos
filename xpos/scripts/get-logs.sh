#!/bin/bash

# =====================================================
# ONYX XPOS - Get Laravel Logs Script
# =====================================================
# This script retrieves the last 20 Laravel logs from the server
# Run: ./get-logs.sh [server_ip]
# Example: ./get-logs.sh 192.168.1.100

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

print_status "Connecting to $SERVER_IP to retrieve Laravel logs..."

# Get the last 30 log entries
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
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if logs directory exists
if [ ! -d "$APP_PATH/storage/logs" ]; then
    print_error "Logs directory not found: $APP_PATH/storage/logs"
    exit 1
fi

# Show what's in the logs directory
print_status "Contents of $APP_PATH/storage/logs:"
ls -lah "$APP_PATH/storage/logs/" 2>/dev/null || print_error "Cannot list directory"
echo ""

# Try to find any log files (Laravel default naming)
LOG_FILE="$APP_PATH/storage/logs/laravel-$(date +%Y-%m-%d).log"

# Check if today's log file exists
if [ ! -f "$LOG_FILE" ]; then
    print_error "Today's log file not found: $LOG_FILE"
    print_status "Looking for recent log files..."

    # Try different log file patterns
    RECENT_LOG=$(ls -t $APP_PATH/storage/logs/laravel-*.log 2>/dev/null | head -1)

    if [ -z "$RECENT_LOG" ]; then
        # Try any .log file
        RECENT_LOG=$(ls -t $APP_PATH/storage/logs/*.log 2>/dev/null | head -1)
    fi

    if [ -z "$RECENT_LOG" ]; then
        print_error "No log files found in $APP_PATH/storage/logs/"
        print_status "Checking Laravel error logs from web server..."
        echo ""

        # Check nginx error logs for PHP errors
        print_status "=== Nginx Error Log (last 20 lines) ==="
        sudo tail -20 /var/log/nginx/error.log 2>/dev/null || print_error "Cannot access nginx error log"
        echo ""

        # Check PHP-FPM logs
        print_status "=== PHP-FPM Error Log (last 20 lines) ==="
        sudo tail -20 /var/log/php8.3-fpm.log 2>/dev/null || print_error "Cannot access PHP-FPM log"
        echo ""

        # Check application permissions
        print_status "=== Storage Directory Permissions ==="
        ls -la "$APP_PATH/storage/" 2>/dev/null || print_error "Cannot check storage permissions"
        echo ""

        print_status "No Laravel application logs found. Check permissions and ensure the application is running."
        exit 1
    fi

    LOG_FILE="$RECENT_LOG"
    print_status "Using most recent log file: $LOG_FILE"
fi

print_status "Reading last 20 log entries from: $LOG_FILE"
echo ""
echo "========================================"
echo "LAST 20 LARAVEL LOG ENTRIES"
echo "========================================"
echo ""

# Get last 20 log entries (each entry starts with [YYYY-MM-DD)
grep -n '\[20[0-9][0-9]-' "$LOG_FILE" | tail -20 | while IFS=: read -r line_num rest; do
    # Print from this line number to the next entry or end of file
    sed -n "${line_num}p" "$LOG_FILE"

    # Also print any continuation lines (that don't start with [date])
    next_line=$((line_num + 1))
    while true; do
        line_content=$(sed -n "${next_line}p" "$LOG_FILE")

        # Stop if empty or starts with new log entry
        if [ -z "$line_content" ] || echo "$line_content" | grep -q '^\[20[0-9][0-9]-'; then
            break
        fi

        echo "$line_content"
        next_line=$((next_line + 1))
    done
    echo ""
done

print_success "Log retrieval completed"

ENDSSH

print_success "Done!"
