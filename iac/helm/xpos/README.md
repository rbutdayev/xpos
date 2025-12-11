# XPOS Helm Chart

A Helm chart for deploying XPOS POS System to Kubernetes.

## TL;DR

```bash
# Add secrets
kubectl create secret generic xpos-secrets \
  --from-literal=APP_KEY="base64:your-key" \
  --from-literal=DB_PASSWORD="your-password" \
  -n xpos

# Install
helm install xpos ./helm/xpos \
  --namespace xpos \
  --create-namespace \
  --values ./helm/xpos/values-prod.yaml
```

## Introduction

This chart bootstraps a XPOS deployment on a Kubernetes cluster using Helm.

## Prerequisites

- Kubernetes 1.20+
- Helm 3.8+
- PV provisioner support (for persistence)
- Ingress controller (nginx recommended)
- cert-manager (for SSL/TLS)

## Installing the Chart

### 1. Create secrets

```bash
# Generate Laravel APP_KEY
php artisan key:generate --show

# Create Kubernetes secret
kubectl create secret generic xpos-secrets \
  --from-literal=APP_KEY="base64:your-app-key-here" \
  --from-literal=DB_PASSWORD="your-db-password" \
  --from-literal=REDIS_PASSWORD="your-redis-password" \
  -n xpos
```

### 2. Install the chart

**Development:**
```bash
helm install xpos ./helm/xpos \
  --namespace xpos-dev \
  --create-namespace \
  --values ./helm/xpos/values-dev.yaml \
  --set image.tag=develop
```

**Staging:**
```bash
helm install xpos ./helm/xpos \
  --namespace xpos-staging \
  --create-namespace \
  --values ./helm/xpos/values-staging.yaml \
  --set image.tag=staging
```

**Production:**
```bash
helm install xpos ./helm/xpos \
  --namespace xpos-prod \
  --create-namespace \
  --values ./helm/xpos/values-prod.yaml \
  --set image.tag=v1.0.0
```

## Upgrading the Chart

```bash
helm upgrade xpos ./helm/xpos \
  --namespace xpos-prod \
  --values ./helm/xpos/values-prod.yaml \
  --set image.tag=v1.1.0 \
  --wait \
  --timeout 10m
```

## Uninstalling the Chart

```bash
helm uninstall xpos -n xpos-prod
```

## Configuration

### Global Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.imagePullSecrets` | Image pull secrets | `[]` |
| `global.storageClass` | Storage class for PVCs | `""` |

### Image Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.registry` | Image registry | `ghcr.io` |
| `image.repository` | Image repository | `your-org/xpos` |
| `image.tag` | Image tag | Chart appVersion |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Web Deployment

| Parameter | Description | Default |
|-----------|-------------|---------|
| `web.replicaCount` | Number of replicas | `2` |
| `web.resources.requests.memory` | Memory request | `512Mi` |
| `web.resources.requests.cpu` | CPU request | `250m` |
| `web.resources.limits.memory` | Memory limit | `1Gi` |
| `web.resources.limits.cpu` | CPU limit | `1000m` |
| `web.autoscaling.enabled` | Enable HPA | `false` |
| `web.autoscaling.minReplicas` | Min replicas | `2` |
| `web.autoscaling.maxReplicas` | Max replicas | `10` |

### Worker Deployment

| Parameter | Description | Default |
|-----------|-------------|---------|
| `worker.replicaCount` | Number of replicas | `2` |
| `worker.resources.requests.memory` | Memory request | `256Mi` |
| `worker.resources.requests.cpu` | CPU request | `100m` |
| `worker.autoscaling.enabled` | Enable HPA | `true` |
| `worker.autoscaling.minReplicas` | Min replicas | `2` |
| `worker.autoscaling.maxReplicas` | Max replicas | `10` |

### Redis

| Parameter | Description | Default |
|-----------|-------------|---------|
| `redis.enabled` | Deploy Redis | `true` |
| `redis.auth.enabled` | Enable Redis auth | `false` |
| `redis.master.persistence.enabled` | Enable persistence | `true` |
| `redis.master.persistence.size` | Volume size | `5Gi` |

### Application Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `config.appName` | Application name | `XPOS` |
| `config.appEnv` | Environment | `production` |
| `config.appDebug` | Debug mode | `false` |
| `config.appUrl` | Application URL | `https://xpos.yourdomain.com` |
| `config.database.host` | Database host | `mysql-host` |
| `config.database.port` | Database port | `3306` |
| `config.database.database` | Database name | `xpos` |

### Secrets

| Parameter | Description | Default |
|-----------|-------------|---------|
| `secrets.existingSecret` | Use existing secret | `""` |
| `secrets.appKey` | Laravel APP_KEY | `""` |
| `secrets.databasePassword` | Database password | `""` |

### Ingress

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class | `nginx` |
| `ingress.hosts[0].host` | Hostname | `xpos.yourdomain.com` |
| `ingress.tls` | TLS configuration | `[]` |

### Persistence

| Parameter | Description | Default |
|-----------|-------------|---------|
| `persistence.enabled` | Enable persistence | `true` |
| `persistence.storageClass` | Storage class | `""` |
| `persistence.accessMode` | Access mode | `ReadWriteMany` |
| `persistence.size` | Volume size | `20Gi` |

## Architecture

```
┌─────────────────────────────────────────────┐
│            Kubernetes Cluster               │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │         Ingress (nginx)              │  │
│  └──────────────┬───────────────────────┘  │
│                 │                           │
│  ┌──────────────▼───────────────────────┐  │
│  │      Web Service (ClusterIP)        │  │
│  └──────────────┬───────────────────────┘  │
│                 │                           │
│  ┌──────────────▼───────────────────────┐  │
│  │   Web Pods (2-20 replicas)          │  │
│  │   - PHP-FPM + Nginx                  │  │
│  │   - Horizontal Pod Autoscaler        │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   Worker Pods (2-30 replicas)       │  │
│  │   - queue:work                       │  │
│  │   - Horizontal Pod Autoscaler        │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   Scheduler Pod (1 replica)         │  │
│  │   - schedule:run cron                │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   Redis Pod                          │  │
│  │   - Queue, cache, sessions           │  │
│  │   - Persistent volume                │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   Shared Storage (PVC)               │  │
│  │   - uploads, logs                    │  │
│  │   - ReadWriteMany (NFS/CephFS)       │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Kubernetes vs Supervisor

| Feature | Supervisor (VM) | Kubernetes (Helm) |
|---------|-----------------|-------------------|
| **Process Management** | Supervisor | Kubernetes |
| **Auto-restart** | supervisorctl | Automatic |
| **Scaling** | Edit config, restart | `kubectl scale` or HPA |
| **Deployment** | SSH + git pull | `helm upgrade` |
| **Rollback** | Manual | `helm rollback` |
| **Load Balancing** | External | Built-in Service |
| **Health Checks** | Supervisor | Liveness/Readiness probes |
| **Logs** | Log files | `kubectl logs` |

## Common Operations

### View Pods
```bash
kubectl get pods -n xpos-prod
```

### View Logs
```bash
# Web logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=web

# Worker logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker

# Scheduler logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=scheduler
```

### Scale Workers
```bash
# Manual scaling
kubectl scale deployment xpos-worker -n xpos-prod --replicas=20

# Check HPA status
kubectl get hpa -n xpos-prod
```

### Run Migrations
```bash
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD -n xpos-prod -- php artisan migrate
```

### Execute Artisan Commands
```bash
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD -n xpos-prod -- php artisan cache:clear
```

### Shell into Container
```bash
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD -n xpos-prod -- /bin/bash
```

### Restart Deployments
```bash
kubectl rollout restart deployment xpos-web -n xpos-prod
kubectl rollout restart deployment xpos-worker -n xpos-prod
```

### Check Deployment Status
```bash
kubectl rollout status deployment xpos-web -n xpos-prod
helm status xpos -n xpos-prod
```

### Rollback
```bash
# Rollback to previous version
helm rollback xpos -n xpos-prod

# Rollback to specific revision
helm rollback xpos 5 -n xpos-prod

# Check history
helm history xpos -n xpos-prod
```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n xpos-prod
kubectl logs <pod-name> -n xpos-prod
```

### Database connection issues
```bash
# Test from pod
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD -n xpos-prod -- php artisan tinker
# In tinker: DB::connection()->getPdo();
```

### Workers not processing
```bash
# Check worker logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker

# Check Redis connection
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=worker -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD -n xpos-prod -- php artisan queue:monitor redis
```

### Storage issues
```bash
# Check PVC status
kubectl get pvc -n xpos-prod

# Check permissions
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD -n xpos-prod -- ls -la /var/www/storage
```

## License

Copyright © 2025 XPOS
