# Single Cluster, Multiple Namespaces Deployment

## Architecture Overview

Instead of deploying to separate clusters, we deploy **all environments to the same Kubernetes cluster** but in **different namespaces**:

```
┌──────────────────────────────────────────────────────────────┐
│                 Single Kubernetes Cluster                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Namespace: xpos-dev                                   │ │
│  │  - xpos-web (1 replica)                                │ │
│  │  - xpos-worker (1 replica)                             │ │
│  │  - xpos-scheduler (1 replica)                          │ │
│  │  - redis                                               │ │
│  │  Ingress: xpos-dev.yourdomain.com                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Namespace: xpos-staging                               │ │
│  │  - xpos-web (2 replicas)                               │ │
│  │  - xpos-worker (2 replicas)                            │ │
│  │  - xpos-scheduler (1 replica)                          │ │
│  │  - redis                                               │ │
│  │  Ingress: xpos-staging.yourdomain.com                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Namespace: xpos-prod                                  │ │
│  │  - xpos-web (3-20 replicas, auto-scaled)              │ │
│  │  - xpos-worker (5-30 replicas, auto-scaled)           │ │
│  │  - xpos-scheduler (1 replica)                          │ │
│  │  - redis (or external managed Redis)                  │ │
│  │  Ingress: xpos.yourdomain.com                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Benefits of This Approach

### Cost Savings
- ✅ **One cluster** instead of three
- ✅ **Shared control plane** (saves $70-150/month)
- ✅ **Better resource utilization** (dev uses less, prod scales up)
- ✅ **Single node pool** can serve multiple environments

### Operational Simplicity
- ✅ **One kubeconfig** to manage
- ✅ **Single kubectl context**
- ✅ **Easier monitoring** (one Prometheus, one Grafana)
- ✅ **Unified logging**

### Development Velocity
- ✅ **Easy to copy resources** between namespaces
- ✅ **Test in dev, promote to staging, release to prod**
- ✅ **Same cluster means same configuration**

## Namespace Isolation

Each namespace is **isolated**:

```yaml
# Resources are isolated
xpos-dev/xpos-web ≠ xpos-prod/xpos-web

# Services are namespaced
xpos-dev/redis-service → redis.xpos-dev.svc.cluster.local
xpos-prod/redis-service → redis.xpos-prod.svc.cluster.local

# Secrets are namespaced
xpos-dev/xpos-secrets
xpos-prod/xpos-secrets

# ConfigMaps are namespaced
xpos-dev/xpos-config
xpos-prod/xpos-config
```

## GitHub Secrets Configuration

**You only need ONE kubeconfig!**

### Required Secrets

```bash
# Single kubeconfig for all environments
KUBECONFIG=<base64 encoded kubeconfig>

# Application keys per environment
APP_KEY_DEV=base64:xxx...
APP_KEY_STAGING=base64:xxx...
APP_KEY_PROD=base64:xxx...

# Database passwords per environment
DB_PASSWORD_DEV=password
DB_PASSWORD_STAGING=password
DB_PASSWORD_PROD=password

# Optional: Slack notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx
```

### How to Get Kubeconfig

```bash
# Encode your kubeconfig
cat ~/.kube/config | base64

# Or for specific context
kubectl config view --flatten --minify | base64
```

Add to GitHub: **Settings → Secrets → Actions → New secret**
- Name: `KUBECONFIG`
- Value: `<paste base64 output>`

## Deployment Flow

### CI/CD Workflow

```
Git Push
    ↓
GitHub Actions
    ↓
Build Images → Push to GHCR
    ↓
┌─────────────────────────────────────────┐
│   Connect to SAME Kubernetes Cluster    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────┬──────────────────┬──────────────────┐
│   develop       │    staging       │    v1.0.0        │
│   branch        │    branch        │    tag           │
↓                 ↓                  ↓
Deploy to         Deploy to          Deploy to
xpos-dev          xpos-staging       xpos-prod
namespace         namespace          namespace
```

### Branch Strategy

| Git Event | Namespace | Domain |
|-----------|-----------|--------|
| Push to `develop` | `xpos-dev` | xpos-dev.yourdomain.com |
| Push to `staging` | `xpos-staging` | xpos-staging.yourdomain.com |
| Tag `v*.*.*` | `xpos-prod` | xpos.yourdomain.com |

## Resource Allocation

### Development Namespace

**Purpose:** Testing, debugging, development

```yaml
# values-dev.yaml
web:
  replicaCount: 1
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"

worker:
  replicaCount: 1
  autoscaling:
    enabled: false

redis:
  master:
    persistence:
      size: 1Gi
```

**Expected usage:** ~500MB RAM, 0.2 CPU cores

### Staging Namespace

**Purpose:** QA, pre-production testing

```yaml
# values-staging.yaml
web:
  replicaCount: 2
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"

worker:
  replicaCount: 2
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
```

**Expected usage:** ~2GB RAM, 1-2 CPU cores

### Production Namespace

**Purpose:** Live production traffic

```yaml
# values-prod.yaml
web:
  replicaCount: 3
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20

worker:
  replicaCount: 5
  autoscaling:
    enabled: true
    minReplicas: 5
    maxReplicas: 30
```

**Expected usage:** 5-50GB RAM, 5-30 CPU cores (scales with traffic)

## Namespace Management

### Create Namespaces

```bash
# Create all namespaces
kubectl create namespace xpos-dev
kubectl create namespace xpos-staging
kubectl create namespace xpos-prod

# Or let GitHub Actions create them automatically!
# (workflows have: kubectl create namespace --dry-run=client)
```

### View Resources by Namespace

```bash
# Dev environment
kubectl get all -n xpos-dev

# Staging environment
kubectl get all -n xpos-staging

# Production environment
kubectl get all -n xpos-prod

# All namespaces
kubectl get pods --all-namespaces | grep xpos
```

### Switch Default Namespace

```bash
# Set default namespace to prod
kubectl config set-context --current --namespace=xpos-prod

# Now you can omit -n flag
kubectl get pods

# Reset to default
kubectl config set-context --current --namespace=default
```

## Network Isolation (Optional)

For additional security, use **NetworkPolicies** to isolate namespaces:

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-from-other-namespaces
  namespace: xpos-prod
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector: {}  # Only pods in same namespace
```

This prevents pods in `xpos-dev` from accessing pods in `xpos-prod`.

## Resource Quotas

Limit resources per namespace to prevent one environment from consuming all cluster resources:

```yaml
# resource-quota-dev.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: xpos-dev-quota
  namespace: xpos-dev
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    persistentvolumeclaims: "3"
```

```yaml
# resource-quota-prod.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: xpos-prod-quota
  namespace: xpos-prod
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 50Gi
    limits.cpu: "50"
    limits.memory: 100Gi
    persistentvolumeclaims: "10"
```

Apply:
```bash
kubectl apply -f resource-quota-dev.yaml
kubectl apply -f resource-quota-prod.yaml
```

## Database Strategy

### Option 1: Separate Databases (Recommended)

Each namespace connects to a **different database**:

```yaml
# values-dev.yaml
config:
  database:
    host: "mysql.yourdomain.com"
    database: xpos_dev

# values-staging.yaml
config:
  database:
    host: "mysql.yourdomain.com"
    database: xpos_staging

# values-prod.yaml
config:
  database:
    host: "mysql.yourdomain.com"
    database: xpos_prod
```

### Option 2: In-Cluster MySQL

Deploy MySQL in each namespace:

```bash
helm install mysql bitnami/mysql \
  --namespace xpos-dev \
  --set auth.database=xpos \
  --set auth.username=xpos
```

## Redis Strategy

### Option 1: Redis per Namespace (Default)

Helm chart deploys Redis in each namespace:

```yaml
redis:
  enabled: true  # Each namespace gets its own Redis
```

### Option 2: Shared Redis with Different DBs

Use one Redis with different DB numbers:

```yaml
# values-dev.yaml
config:
  redis:
    host: shared-redis.redis.svc.cluster.local
    db: 0

# values-staging.yaml
config:
  redis:
    host: shared-redis.redis.svc.cluster.local
    db: 1

# values-prod.yaml
config:
  redis:
    host: shared-redis.redis.svc.cluster.local
    db: 2
```

### Option 3: Managed Redis (Production)

Use external Redis for production:

```yaml
# values-prod.yaml
redis:
  enabled: false  # Don't deploy Redis in prod
config:
  redis:
    host: "redis-prod.cache.amazonaws.com"
    port: 6379
```

## Common Operations

### Deploy to All Environments

```bash
# Dev
helm upgrade --install xpos ./helm/xpos \
  -n xpos-dev \
  --values ./helm/xpos/values-dev.yaml

# Staging
helm upgrade --install xpos ./helm/xpos \
  -n xpos-staging \
  --values ./helm/xpos/values-staging.yaml

# Production
helm upgrade --install xpos ./helm/xpos \
  -n xpos-prod \
  --values ./helm/xpos/values-prod.yaml
```

### View All Environments

```bash
# Quick status
kubectl get pods -n xpos-dev
kubectl get pods -n xpos-staging
kubectl get pods -n xpos-prod

# Or use a script
for ns in xpos-dev xpos-staging xpos-prod; do
  echo "=== $ns ==="
  kubectl get pods -n $ns
  echo ""
done
```

### Copy Secrets Between Namespaces

```bash
# Copy prod secret to staging for testing
kubectl get secret xpos-secrets -n xpos-prod -o yaml | \
  sed 's/namespace: xpos-prod/namespace: xpos-staging/' | \
  kubectl apply -f -
```

### Run Migrations in All Environments

```bash
# Dev
kubectl exec -n xpos-dev deployment/xpos-web -- php artisan migrate --force

# Staging
kubectl exec -n xpos-staging deployment/xpos-web -- php artisan migrate --force

# Production
kubectl exec -n xpos-prod deployment/xpos-web -- php artisan migrate --force
```

## Monitoring All Environments

### Prometheus + Grafana

Deploy once, monitor all namespaces:

```bash
# Install Prometheus (monitors all namespaces)
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

Create dashboard filtering by namespace:
- `namespace="xpos-dev"`
- `namespace="xpos-staging"`
- `namespace="xpos-prod"`

### View Logs Across Namespaces

```bash
# Install stern (multi-pod log tailing)
brew install stern

# View all dev logs
stern -n xpos-dev xpos

# View all staging logs
stern -n xpos-staging xpos

# View production logs
stern -n xpos-prod xpos

# View all environments
stern --all-namespaces -l app.kubernetes.io/name=xpos
```

## Cost Comparison

### 3 Separate Clusters

```
Control Plane 1: $70/month
Control Plane 2: $70/month
Control Plane 3: $70/month
Nodes (3 clusters): $300/month
Total: ~$510/month
```

### Single Cluster, Multiple Namespaces

```
Control Plane: $70/month
Nodes (shared): $150/month
Total: ~$220/month

Savings: $290/month ($3,480/year) 💰
```

## Security Best Practices

1. **Use NetworkPolicies** to isolate namespaces
2. **Separate secrets** per namespace (never share secrets!)
3. **Use RBAC** to restrict namespace access
4. **Resource quotas** to prevent resource exhaustion
5. **Different databases** per environment
6. **Use managed Redis** for production

## Troubleshooting

### "Namespace not found"

```bash
# Create namespace
kubectl create namespace xpos-dev
```

### "Can't connect to Redis"

```bash
# Check Redis in namespace
kubectl get pods -n xpos-dev | grep redis

# Check service
kubectl get svc -n xpos-dev | grep redis

# Full DNS name is:
# redis-service.xpos-dev.svc.cluster.local
```

### "Database connection refused"

Make sure database host is **external** or use **full DNS name**:
```yaml
# If DB is in another namespace:
DB_HOST=mysql.database-namespace.svc.cluster.local
```

## Summary

**Single Cluster Benefits:**
- ✅ **57% cost savings** ($290/month)
- ✅ **Simpler management** (one kubeconfig)
- ✅ **Better resource utilization**
- ✅ **Easier monitoring**
- ✅ **Namespace isolation** (security)

**Key Commands:**
```bash
# Deploy
kubectl apply -f deployment.yaml -n xpos-dev

# View
kubectl get pods -n xpos-prod

# Logs
kubectl logs -f -n xpos-staging deployment/xpos-worker

# Execute
kubectl exec -it -n xpos-prod deployment/xpos-web -- bash
```

**GitHub Secrets:**
```
KUBECONFIG  # Just one! Not three!
APP_KEY_DEV
APP_KEY_STAGING
APP_KEY_PROD
DB_PASSWORD_DEV
DB_PASSWORD_STAGING
DB_PASSWORD_PROD
```

That's it! Same cluster, different namespaces, huge savings! 🎉
