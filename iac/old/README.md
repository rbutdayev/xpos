# Infrastructure as Code (IaC)

Infrastructure automation scripts for deploying Docker and Nginx with multi-environment support.

## Server Details
- **IP**: 20.218.139.129
- **User**: onyx

## Environment Setup

### Development (Active by Default)
- `dev.xpos.az` → port 8000
- `dev.eservis.az` → port 8001

### Production (Configured but Disabled)
- `app.xpos.az` → port 8002
- `eservis.az` → port 8003

## Prerequisites

Install `sshpass` on your local machine:

**macOS:**
```bash
brew install hudochenkov/sshpass/sshpass
```

**Ubuntu/Debian:**
```bash
sudo apt-get install sshpass
```

## Usage

Run the main deployment script:

```bash
cd iac
./deploy.sh
```

This will:
1. Update server and install essential packages
2. Configure firewall (allow ports 22, 80, 443)
3. Install Docker and Docker Compose
4. Install and configure Nginx
5. Setup Nginx configurations for app.xpos.az and eservis.az

## After Infrastructure Setup

### 1. Configure SSL Certificates for Development

SSH to the server and run:

```bash
ssh onyx@20.218.139.129

# For dev environment
sudo certbot --nginx -d dev.xpos.az
sudo certbot --nginx -d dev.eservis.az
```

**Note**: Make sure your dev subdomains are pointing to the server IP before running certbot.

### 2. Deploy Your Applications

Deploy your applications using Docker on the appropriate ports:

**Development Environment:**
- dev.xpos.az → port 8000
- dev.eservis.az → port 8001

**Production Environment (when ready):**
- app.xpos.az → port 8002
- eservis.az → port 8003

Nginx will automatically proxy HTTPS requests to your Docker containers.

## Switching Environments

Use the environment switcher script to toggle between dev and production:

### Check Current Environment
```bash
./scripts/switch-environment.sh status
```

### Switch to Development
```bash
./scripts/switch-environment.sh dev
```

### Switch to Production
```bash
./scripts/switch-environment.sh prod
```

This will:
1. Disable the current environment's nginx configs
2. Enable the target environment's configs
3. Reload nginx

**Important**: When switching to production, you'll need to obtain SSL certificates:
```bash
ssh onyx@20.218.139.129
sudo certbot --nginx -d app.xpos.az
sudo certbot --nginx -d eservis.az -d www.eservis.az
```

## Directory Structure

```
iac/
├── deploy.sh                       # Main deployment script
├── scripts/
│   ├── 01-setup-server.sh         # Server setup
│   ├── 02-setup-docker.sh         # Docker installation
│   ├── 03-setup-nginx.sh          # Nginx setup
│   └── switch-environment.sh      # Environment switcher
└── configs/
    └── nginx/
        ├── nginx.conf              # Main nginx config
        └── conf.d/
            ├── dev.xpos.conf       # dev.xpos.az config
            ├── dev.eservis.conf    # dev.eservis.az config
            ├── prod.xpos.conf      # app.xpos.az config (production)
            └── prod.eservis.conf   # eservis.az config (production)
```

## Manual Steps (if needed)

### Run individual setup scripts:

```bash
# Server setup only
./scripts/01-setup-server.sh

# Docker setup only
./scripts/02-setup-docker.sh

# Nginx setup only
./scripts/03-setup-nginx.sh
```

### Check status on server:

```bash
# Check Docker
docker --version
docker ps

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check firewall
sudo ufw status
```
