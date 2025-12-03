# Docker Deployment Guide

## Build the Image

```bash
cd xpos
docker build -t xpos-app:latest .
```

For Podman (Mac dev):
```bash
cd xpos
podman build -t xpos-app:latest .
```

## Run Container

### Basic run with Azure Database:

```bash
docker run -d \
  --name xpos-domain1 \
  -p 8001:80 \
  -e APP_NAME="ONYX xPos" \
  -e APP_ENV=production \
  -e APP_KEY=base64:YOUR_APP_KEY_HERE \
  -e APP_DEBUG=false \
  -e APP_URL=https://domain1.com \
  -e DB_CONNECTION=mysql \
  -e DB_HOST=your-azure-mysql.mysql.database.azure.com \
  -e DB_PORT=3306 \
  -e DB_DATABASE=xpos_domain1 \
  -e DB_USERNAME=your-username \
  -e DB_PASSWORD=your-password \
  -e REDIS_HOST=your-redis-host \
  -e REDIS_PORT=6379 \
  -e SESSION_DRIVER=redis \
  -e CACHE_STORE=redis \
  -e QUEUE_CONNECTION=redis \
  -e AZURE_STORAGE_CONNECTION_STRING="your-connection-string" \
  -e AZURE_STORAGE_CONTAINER=xpos \
  xpos-app:latest
```

### Multiple domains (different ports):

```bash
# Domain 1
docker run -d --name xpos-domain1 -p 8001:80 -e APP_URL=https://domain1.com ... xpos-app:latest

# Domain 2
docker run -d --name xpos-domain2 -p 8002:80 -e APP_URL=https://domain2.com ... xpos-app:latest

# Domain 3
docker run -d --name xpos-domain3 -p 8003:80 -e APP_URL=https://domain3.com ... xpos-app:latest
```

### Run migrations (first time setup):

```bash
docker exec xpos-domain1 php artisan migrate --force
docker exec xpos-domain1 php artisan db:seed --force
```

### View logs:

```bash
docker logs -f xpos-domain1
```

## Podman (Mac dev environment)

Replace `docker` with `podman` in all commands:

```bash
podman build -t xpos-app:latest .
podman run -d --name xpos-dev -p 8000:80 -e APP_ENV=local ... xpos-app:latest
```

## Container Management

```bash
# Stop container
docker stop xpos-domain1

# Start container
docker start xpos-domain1

# Remove container
docker rm -f xpos-domain1

# Remove image
docker rmi xpos-app:latest
```

## Production Notes

1. **Always set APP_KEY**: Generate with `php artisan key:generate --show`
2. **Use .env file**: Create `.env.production` and use `--env-file`:
   ```bash
   docker run -d --name xpos-domain1 -p 8001:80 --env-file .env.production xpos-app:latest
   ```
3. **Storage**: Mount volume for Laravel logs (optional):
   ```bash
   -v /var/log/xpos-domain1:/var/www/storage/logs
   ```
4. **Redis**: Use Azure Redis or external Redis instance
5. **Reverse Proxy**: Configure Nginx on host to proxy to containers on ports 8001, 8002, etc.

## Health Check

```bash
curl http://localhost:8001/
```

Should return the XPOS login page.



  Build:
  cd xpos
  docker build -t xpos-app .
  # or with podman on Mac:
  podman build -t xpos-app .

  Run (with Azure DB):
  docker run -d --name xpos-test -p 8000:80 \
    -e APP_KEY="base64:EHob7DITeQDEWV81/BqXbWg3ndBtqGHWxd4/HvQbg8s=" \
    -e DB_CONNECTION=mysql \
    -e DB_HOST=your-azure-host.mysql.database.azure.com \
    -e DB_DATABASE=xpos \
    -e DB_USERNAME=your-user \
    -e DB_PASSWORD=your-pass \
    xpos-app
