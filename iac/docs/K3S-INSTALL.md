# K3S Installation Guide

## Server Info
- IP: 20.218.174.86
- User: onyx
- OS: Ubuntu 24.04

## Installation Steps

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install k3s without Traefik, with nginx-ingress instead
curl -sfL https://get.k3s.io | sudo INSTALL_K3S_EXEC="--disable traefik --tls-san 20.218.174.86" sh -

# Check status
sudo systemctl status k3s

# Get cluster info
sudo kubectl get nodes

# Get kubeconfig
sudo cat /etc/rancher/k3s/k3s.yaml
```

## Install Nginx Ingress

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0-beta.0/deploy/static/provider/cloud/deploy.yaml

# Check status
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

## Install MetalLB

```bash
# Install MetalLB
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.9/config/manifests/metallb-native.yaml

# Wait for pods to be ready
kubectl wait --namespace metallb-system --for=condition=ready pod --selector=app=metallb --timeout=90s

# Configure IP pool (use your public IP)
cat <<EOF | kubectl apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default-pool
  namespace: metallb-system
spec:
  addresses:
  - 20.218.174.86/32
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

# Verify
kubectl get svc -n ingress-nginx
```

## Firewall Configuration

```bash
# Open k3s port
sudo ufw allow 6443/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

## Access from Local Machine

```bash
# Copy kubeconfig (via temp location)
ssh onyx@20.218.174.86 'sudo cp /etc/rancher/k3s/k3s.yaml /tmp/k3s.yaml && sudo chown onyx:onyx /tmp/k3s.yaml'
scp onyx@20.218.174.86:/tmp/k3s.yaml ~/.kube/k3s-config

# Update server IP
sed -i 's/127.0.0.1/20.218.174.86/g' ~/.kube/k3s-config

# Test
export KUBECONFIG=~/.kube/k3s-config
kubectl get nodes
```

## Useful Commands

```bash
# Uninstall k3s
/usr/local/bin/k3s-uninstall.sh

# View logs
sudo journalctl -u k3s -f

# Get token for agents
sudo cat /var/lib/rancher/k3s/server/node-token
```
