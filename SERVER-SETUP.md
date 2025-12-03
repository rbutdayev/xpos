# Server Setup Guide

## Initial Server Setup (One-time)

### 1. SSH into your server
```bash
ssh onyx@20.218.139.129
```

### 2. Create project directory and env file
```bash
mkdir -p /home/onyx/xpos
cd /home/onyx/xpos

# Create production env file
nano env.production
```

### 3. Paste your production environment variables
Copy from `xpos/env.production.example` and fill in your actual values:
- Database credentials (Azure MySQL)
- Redis credentials
- Azure Storage keys
- Mail settings
- APP_URL (your domain)

**Example:**
```env
APP_NAME="ONYX xPos"
APP_ENV=production
APP_KEY=base64:YOUR_ACTUAL_KEY_HERE
APP_DEBUG=false
APP_URL=https://domain1.com

DB_CONNECTION=mysql
DB_HOST=your-azure.mysql.database.azure.com
DB_PORT=3306
DB_DATABASE=xpos_prod
DB_USERNAME=xpos_user
DB_PASSWORD=your_secure_password

REDIS_HOST=your-redis.redis.cache.windows.net
REDIS_PASSWORD=your_redis_password
REDIS_PORT=6380

AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=onyxbms;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=xpos
```

Save and exit (Ctrl+X, Y, Enter)

### 4. Install Docker (if not installed)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker onyx

# Logout and login again for group changes
exit
```

## GitHub Actions Deployment

### How it works:
1. Push code to `main` branch
2. GitHub Actions automatically:
   - Builds Docker image
   - Transfers to server
   - Stops old container
   - Starts new container with `/home/onyx/xpos/env.production`

### Answer to your question:
**NO, you don't need to set env variables again!**

The workflow uses `--env-file /home/onyx/xpos/env.production`, which means:
- All database credentials from `env.production` are automatically loaded
- You only maintain ONE file on the server
- No need to pass variables in the workflow

## Manual Deployment (if needed)

### Build locally with Podman:
```bash
cd xpos
podman build -t xpos-app .
podman save xpos-app | gzip > xpos-app.tar.gz
```

### Transfer to server:
```bash
scp xpos-app.tar.gz onyx@20.218.139.129:/tmp/
```

### Deploy on server:
```bash
ssh onyx@20.218.139.129

# Load image
docker load < /tmp/xpos-app.tar.gz

# Stop old container
docker stop xpos-prod || true
docker rm xpos-prod || true

# Run new container
docker run -d \
  --name xpos-prod \
  --restart unless-stopped \
  -p 8000:80 \
  --env-file /home/onyx/xpos/env.production \
  xpos-app:latest

# Check logs
docker logs -f xpos-prod

# Check if running
docker ps
```

## Multiple Domains Setup

For multiple domains (domain1, domain2, domain3), create separate containers:

```bash
# Domain 1
docker run -d \
  --name xpos-domain1 \
  --restart unless-stopped \
  -p 8001:80 \
  --env-file /home/onyx/xpos/env.domain1 \
  xpos-app:latest

# Domain 2
docker run -d \
  --name xpos-domain2 \
  --restart unless-stopped \
  -p 8002:80 \
  --env-file /home/onyx/xpos/env.domain2 \
  xpos-app:latest

# Domain 3
docker run -d \
  --name xpos-domain3 \
  --restart unless-stopped \
  -p 8003:80 \
  --env-file /home/onyx/xpos/env.domain3 \
  xpos-app:latest
```

Then configure Nginx reverse proxy to route domains to ports.

## Run Migrations

First time setup or after database schema changes:

```bash
# Run migrations
docker exec xpos-prod php artisan migrate --force

# Seed database (if needed)
docker exec xpos-prod php artisan db:seed --force

# Clear cache
docker exec xpos-prod php artisan config:cache
docker exec xpos-prod php artisan route:cache
docker exec xpos-prod php artisan view:cache
```

## Useful Commands

```bash
# View logs
docker logs -f xpos-prod

# Access container shell
docker exec -it xpos-prod sh

# Restart container
docker restart xpos-prod

# Stop container
docker stop xpos-prod

# Remove container
docker rm xpos-prod

# List running containers
docker ps

# Remove unused images
docker image prune -f
```

## Troubleshooting

### Container won't start:
```bash
# Check logs
docker logs xpos-prod

# Check if env file exists
cat /home/onyx/xpos/env.production

# Check if port is available
sudo netstat -tulpn | grep 8000
```

### Database connection issues:
```bash
# Test from container
docker exec xpos-prod php artisan tinker
>>> DB::connection()->getPdo();
```

### Permission issues:
```bash
docker exec xpos-prod chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
```
