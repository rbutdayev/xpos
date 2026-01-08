# K3S Installation Guide

## Server Info
- **IP:** 194.36.146.135
- **Hostname:** k3s.xpos.az (v2202601329727425134.ultrasrv.de)
- **User:** root
- **Password:** xPU0YqWvvSq9Y4Y
- **OS:** Debian 13 (Trixie) - Minimal
- **Provider:** Netcup VPS 2000 (8 CPU, 16GB RAM)

## Connect via SSH

```bash
# SSH to server
ssh root@194.36.146.135
# OR
ssh root@k3s.xpos.az

# Password: xPU0YqWvvSq9Y4Y
```

## Installation Steps

```bash
# Update system
apt update && apt upgrade -y

# Install k3s without Traefik
curl -sfL https://get.k3s.io | sh -s - \
  --disable traefik \
  --tls-san 194.36.146.135 \
  --tls-san k3s.xpos.az \
  --write-kubeconfig-mode 644

# Check status
systemctl status k3s

# Get cluster info
kubectl get nodes

# Get kubeconfig
cat /etc/rancher/k3s/k3s.yaml
```

## Install Nginx Ingress

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Check status
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

## Install MetalLB (Load Balancer)

```bash
# Install MetalLB
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.9/config/manifests/metallb-native.yaml

# Wait for pods to be ready
kubectl wait --namespace metallb-system --for=condition=ready pod --selector=app=metallb --timeout=90s

# Configure IP pool with Netcup VPS public IP
cat <<EOF | kubectl apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default-pool
  namespace: metallb-system
spec:
  addresses:
  - 194.36.146.135/32
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: default
  namespace: metallb-system
spec:
  ipAddressPools:
  - default-pool
EOF

# Verify ingress got external IP
kubectl get svc -n ingress-nginx
```

## Firewall Configuration

```bash
# Install UFW if not present (Debian minimal)
apt install ufw -y

# Allow SSH (important!)
ufw allow 22/tcp

# Allow K3s API
ufw allow 6443/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

## Install Cert-Manager (SSL Certificates)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s

# Create Let's Encrypt ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Install Helm

```bash
# Install Helm 3
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
helm version
```

## Access from Local Machine (Your Mac)

```bash
# On SERVER: Copy kubeconfig content
cat /etc/rancher/k3s/k3s.yaml

# On YOUR MAC: Create/edit kubeconfig
mkdir -p ~/.kube
nano ~/.kube/config

# Paste the content and CHANGE the server IP:
# server: https://127.0.0.1:6443
# TO:
# server: https://194.36.146.135:6443

# Test from your Mac
kubectl get nodes

# Should show your K3s node!
```

## Create Namespaces for xPOS Instances

```bash
# Create 3 namespaces (internal + 2 SaaS)
kubectl create namespace xpos-internal
kubectl create namespace xpos-saas1
kubectl create namespace xpos-saas2

# Verify
kubectl get namespaces
```

## Install Metrics Server (for Autoscaling)

```bash
# Install metrics server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Patch for K3s (allow insecure TLS)
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Wait a minute, then test
kubectl top nodes
```

## Useful Commands

```bash
# Uninstall k3s
/usr/local/bin/k3s-uninstall.sh

# View logs
journalctl -u k3s -f

# Restart K3s
systemctl restart k3s

# Check status
systemctl status k3s

# Get token for adding agent nodes later
cat /var/lib/rancher/k3s/server/node-token
```

## Verification Checklist

```
✅ K3s installed and running
✅ Nginx Ingress Controller installed
✅ MetalLB configured with public IP
✅ Cert-Manager installed for SSL
✅ Helm 3 installed
✅ Firewall configured (SSH, HTTP, HTTPS, K3s API)
✅ Kubeconfig accessible from local machine
✅ 3 namespaces created (internal, saas1, saas2)
✅ Metrics server installed (for HPA)
```

## Next Steps

1. ✅ K3s cluster ready (this guide)
2. Install MySQL on separate VPS
3. Deploy xPOS using Helm (see PRODUCTION-DEPLOYMENT-GUIDE.md)
4. Configure DNS (point *.xpos.az to 194.36.146.135)
