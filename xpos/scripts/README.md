# ONYX xPos Deployment Scripts

This directory contains automated deployment scripts for deploying the ONYX xPos Laravel application to an Ubuntu server.

## Scripts Overview

### 1. `setup-server.sh` - Initial Server Setup
Sets up a fresh Ubuntu 24.04 server with all required prerequisites.

**What it does:**
- Updates system packages
- Installs PHP 8.3 with all required extensions
- Installs and configures Nginx
- Installs Node.js 20.x for frontend assets
- Installs Redis, Supervisor, and other dependencies
- Configures firewall (UFW)
- Prepares SSL certificate setup
- Sets PHP 8.3 as the default version

**Usage:**
```bash
cd /path/to/xpos
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh <server_ip> <domain_name>
```

**Example:**
```bash
./scripts/setup-server.sh 20.218.170.234 xpos.az
```

**Prerequisites:**
- Ubuntu 24.04 LTS server
- SSH access with username: `onyx` and configured password
- `sshpass` installed on your local machine:
  - macOS: `brew install sshpass`
  - Linux: `sudo apt-get install sshpass`

### 2. `deploy-app.sh` - Application Deployment
Deploys the Laravel application to the configured server.

**What it does:**
- Creates deployment archive (excludes unnecessary files)
- Transfers files to server via SCP
- Installs Composer dependencies (production mode)
- Installs NPM dependencies and builds frontend assets
- Configures environment variables from `.env.production`
- Runs database migrations
- Optimizes application (caches config, routes, views)
- Restarts services (PHP-FPM, Nginx)
- Installs SSL certificate with Let's Encrypt
- Sets up auto-renewal for SSL

**Usage:**
```bash
cd /path/to/xpos
chmod +x scripts/deploy-app.sh
./scripts/deploy-app.sh <server_ip> <domain_name>
```

**Example:**
```bash
./scripts/deploy-app.sh 20.218.170.234 xpos.az
```

**Prerequisites:**
- Server must be configured with `setup-server.sh` first
- Domain DNS must point to the server IP
- `.env.production` file must exist in the project root

## Complete Deployment Process

### Step 1: Initial Server Setup
Run this **once** for a new server:
```bash
./scripts/setup-server.sh 20.218.170.234 xpos.az
```

**What to expect:**
- Takes 5-10 minutes depending on server speed
- Installs all system packages and dependencies
- Configures Nginx and PHP-FPM
- Sets up firewall and services

### Step 2: Deploy Application
Run this for initial deployment and subsequent updates:
```bash
./scripts/deploy-app.sh 20.218.170.234 xpos.az
```

**What to expect:**
- Takes 3-5 minutes
- Builds frontend assets
- Installs dependencies
- Runs database migrations
- Sets up SSL certificate (first time only)

### Step 3: Verify Deployment
After deployment completes:
1. Visit `https://your-domain.com`
2. Check SSL certificate is active (should auto-redirect to HTTPS)
3. Verify application loads correctly

## Server Configuration

### SSH Credentials
- **Username:** `onyx`
- **Password:** Configured in scripts (update if needed)
- **Server Path:** `/var/www/xpos`

### Services
- **Nginx:** Web server (port 80/443)
- **PHP-FPM 8.3:** PHP processor
- **Redis:** Cache and queue backend
- **Supervisor:** Queue worker management
- **Certbot:** SSL certificate management

### Important Paths
- Application: `/var/www/xpos`
- Nginx config: `/etc/nginx/sites-available/xpos`
- Logs: `/var/www/xpos/storage/logs/`
- SSL certificates: `/etc/letsencrypt/live/domain.com/`

## Environment Configuration

The deployment uses `.env.production` file from your project root. Make sure to configure:

```env
APP_URL=https://your-domain.com
DB_CONNECTION=mysql
DB_HOST=your-database-host
DB_DATABASE=xpos
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
```

## Troubleshooting

### SSL Certificate Issues
If SSL setup fails:
```bash
# SSH into server
ssh onyx@server-ip

# Manually install SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Database Connection Issues
Check database credentials:
```bash
ssh onyx@server-ip
cd /var/www/xpos
sudo -u www-data php artisan tinker
DB::connection()->getPdo();
```

### Application Errors
Check logs:
```bash
ssh onyx@server-ip
tail -f /var/www/xpos/storage/logs/laravel.log
```

### Nginx Issues
Test configuration:
```bash
ssh onyx@server-ip
sudo nginx -t
sudo systemctl status nginx
```

### PHP-FPM Issues
Check PHP-FPM status:
```bash
ssh onyx@server-ip
sudo systemctl status php8.3-fpm
```

## Re-deployment / Updates

For subsequent deployments (code updates):
```bash
./scripts/deploy-app.sh 20.218.170.234 xpos.az
```

The script will:
- Backup existing application
- Deploy new code
- Update dependencies
- Run new migrations (if any)
- Restart services

## Security Notes

1. **SSH Credentials:** Update the SSH password in both scripts for production use
2. **Database:** Use strong passwords for database connections
3. **Firewall:** Only ports 22 (SSH), 80 (HTTP), 443 (HTTPS) are open
4. **SSL:** Certificates auto-renew via cron job
5. **File Permissions:** Application runs as `www-data` user

## Recent Fixes (2025-10-16)

### setup-server.sh
- ✅ Fixed PHP 8.3 extension installation (all required extensions)
- ✅ Set PHP 8.3 as default (handles multi-version environments)
- ✅ Fixed nginx config file creation (permission issues)
- ✅ Fixed supervisor config file creation
- ✅ Improved nginx symlink management

### deploy-app.sh
- ✅ Fixed composer to use PHP 8.3 explicitly (not 8.4)
- ✅ Added automatic nginx config creation if missing
- ✅ Improved SSL certificate installation (both domain and www)
- ✅ Better error handling and validation
- ✅ Fixed nginx configuration before SSL setup

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs
3. Verify all prerequisites are met
4. Check that DNS is properly configured

## License

Part of ONYX xPos project.
