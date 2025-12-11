# XPOS Kubernetes Deployment - Single Cluster Setup

## Quick Overview

This setup deploys XPOS to **ONE Kubernetes cluster** with **three separate namespaces**:

```
┌────────────────────────────────────────────┐
│      Single Kubernetes Cluster            │
│                                            │
│  📦 xpos-dev       (Development)           │
│  📦 xpos-staging   (Staging/QA)            │
│  📦 xpos-prod      (Production)            │
└────────────────────────────────────────────┘
```

**Benefits:**
- 💰 **57% cost savings** vs 3 separate clusters
- 🔧 **One kubeconfig** to rule them all
- 🚀 **Same infrastructure**, different namespaces
- 🔒 **Isolated** with NetworkPolicies

## GitHub Secrets Setup

**You only need ONE kubeconfig!**

### Step 1: Get Your Kubeconfig

```bash
# Encode your kubeconfig
cat ~/.kube/config | base64 | pbcopy  # macOS
cat ~/.kube/config | base64 | xclip -selection clipboard  # Linux
```

### Step 2: Add to GitHub

Go to: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

```
Name: KUBECONFIG
Value: <paste base64 output from above>

Name: APP_KEY_DEV
Value: base64:your-dev-key-here

Name: APP_KEY_STAGING
Value: base64:your-staging-key-here

Name: APP_KEY_PROD
Value: base64:your-prod-key-here

Name: DB_PASSWORD_DEV
Value: your-dev-db-password

Name: DB_PASSWORD_STAGING
Value: your-staging-db-password

Name: DB_PASSWORD_PROD
Value: your-prod-db-password

Name: SLACK_WEBHOOK (optional)
Value: https://hooks.slack.com/services/xxx
```

## Configuration

### Update Image Registry

Edit `helm/xpos/values.yaml`:

```yaml
image:
  registry: ghcr.io
  repository: YOUR-GITHUB-ORG/xpos  # ← Change this!
```

### Update Domains

Edit each environment file:

**`helm/xpos/values-dev.yaml`:**
```yaml
config:
  appUrl: "https://xpos-dev.yourdomain.com"
  database:
    host: "your-db-host"
    database: xpos_dev
ingress:
  hosts:
    - host: xpos-dev.yourdomain.com
```

**`helm/xpos/values-staging.yaml`:**
```yaml
config:
  appUrl: "https://xpos-staging.yourdomain.com"
  database:
    host: "your-db-host"
    database: xpos_staging
ingress:
  hosts:
    - host: xpos-staging.yourdomain.com
```

**`helm/xpos/values-prod.yaml`:**
```yaml
config:
  appUrl: "https://xpos.yourdomain.com"
  database:
    host: "your-db-host"
    database: xpos_prod
ingress:
  hosts:
    - host: xpos.yourdomain.com
```

## Deployment

### Automatic Deployment (Recommended)

**Just push!** GitHub Actions handles everything:

```bash
# Deploy to dev
git checkout develop
git push origin develop
# ✅ Auto-deploys to xpos-dev namespace

# Deploy to staging
git checkout staging
git push origin staging
# ✅ Auto-deploys to xpos-staging namespace

# Deploy to production
git tag v1.0.0
git push origin v1.0.0
# ✅ Auto-deploys to xpos-prod namespace
```

### Manual Deployment

```bash
# Dev
helm upgrade --install xpos ./helm/xpos \
  --namespace xpos-dev \
  --create-namespace \
  --values ./helm/xpos/values-dev.yaml \
  --set image.tag=develop

# Staging
helm upgrade --install xpos ./helm/xpos \
  --namespace xpos-staging \
  --create-namespace \
  --values ./helm/xpos/values-staging.yaml \
  --set image.tag=staging

# Production
helm upgrade --install xpos ./helm/xpos \
  --namespace xpos-prod \
  --create-namespace \
  --values ./helm/xpos/values-prod.yaml \
  --set image.tag=v1.0.0
```

## Verification

```bash
# Check all environments
kubectl get pods -n xpos-dev
kubectl get pods -n xpos-staging
kubectl get pods -n xpos-prod

# Check one environment in detail
kubectl get all -n xpos-prod

# View logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=web
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker
```

## Common Operations

### Run Migrations

```bash
# Get web pod name
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")

# Run migration
kubectl exec -it $POD -n xpos-prod -- php artisan migrate --force
```

### View Logs

```bash
# All web pods in prod
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=web

# All worker pods in prod
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker

# Specific pod
kubectl logs -f -n xpos-prod <pod-name>
```

### Scale Workers

```bash
# Manual scaling
kubectl scale deployment xpos-worker -n xpos-prod --replicas=20

# Check HPA (auto-scaling)
kubectl get hpa -n xpos-prod
```

### Execute Artisan Commands

```bash
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")

# Clear cache
kubectl exec -it $POD -n xpos-prod -- php artisan cache:clear

# Run tinker
kubectl exec -it $POD -n xpos-prod -- php artisan tinker

# Any artisan command
kubectl exec -it $POD -n xpos-prod -- php artisan <command>
```

### Rollback

```bash
# Rollback production
helm rollback xpos -n xpos-prod

# Check history
helm history xpos -n xpos-prod

# Rollback to specific version
helm rollback xpos 3 -n xpos-prod
```

## Namespace Isolation

Each namespace is completely isolated:

| Resource | Dev | Staging | Production |
|----------|-----|---------|------------|
| **Namespace** | `xpos-dev` | `xpos-staging` | `xpos-prod` |
| **Domain** | xpos-dev.yourdomain.com | xpos-staging.yourdomain.com | xpos.yourdomain.com |
| **Database** | xpos_dev | xpos_staging | xpos_prod |
| **Redis** | redis.xpos-dev.svc | redis.xpos-staging.svc | redis.xpos-prod.svc |
| **Replicas** | 1 web, 1 worker | 2 web, 2 workers | 3-20 web, 5-30 workers |

## Cost Comparison

**3 Separate Clusters:**
- Control Plane × 3: $210/month
- Nodes: $300/month
- **Total: ~$510/month**

**Single Cluster (This Setup):**
- Control Plane × 1: $70/month
- Nodes (shared): $150/month
- **Total: ~$220/month**

**💰 Savings: $290/month ($3,480/year)**

## Architecture Diagram

```
                   GitHub Push/Tag
                         ↓
                  GitHub Actions
                         ↓
              Build & Push to GHCR
                         ↓
         ┌───────────────┴───────────────┐
         │   Same Kubernetes Cluster    │
         │   Same Kubeconfig            │
         └───────────────┬───────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  xpos-dev    │ │ xpos-staging │ │  xpos-prod   │
│  namespace   │ │  namespace   │ │  namespace   │
│              │ │              │ │              │
│ 1 web        │ │ 2 web        │ │ 3-20 web     │
│ 1 worker     │ │ 2 workers    │ │ 5-30 workers │
│ 1 scheduler  │ │ 1 scheduler  │ │ 1 scheduler  │
│ Redis        │ │ Redis        │ │ Redis        │
└──────────────┘ └──────────────┘ └──────────────┘
```

## File Structure

```
xpos/
├── Dockerfile.web           # Web container
├── Dockerfile.worker        # Worker container
├── Dockerfile.scheduler     # Scheduler container
├── helm/xpos/
│   ├── values.yaml          # Base values
│   ├── values-dev.yaml      # Dev overrides
│   ├── values-staging.yaml  # Staging overrides
│   └── values-prod.yaml     # Prod overrides
└── .github/workflows/
    ├── build-and-push.yml   # Build images
    ├── deploy-dev.yml       # Deploy to xpos-dev
    ├── deploy-staging.yml   # Deploy to xpos-staging
    └── deploy-prod.yml      # Deploy to xpos-prod
```

## Documentation

- **`SINGLE-CLUSTER-DEPLOYMENT.md`** - Detailed guide on single cluster approach
- **`QUICK-START.md`** - Quick start guide
- **`KUBERNETES-SETUP.md`** - Full migration guide
- **`DEVOPS-CHECKLIST.md`** - Deployment checklist
- **`helm/xpos/README.md`** - Helm chart documentation

## Key Differences from Multi-Cluster

| Aspect | Multi-Cluster | Single Cluster (This) |
|--------|---------------|----------------------|
| **Clusters** | 3 separate | 1 shared |
| **Kubeconfig** | 3 different | 1 for all |
| **Cost** | ~$510/month | ~$220/month |
| **Management** | Complex | Simple |
| **Isolation** | Full cluster | Namespace |
| **GitHub Secrets** | `KUBECONFIG_DEV`, `KUBECONFIG_STAGING`, `KUBECONFIG_PROD` | Just `KUBECONFIG` |

## Troubleshooting

### "namespace not found"

```bash
# Create namespace
kubectl create namespace xpos-dev
kubectl create namespace xpos-staging
kubectl create namespace xpos-prod
```

### "can't pull image"

Check if images are built and pushed:
```bash
# Check GitHub Actions logs
# Or manually pull
docker pull ghcr.io/your-org/xpos-web:latest
```

### "database connection refused"

Check database configuration in values files:
```bash
kubectl get configmap xpos-config -n xpos-prod -o yaml | grep DB_
```

## Next Steps

1. ✅ Setup GitHub secrets (especially `KUBECONFIG`)
2. ✅ Update values files with your domains
3. ✅ Push to `develop` branch to test
4. ✅ Verify deployment works
5. ✅ Setup monitoring (Prometheus/Grafana)
6. ✅ Configure alerts

## Summary

✅ **One cluster, three namespaces**
✅ **One kubeconfig**
✅ **57% cost savings**
✅ **Full isolation** via namespaces
✅ **Auto-deploy** via GitHub Actions
✅ **Auto-scale** with HPA
✅ **Zero-downtime** rolling updates

**Deploy command:**
```bash
git tag v1.0.0 && git push origin v1.0.0
```

That's it! 🚀
