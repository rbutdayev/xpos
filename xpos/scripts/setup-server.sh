#!/bin/bash

# =====================================================
# ONYX XPOS - Server Setup Script
# =====================================================
# This script sets up a fresh Ubuntu server with all prerequisites
# Run: ./setup-server.sh [server_ip] [domain_name]
# Example: ./setup-server.sh 192.168.1.100 xpos.com
#
# Updates (2025-10-16):
# - Fixed PHP extension installation (added all required extensions)
# - Added PHP 8.3 as default alternative (handles multi-PHP environments)
# - Fixed nginx config file creation using tee (permission issues)
# - Fixed supervisor config file creation using tee
# - Fixed nginx symlink creation (cleanup old symlinks first)
# - Improved error handling and idempotency

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
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <server_ip> <domain_name>"
    print_error "Example: $0 192.168.1.100 xpos.com"
    exit 1
fi

SERVER_IP="$1"
DOMAIN_NAME="$2"
APP_NAME="xpos"
APP_PATH="/var/www/$APP_NAME"

# SSH configuration for password-based authentication
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

print_status "Starting server setup for $SERVER_IP"

# =====================================================
# SERVER SETUP FUNCTION
# =====================================================
setup_server() {
    sshpass -p "$SSH_PASS" ssh $SSH_OPTIONS $SSH_USER@$SERVER_IP << ENDSSH

# Function definitions
print_status() { echo -e "\033[0;34m[INFO]\033[0m \$1"; }
print_success() { echo -e "\033[0;32m[SUCCESS]\033[0m \$1"; }
print_error() { echo -e "\033[0;31m[ERROR]\033[0m \$1"; }

print_status "=== ONYX XPOS SERVER SETUP ==="
print_status "Setting up server for Laravel application..."

# =====================================================
# SYSTEM UPDATE
# =====================================================
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# =====================================================
# INSTALL PREREQUISITES
# =====================================================
print_status "Installing prerequisites..."

# Install basic packages
sudo apt install -y curl wget unzip git software-properties-common

# Add PHP repository
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.3 and ALL required extensions
sudo apt install -y php8.3 php8.3-fpm php8.3-cli php8.3-common \\
    php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip \\
    php8.3-gd php8.3-bcmath php8.3-intl php8.3-sqlite3 php8.3-redis \\
    php8.3-opcache php8.3-readline

# Set PHP 8.3 as the default version (important if multiple PHP versions exist)
sudo update-alternatives --set php /usr/bin/php8.3 || true
sudo update-alternatives --set phar /usr/bin/phar8.3 || true
sudo update-alternatives --set phar.phar /usr/bin/phar.phar8.3 || true

# Install Composer
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer

# Verify PHP installation
php --version || (print_error "PHP installation failed" && exit 1)

# Install Node.js (for frontend assets)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Redis
sudo apt install -y redis-server

# Install Supervisor (for queue workers)
sudo apt install -y supervisor

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

print_success "Prerequisites installed"

# =====================================================
# CONFIGURE PHP
# =====================================================
print_status "Configuring PHP..."

# Update PHP settings for production
sudo sed -i 's/max_execution_time = 30/max_execution_time = 300/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/memory_limit = 128M/memory_limit = 512M/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 64M/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/post_max_size = 8M/post_max_size = 64M/' /etc/php/8.3/fpm/php.ini

sudo systemctl restart php8.3-fpm
sudo systemctl enable php8.3-fpm

print_success "PHP configured"

# =====================================================
# CONFIGURE NGINX
# =====================================================
print_status "Setting up Nginx base configuration..."

# Create application directory
sudo mkdir -p $APP_PATH
sudo chown -R www-data:www-data $APP_PATH

# Create basic Nginx configuration - using tee to avoid permission issues
sudo tee /etc/nginx/sites-available/\$APP_NAME > /dev/null << 'EOF'
server {
    listen 80;
    server_name DOMAIN_NAME www.DOMAIN_NAME;
    root APP_PATH_PLACEHOLDER/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    index index.html index.htm index.php;

    charset utf-8;

    # Fix for large headers/cookies (prevents 502 Bad Gateway)
    fastcgi_buffer_size 128k;
    fastcgi_buffers 4 256k;
    fastcgi_busy_buffers_size 256k;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private no_last_modified no_etag auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
EOF

# Replace placeholders in nginx config
sudo sed -i "s/DOMAIN_NAME/\$DOMAIN_NAME/g" /etc/nginx/sites-available/\$APP_NAME
sudo sed -i "s|APP_PATH_PLACEHOLDER|\$APP_PATH|g" /etc/nginx/sites-available/\$APP_NAME

# Enable site - clean up any old symlinks first
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -rf /etc/nginx/sites-enabled/sites-available
sudo ln -sf /etc/nginx/sites-available/\$APP_NAME /etc/nginx/sites-enabled/\$APP_NAME

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

print_success "Nginx configured"

# =====================================================
# CONFIGURE SUPERVISOR
# =====================================================
print_status "Setting up Supervisor..."

# Use tee to avoid permission issues
sudo tee /etc/supervisor/conf.d/\$APP_NAME-worker.conf > /dev/null << EOF
[program:\$APP_NAME-worker]
process_name=%(program_name)s_%(process_num)02d
command=php \$APP_PATH/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=\$APP_PATH/storage/logs/worker.log
stopwaitsecs=3600
EOF

sudo supervisorctl reread
sudo supervisorctl update

print_success "Supervisor configured"

# =====================================================
# CONFIGURE FIREWALL
# =====================================================
print_status "Configuring firewall..."

sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

print_success "Firewall configured"

# =====================================================
# CONFIGURE SERVICES
# =====================================================
print_status "Configuring services..."

# Configure Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Enable all services
sudo systemctl enable nginx
sudo systemctl enable php8.3-fpm
sudo systemctl enable redis-server
sudo systemctl enable supervisor

print_success "Services configured"

# =====================================================
# SETUP SSL PREPARATION
# =====================================================
print_status "Preparing SSL setup..."

# Create a simple holding page
sudo mkdir -p \$APP_PATH/public
sudo tee \$APP_PATH/public/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>ONYX XPOS</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
        h1 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <h1>ONYX XPOS</h1>
    <p>Server is ready for deployment</p>
    <p>SSL certificate will be installed automatically</p>
</body>
</html>
EOF

sudo chown -R www-data:www-data \$APP_PATH

print_success "SSL preparation completed"

print_success "=== SERVER SETUP COMPLETED ==="
print_success "Server hostname: \$(hostname)"
print_success "Server IP: \$(hostname -I | awk '{print \$1}')"
print_success "Application path: $APP_PATH"
print_success ""
print_status "Next steps:"
print_status "1. Point your domain $DOMAIN_NAME to this server IP"
print_status "2. Configure Azure MySQL connection details"
print_status "3. Run deploy-app.sh to deploy your application"
print_status "4. SSL certificate will be installed during app deployment"

ENDSSH
}

# =====================================================
# EXECUTE SETUP
# =====================================================
print_status "Connecting to server and starting setup..."

# Check if we can connect to the server
if sshpass -p "$SSH_PASS" ssh $SSH_OPTIONS -o BatchMode=no -o ConnectTimeout=5 $SSH_USER@$SERVER_IP exit 2>/dev/null; then
    print_success "SSH connection successful"
    setup_server
else
    print_error "Cannot connect to server. Please check:"
    print_error "1. Server IP address: $SERVER_IP"
    print_error "2. Username and password are correct"
    print_error "3. Server is accessible from your network"
    exit 1
fi

print_success "Server setup completed successfully!"
print_success ""
print_status "Server Details:"
print_status "- Server IP: $SERVER_IP"
print_status "- Domain: $DOMAIN_NAME"
print_status "- Application Path: $APP_PATH"
print_status ""
print_warning "Important:"
print_warning "1. Make sure your domain DNS points to $SERVER_IP before running deploy-app.sh"
print_warning "2. Prepare your Azure MySQL connection details for deployment"
print_status ""
print_success "You can now run: ./deploy-app.sh $SERVER_IP $DOMAIN_NAME"