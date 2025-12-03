#!/bin/bash

# =====================================================
# ONYX XPOS - Application Deployment Script
# =====================================================
# This script deploys the Laravel application to an already configured server
# Run: ./deploy-app.sh [server_ip] [domain_name]
# Example: ./deploy-app.sh 192.168.1.100 xpos.com
#
# Updates (2025-10-16):
# - Fixed composer install to use PHP 8.3 explicitly (not PHP 8.4)
# - Added automatic nginx config creation if missing
# - Fixed SSL certificate installation (try both domain and www)
# - Improved nginx configuration validation before SSL setup
# - Better error handling and fallback for SSL setup
#
# Updates (2025-11-02):
# - Added automatic Redis configuration enforcement on deployment
# - Ensures CACHE_STORE, QUEUE_CONNECTION, SESSION_DRIVER use Redis
# - Sets REDIS_CLIENT=predis for compatibility

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
    print_error ""
    print_error "Note: Server must be already configured with setup-server.sh"
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

print_status "Starting application deployment to $SERVER_IP for domain $DOMAIN_NAME"

# =====================================================
# LOCAL PREPARATION
# =====================================================
print_status "Preparing application for deployment..."

# Create deployment archive
print_status "Creating deployment archive..."

# Set COPYFILE_DISABLE to prevent macOS extended attributes
export COPYFILE_DISABLE=1

tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='vendor' \
    --exclude='storage/logs/*' \
    --exclude='storage/framework/cache/*' \
    --exclude='storage/framework/sessions/*' \
    --exclude='storage/framework/views/*' \
    --exclude='.env' \
    --exclude='xpos-deploy.tar.gz' \
    --exclude='scripts/' \
    --exclude='.phpunit.result.cache' \
    --exclude='temp' \
    --exclude='*.DS_Store' \
    --no-mac-metadata \
    --no-xattrs \
    -czf xpos-deploy.tar.gz .

print_success "Deployment archive created"

# =====================================================
# APPLICATION DEPLOYMENT FUNCTION
# =====================================================
deploy_application() {
    # Transfer files to server
    print_status "Transferring application files..."
    sshpass -p "$SSH_PASS" scp $SSH_OPTIONS xpos-deploy.tar.gz $SSH_USER@$SERVER_IP:/tmp/

    sshpass -p "$SSH_PASS" ssh $SSH_OPTIONS $SSH_USER@$SERVER_IP << ENDSSH
# Export variables for the SSH session
export APP_PATH="$APP_PATH"
export DOMAIN_NAME="$DOMAIN_NAME"
export APP_NAME="$APP_NAME"

# Function definitions for SSH session
print_status() { echo -e "\033[0;34m[INFO]\033[0m \$1"; }
print_success() { echo -e "\033[0;32m[SUCCESS]\033[0m \$1"; }
print_error() { echo -e "\033[0;31m[ERROR]\033[0m \$1"; }
print_warning() { echo -e "\033[1;33m[WARNING]\033[0m \$1"; }

print_status "=== ONYX XPOS APPLICATION DEPLOYMENT ==="

# Check if server has basic prerequisites (less strict check)
if ! command -v nginx >/dev/null 2>&1; then
    print_error "Nginx not found! Please run setup-server.sh first:"
    print_error "  ./setup-server.sh $SERVER_IP $DOMAIN_NAME"
    exit 1
fi

print_status "Server prerequisites detected, continuing with deployment..."

# =====================================================
# BACKUP EXISTING APPLICATION (if exists)
# =====================================================
if [ -d "\$APP_PATH" ] && [ -f "\$APP_PATH/artisan" ]; then
    print_status "Backing up existing application..."
    sudo cp -r \$APP_PATH \$APP_PATH-backup-\$(date +%Y%m%d-%H%M%S)
    print_success "Backup created"
fi

# =====================================================
# DEPLOY APPLICATION
# =====================================================
print_status "Deploying application..."

# Create application directory
sudo mkdir -p \$APP_PATH
cd \$APP_PATH

# Remove old files (keep storage, .env, and .seeded marker if they exist)
if [ -f ".env" ]; then
    sudo cp .env /tmp/.env.backup
fi
if [ -d "storage" ]; then
    sudo cp -r storage /tmp/storage.backup
fi
if [ -f ".seeded" ]; then
    sudo cp .seeded /tmp/.seeded.backup
fi

# Clear application directory (except storage)
sudo find \$APP_PATH -mindepth 1 -maxdepth 1 ! -name 'storage' -exec rm -rf {} +

# Extract new application
sudo tar -xzf /tmp/xpos-deploy.tar.gz -C \$APP_PATH 2>/dev/null
rm /tmp/xpos-deploy.tar.gz

# Remove cached service providers to avoid conflicts
sudo rm -rf \$APP_PATH/bootstrap/cache/*

# Restore storage if it was backed up
if [ -d "/tmp/storage.backup" ]; then
    sudo rm -rf \$APP_PATH/storage
    sudo mv /tmp/storage.backup \$APP_PATH/storage
fi

# Restore .seeded marker if it was backed up
if [ -f "/tmp/.seeded.backup" ]; then
    sudo mv /tmp/.seeded.backup \$APP_PATH/.seeded
fi

# Set permissions
sudo chown -R www-data:www-data \$APP_PATH
sudo chmod -R 755 \$APP_PATH
sudo chmod -R 775 \$APP_PATH/storage \$APP_PATH/bootstrap/cache

print_success "Application files deployed"

# =====================================================
# INSTALL DEPENDENCIES
# =====================================================
print_status "Installing dependencies..."

cd \$APP_PATH

# Fix NPM cache permissions first
sudo chown -R www-data:www-data /var/www/.npm /var/www/.cache 2>/dev/null || true

# Install Composer dependencies with proper PHP version
# Ensure we're using PHP 8.3 (not 8.4 or other versions)
sudo -u www-data /usr/bin/php8.3 /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction

# Install NPM dependencies and build assets
sudo -u www-data npm ci --cache /tmp/.npm --legacy-peer-deps
sudo -u www-data npm run build

# Verify build was successful
if [ ! -f "public/build/manifest.json" ]; then
    print_error "Build failed! manifest.json not found"
    exit 1
else
    print_success "Build manifest found: public/build/manifest.json"
    # Show build files for debugging
    ls -lh public/build/assets/ | head -5
fi

# Remove Vite hot file (prevents dev server mode in production)
if [ -f "public/hot" ]; then
    sudo rm -f public/hot
    print_success "Removed Vite hot file (ensures production mode)"
fi

print_success "Dependencies installed and assets built successfully"

# =====================================================
# CONFIGURE APPLICATION
# =====================================================
print_status "Configuring application..."

# Always use .env.production for deployment
# Keep backup for emergency rollback only
if [ -f ".env.production" ]; then
    sudo cp .env.production .env
    # Replace domain placeholder if exists
    sudo sed -i "s/DOMAIN_NAME_PLACEHOLDER/\$DOMAIN_NAME/g" .env
    print_success "Using .env.production file with domain: \$DOMAIN_NAME"
else
    print_error ".env.production file not found in deployment!"
    exit 1
fi

# Ensure Redis configuration is applied (overrides old database settings)
print_status "Ensuring Redis configuration..."
sudo sed -i 's/^CACHE_STORE=.*/CACHE_STORE=redis/' .env
sudo sed -i 's/^QUEUE_CONNECTION=.*/QUEUE_CONNECTION=redis/' .env
sudo sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=redis/' .env

# Add or update REDIS_CLIENT setting
if grep -q "^REDIS_CLIENT=" .env; then
    sudo sed -i 's/^REDIS_CLIENT=.*/REDIS_CLIENT=predis/' .env
else
    # Add REDIS_CLIENT before REDIS_HOST if it exists
    if grep -q "^REDIS_HOST=" .env; then
        sudo sed -i '/^REDIS_HOST=/i REDIS_CLIENT=predis' .env
    else
        # Otherwise append to end of file
        echo "REDIS_CLIENT=predis" | sudo tee -a .env > /dev/null
    fi
fi
print_success "Redis configuration applied"

# Verify critical production settings
print_status "Verifying production environment settings..."
grep "^APP_ENV=" .env
grep "^APP_DEBUG=" .env
grep "^APP_URL=" .env

# Generate application key if not set or malformed
if ! grep -q "^APP_KEY=base64:[A-Za-z0-9+/=]\{44\}$" .env; then
    # Clean any malformed APP_KEY first
    sudo sed -i 's/APP_KEY=.*/APP_KEY=/' .env
    sudo -u www-data php artisan key:generate --force
fi

# Fix storage directory structure 
sudo mkdir -p storage/framework/{sessions,views,cache}
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Set proper ownership for .env
sudo chown www-data:www-data .env
sudo chmod 644 .env

print_success "Application configured"

# =====================================================
# SSL CERTIFICATE FOR AZURE MYSQL
# =====================================================
print_status "Setting up SSL certificate for Azure MySQL..."

# Create SSL directory and download DigiCert certificate
sudo mkdir -p /opt/ssl
if [ ! -f "/opt/ssl/DigiCertGlobalRootCA.crt.pem" ]; then
    sudo wget -O /opt/ssl/DigiCertGlobalRootCA.crt.pem https://www.digicert.com/CACerts/DigiCertGlobalRootCA.crt
    sudo chmod 644 /opt/ssl/DigiCertGlobalRootCA.crt.pem
    print_success "Azure MySQL SSL certificate downloaded"
else
    print_status "SSL certificate already exists"
fi

# =====================================================
# DATABASE OPERATIONS
# =====================================================
print_status "Checking database connection..."

# Skip database connection test - deploy first, then test
print_status "Skipping database connection test during deployment"
print_status "Will test connection after full deployment"

# Run migrations (will create connection then)
print_status "Running database migrations..."
if sudo -u www-data php artisan migrate --force; then
    print_success "Database migrations completed successfully"
    
    # Run seeders only if this is a fresh installation
    if [ ! -f "$APP_PATH/.seeded" ]; then
        print_status "Running database seeders..."
        if sudo -u www-data php artisan db:seed --force; then
            sudo touch $APP_PATH/.seeded
            print_success "Database seeded"
        else
            print_warning "Database seeding failed - continuing deployment"
        fi
    else
        print_status "Skipping seeders (already seeded)"
    fi
else
    print_warning "Database migrations failed - continuing deployment"
    print_warning "Please run migrations manually after deployment:"
    print_warning "  ssh $SSH_USER@$SERVER_IP"
    print_warning "  cd $APP_PATH"
    print_warning "  sudo -u www-data php artisan migrate --force"
fi

print_success "Database operations completed"

# =====================================================
# OPTIMIZE APPLICATION
# =====================================================
print_status "Optimizing application..."

# Clear ALL caches including bootstrap cache (critical for fresh deployments)
sudo rm -rf \$APP_PATH/bootstrap/cache/*
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan cache:clear
sudo -u www-data php artisan view:clear 2>/dev/null || print_warning "View cache clear skipped"
sudo -u www-data php artisan route:clear

# Wait a moment for file system sync
sleep 2

# Cache configuration for production
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache 2>/dev/null || print_warning "View cache creation skipped"

# Restart PHP-FPM to apply changes
sudo systemctl restart php8.3-fpm

# Create storage link
sudo -u www-data php artisan storage:link

print_success "Application optimized"

# =====================================================
# RESTART SERVICES
# =====================================================
print_status "Restarting services..."

# Restart PHP-FPM
sudo systemctl restart php8.3-fpm

# Restart queue workers (ignore errors if supervisor group doesn't exist)
sudo supervisorctl restart \$APP_NAME-worker:* 2>/dev/null || print_warning "Queue workers not configured yet"

# Restart Nginx
sudo systemctl restart nginx

print_success "Services restarted"

# =====================================================
# SSL CERTIFICATE SETUP
# =====================================================
print_status "Setting up SSL certificate..."

# First ensure nginx config exists and is valid
if [ ! -f "/etc/nginx/sites-available/\$APP_NAME" ]; then
    print_warning "Nginx configuration not found. Creating it now..."

    # Create nginx config if missing
    sudo tee /etc/nginx/sites-available/\$APP_NAME > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    root APP_PATH_PLACEHOLDER/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    index index.html index.htm index.php;

    charset utf-8;

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

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private no_last_modified no_etag auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
NGINXEOF

    sudo sed -i "s/DOMAIN_PLACEHOLDER/\$DOMAIN_NAME/g" /etc/nginx/sites-available/\$APP_NAME
    sudo sed -i "s|APP_PATH_PLACEHOLDER|\$APP_PATH|g" /etc/nginx/sites-available/\$APP_NAME

    # Clean up and enable site
    sudo rm -rf /etc/nginx/sites-enabled/sites-available
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo ln -sf /etc/nginx/sites-available/\$APP_NAME /etc/nginx/sites-enabled/\$APP_NAME

    sudo nginx -t && sudo systemctl restart nginx
fi

# Install SSL certificate (try with both main and www subdomain)
if sudo certbot --nginx -d \$DOMAIN_NAME -d www.\$DOMAIN_NAME --non-interactive --agree-tos --email admin@\$DOMAIN_NAME --redirect 2>/dev/null; then
    print_success "SSL certificate installed successfully"

    # Setup auto-renewal if not already configured
    if ! sudo crontab -l 2>/dev/null | grep -q "certbot renew"; then
        (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
        print_success "SSL auto-renewal configured"
    fi
elif sudo certbot --nginx -d \$DOMAIN_NAME --non-interactive --agree-tos --email admin@\$DOMAIN_NAME --redirect 2>/dev/null; then
    print_success "SSL certificate installed for main domain"
else
    print_warning "SSL certificate installation failed"
    print_warning "Please ensure:"
    print_warning "1. Domain \$DOMAIN_NAME points to this server"
    print_warning "2. Ports 80 and 443 are accessible"
    print_warning "3. Run manually: sudo certbot --nginx -d \$DOMAIN_NAME -d www.\$DOMAIN_NAME"
fi

# =====================================================
# FINAL SETUP
# =====================================================
print_status "Applying final configurations..."

# Setup cron job for Laravel scheduler if not exists
if ! sudo crontab -l 2>/dev/null | grep -q "artisan schedule:run"; then
    (sudo crontab -l 2>/dev/null; echo "* * * * * cd \$APP_PATH && php artisan schedule:run >> /dev/null 2>&1") | sudo crontab -
    print_success "Laravel scheduler configured"
fi

# Set final permissions
sudo chown -R www-data:www-data \$APP_PATH
sudo chmod -R 755 \$APP_PATH
sudo chmod -R 775 \$APP_PATH/storage \$APP_PATH/bootstrap/cache

print_success "=== APPLICATION DEPLOYMENT COMPLETED ==="
print_success "Application URL: https://\$DOMAIN_NAME"
print_success "Server IP: \$(hostname -I | awk '{print \$1}')"
print_success "Application Path: \$APP_PATH"

# Check application status
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|302"; then
    print_success "Application is responding correctly"
else
    print_warning "Application may not be responding - check nginx and php-fpm status"
fi

ENDSSH
}

# =====================================================
# EXECUTE DEPLOYMENT
# =====================================================
print_status "Connecting to server and starting deployment..."

# Try to deploy directly (remove connectivity check for debugging)
print_status "Attempting deployment..."
deploy_application

# Cleanup
rm -f xpos-deploy.tar.gz

print_success "Application deployment completed successfully!"
print_success ""
print_status "Application Details:"
print_status "- URL: https://$DOMAIN_NAME"
print_status "- Server IP: $SERVER_IP"
print_status "- Application Path: $APP_PATH"
print_status ""
print_status "Post-deployment tasks:"
print_status "1. Verify application is accessible at https://$DOMAIN_NAME"
print_status "2. Configure Azure MySQL connection in .env if needed"
print_status "3. Check application logs: $APP_PATH/storage/logs/"
print_status "4. Monitor queue workers: sudo supervisorctl status"
print_status ""
print_success "Deployment completed successfully!"