# Infrastructure as Code (IaC)

Infrastructure automation scripts for deploying Docker and Nginx on your server.

## Server Details
- **IP**: 20.218.139.129
- **User**: onyx
- **Applications**: xpos.az (port 8000), eservis.az (port 8001)

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
5. Setup Nginx configurations for xpos.az and eservis.az

## After Infrastructure Setup

### 1. Configure SSL Certificates

SSH to the server and run:

```bash
ssh onyx@20.218.139.129

# For xpos.az
sudo certbot --nginx -d xpos.az -d www.xpos.az

# For eservis.az
sudo certbot --nginx -d eservis.az -d www.eservis.az
```

**Note**: Make sure your domains are pointing to the server IP before running certbot.

### 2. Deploy Your Applications

Deploy your applications using Docker on ports:
- xpos.az → port 8000
- eservis.az → port 8001

Nginx will automatically proxy requests from https to your Docker containers.

## Directory Structure

```
iac/
├── deploy.sh                    # Main deployment script
├── scripts/
│   ├── 01-setup-server.sh      # Server setup
│   ├── 02-setup-docker.sh      # Docker installation
│   └── 03-setup-nginx.sh       # Nginx setup
└── configs/
    └── nginx/
        ├── nginx.conf           # Main nginx config
        └── conf.d/
            ├── xpos.conf        # xpos.az configuration
            └── eservis.conf     # eservis.az configuration
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
