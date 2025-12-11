

# XPOS Kubernetes Quick Start Guide

## What We Built

✅ **3 Dockerfiles** (web, worker, scheduler) - No Supervisor needed!
✅ **Helm Chart** - Production-ready with dev/staging/prod values
✅ **GitHub Actions CI/CD** - Automated build, test, deploy
✅ **Auto-scaling** - Workers scale 2-30 based on load
✅ **Zero-downtime deployments** - Rolling updates
✅ **Auto-rollback** - On production failures

## File Structure

```
xpos/
├── Dockerfile.web          # Web app (PHP-FPM + Nginx)
├── Dockerfile.worker       # Queue workers (NO supervisor!)
├── Dockerfile.scheduler    # Cron scheduler
├── helm/xpos/
│   ├── Chart.yaml
│   ├── values.yaml         # Default values
│   ├── values-dev.yaml     # Dev overrides
│   ├── values-staging.yaml # Staging overrides
│   ├── values-prod.yaml    # Production overrides
│   └── templates/          # Kubernetes manifests
│       ├── web-deployment.yaml
│       ├── worker-deployment.yaml
│       ├── scheduler-deployment.yaml
│       ├── ingress.yaml
│       ├── hpa.yaml        # Auto-scaling
│       └── ...
└── .github/workflows/
    ├── build-and-push.yml  # Build & test on every push
    ├── deploy-dev.yml      # Auto-deploy develop → dev
    ├── deploy-staging.yml  # Auto-deploy staging → staging
    └── deploy-prod.yml     # Auto-deploy tags → production
```

## Setup (5 minutes)

### 1. Update Configuration

**Edit `helm/xpos/values.yaml`:**
```yaml
image:
  registry: ghcr.io
  repository: your-github-org/xpos  # ← Change this!
```

**Edit environment values:**
- `helm/xpos/values-dev.yaml` - Update domain, DB host
- `helm/xpos/values-staging.yaml` - Update domain, DB host
- `helm/xpos/values-prod.yaml` - Update domain, DB host

### 2. Setup GitHub Secrets

Go to: GitHub Repo → Settings → Secrets → Actions

**Add these secrets:**

```bash
# Kubernetes config (base64 encoded)
KUBECONFIG_DEV=$(cat ~/.kube/config | base64)
KUBECONFIG_STAGING=$(cat ~/.kube/config | base64)
KUBECONFIG_PROD=$(cat ~/.kube/config | base64)

# App keys (generate with: php artisan key:generate --show)
APP_KEY_DEV=base64:xxx...
APP_KEY_STAGING=base64:xxx...
APP_KEY_PROD=base64:xxx...

# Database passwords
DB_PASSWORD_DEV=xxx
DB_PASSWORD_STAGING=xxx
DB_PASSWORD_PROD=xxx

# Optional: Slack notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx
```

### 3. Push and Deploy

```bash
# Push to develop → auto-deploys to dev
git checkout -b develop
git push origin develop

# Push to staging → auto-deploys to staging
git checkout -b staging
git push origin staging

# Tag for production → auto-deploys to prod
git tag v1.0.0
git push origin v1.0.0
```

## How It Works

### CI/CD Pipeline

```
┌──────────────────────────────────────────────────────────┐
│                 Git Push/Tag                             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│          GitHub Actions: Build & Push                    │
│                                                          │
│  1. Build 3 Docker images (web, worker, scheduler)      │
│  2. Run tests (PHPUnit)                                 │
│  3. Push images to GHCR                                 │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│          GitHub Actions: Deploy                          │
│                                                          │
│  1. Connect to Kubernetes cluster                       │
│  2. Create/update secrets                               │
│  3. Deploy with Helm                                    │
│  4. Run migrations                                      │
│  5. Verify deployment                                   │
│  6. Notify Slack                                        │
└──────────────────────────────────────────────────────────┘
```

### Branch Strategy

| Branch/Tag | Deploys To | Trigger |
|------------|------------|---------|
| `develop` | Dev cluster | Automatic on push |
| `staging` | Staging cluster | Automatic on push |
| `v*.*.*` | Production | Automatic on tag |
| PR to main | Build & test only | No deploy |

### Kubernetes vs Supervisor

**Before (Supervisor on VM):**
```ini
[program:xpos-worker]
numprocs=2
command=php artisan queue:work
autorestart=true
```

**After (Kubernetes):**
```yaml
# worker-deployment.yaml
replicas: 2  # Same as numprocs
# Kubernetes auto-restarts (no autorestart needed!)

# Plus auto-scaling!
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 30
```

## Common Commands

### Check Deployment Status
```bash
# Via Helm
helm status xpos -n xpos-prod
helm list -n xpos-prod

# Via kubectl
kubectl get pods -n xpos-prod
kubectl get hpa -n xpos-prod
```

### View Logs
```bash
# Web logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=web

# Worker logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker

# All logs
kubectl logs -f -n xpos-prod --all-containers=true
```

### Scale Workers
```bash
# Manual
kubectl scale deployment xpos-worker -n xpos-prod --replicas=20

# Or let HPA do it automatically!
kubectl get hpa -n xpos-prod
```

### Run Artisan Commands
```bash
# Get pod name
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")

# Run command
kubectl exec -it $POD -n xpos-prod -- php artisan cache:clear
kubectl exec -it $POD -n xpos-prod -- php artisan migrate
kubectl exec -it $POD -n xpos-prod -- php artisan tinker
```

### Rollback
```bash
# Rollback to previous version
helm rollback xpos -n xpos-prod

# Check history
helm history xpos -n xpos-prod

# Rollback to specific revision
helm rollback xpos 5 -n xpos-prod
```

### Update Configuration
```bash
# Edit values
vim helm/xpos/values-prod.yaml

# Apply changes
git commit -am "Update prod config"
git tag v1.0.1
git push origin v1.0.1
# CI/CD will deploy automatically!
```

## Production Deployment Example

```bash
# 1. Make changes
git checkout -b feature/new-feature
# ... make changes ...
git commit -am "Add new feature"

# 2. Test in dev
git checkout develop
git merge feature/new-feature
git push origin develop
# → Auto-deploys to dev
# → Test it!

# 3. Deploy to staging
git checkout staging
git merge develop
git push origin staging
# → Auto-deploys to staging
# → QA testing

# 4. Deploy to production
git checkout main
git merge staging
git tag v1.2.0
git push origin v1.2.0
# → Auto-deploys to production
# → Monitors health
# → Auto-rollback on failure
```

## Key Benefits

| Feature | VM + Supervisor | Kubernetes + Helm |
|---------|-----------------|-------------------|
| Deployment | SSH + manual | Git push |
| Scaling | Edit config, restart | `kubectl scale` or auto |
| Restart | `supervisorctl restart` | `kubectl rollout restart` |
| Rollback | Manual | `helm rollback` |
| Health check | Manual | Automatic |
| Zero downtime | ❌ | ✅ |
| Auto-scaling | ❌ | ✅ |
| Self-healing | ❌ | ✅ |
| Load balancing | External | Built-in |
| CI/CD | ❌ | ✅ GitHub Actions |

## Troubleshooting

### Build fails
```bash
# Check GitHub Actions
# Go to: GitHub → Actions → Click failed workflow
# Check logs for errors
```

### Deploy fails
```bash
# Check workflow logs on GitHub
# Or check Helm release
helm status xpos -n xpos-prod
kubectl describe pod <pod-name> -n xpos-prod
```

### Pods not starting
```bash
# Check pod status
kubectl get pods -n xpos-prod

# Check pod logs
kubectl logs <pod-name> -n xpos-prod

# Check pod events
kubectl describe pod <pod-name> -n xpos-prod
```

### Database connection errors
```bash
# Check config
kubectl get configmap xpos-config -n xpos-prod -o yaml

# Check secrets
kubectl get secret xpos-secrets -n xpos-prod -o yaml

# Test connection
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD -n xpos-prod -- php artisan tinker
# In tinker: DB::connection()->getPdo();
```

### Workers not processing
```bash
# Check worker logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker

# Scale up
kubectl scale deployment xpos-worker -n xpos-prod --replicas=10

# Restart
kubectl rollout restart deployment xpos-worker -n xpos-prod
```

## What's Next?

1. **Monitoring**
   - Setup Prometheus + Grafana
   - Add custom metrics
   - Setup alerts

2. **Logging**
   - Setup Loki or ELK
   - Centralized log aggregation
   - Log retention policies

3. **Security**
   - Use sealed-secrets or external-secrets
   - Implement NetworkPolicies
   - Regular security scans

4. **Cost Optimization**
   - Monitor resource usage
   - Right-size pods
   - Use spot instances for non-critical workloads

5. **Advanced Features**
   - Blue-green deployments
   - Canary deployments
   - A/B testing

## Summary

**You now have:**
- ✅ Production-ready Helm chart
- ✅ Multi-environment support (dev, staging, prod)
- ✅ Automated CI/CD with GitHub Actions
- ✅ Auto-scaling workers (2-30 replicas)
- ✅ Self-healing infrastructure
- ✅ Zero-downtime deployments
- ✅ One-command rollbacks
- ✅ No more Supervisor! Kubernetes is your new supervisor!

**Deployment is now as simple as:**
```bash
git tag v1.0.0 && git push origin v1.0.0
```

That's it! GitHub Actions does the rest! 🚀

---

For detailed information:
- **Helm Chart:** See `helm/xpos/README.md`
- **Migration Guide:** See `KUBERNETES-SETUP.md`
- **Architecture:** See diagrams in documentation

**Remember:** Kubernetes IS your Supervisor now! No more editing supervisor configs! 🎉



  Summary

  I've set up a production-ready Kubernetes deployment with Helm and GitHub Actions CI/CD for your XPOS system. Here's what you got:

  🎯 Key Concept: No Supervisor Needed!

  Before (VM):
  [supervisord]
  [program:php-fpm] ← Supervisor manages
  [program:nginx] ← Supervisor manages
  [program:worker] ← Supervisor manages (2 workers)

  After (Kubernetes):
  web-deployment: replicas: 2 ← Kubernetes manages
  worker-deployment: replicas: 2-30 (auto-scales!) ← Kubernetes manages
  scheduler-deployment: replicas: 1 ← Kubernetes manages

  Kubernetes IS your supervisor now! It handles restarts, scaling, health checks, everything!

  ---
  📦 What We Created

  1. Dockerfiles (3 separate images)

  - Dockerfile.web - Web app (PHP-FPM + Nginx)
  - Dockerfile.worker - Queue workers only
  - Dockerfile.scheduler - Cron scheduler only

  Each runs independently as pods. Kubernetes manages them!

  2. Helm Chart (helm/xpos/)

  Full production-ready chart with:
  - ✅ Multi-environment support (dev/staging/prod)
  - ✅ Auto-scaling (2-30 workers based on CPU/memory)
  - ✅ Health checks
  - ✅ Persistent storage
  - ✅ Redis deployment
  - ✅ Ingress with SSL
  - ✅ ConfigMaps & Secrets

  3. GitHub Actions CI/CD (.github/workflows/)

  - build-and-push.yml - Builds images, runs tests
  - deploy-dev.yml - Auto-deploy to dev (on develop push)
  - deploy-staging.yml - Auto-deploy to staging (on staging push)
  - deploy-prod.yml - Auto-deploy to prod (on version tags)
  - lint.yml - Code linting

  4. Documentation

  - QUICK-START.md - Get started in 5 minutes
  - KUBERNETES-SETUP.md - Detailed migration guide
  - DEVOPS-CHECKLIST.md - Complete deployment checklist
  - helm/xpos/README.md - Helm chart docs

  ---
  🚀 How to Deploy

  Step 1: Configure (2 minutes)

  1. Update image registry:
  # helm/xpos/values.yaml
  image:
    registry: ghcr.io
    repository: YOUR-GITHUB-ORG/xpos  # ← Change this!

  2. Update domains in:
  - helm/xpos/values-dev.yaml
  - helm/xpos/values-staging.yaml
  - helm/xpos/values-prod.yaml

  Step 2: Setup GitHub Secrets (3 minutes)

  Go to: GitHub → Settings → Secrets → Actions

  Add:
  KUBECONFIG_DEV=<your kubeconfig base64>
  KUBECONFIG_STAGING=<your kubeconfig base64>
  KUBECONFIG_PROD=<your kubeconfig base64>

  APP_KEY_DEV=base64:xxx
  APP_KEY_STAGING=base64:xxx
  APP_KEY_PROD=base64:xxx

  DB_PASSWORD_DEV=xxx
  DB_PASSWORD_STAGING=xxx
  DB_PASSWORD_PROD=xxx

  Step 3: Deploy!

  # Dev
  git checkout -b develop
  git push origin develop
  # ✨ Auto-deploys to dev!

  # Staging
  git checkout -b staging
  git push origin staging
  # ✨ Auto-deploys to staging!

  # Production
  git tag v1.0.0
  git push origin v1.0.0
  # ✨ Auto-deploys to production with rollback protection!

  That's it! GitHub Actions handles everything!

  ---
  🔄 Workflow

  Code Change
      ↓
  Git Push → GitHub Actions
      ↓
  Build 3 Docker Images (web, worker, scheduler)
      ↓
  Run Tests (PHPUnit)
      ↓
  Push to GitHub Container Registry
      ↓
  Deploy to Kubernetes with Helm
      ↓
  Run Migrations
      ↓
  Verify Health
      ↓
  ✅ Done! (or auto-rollback on failure)

  ---
  📊 Key Benefits

  | Feature        | VM + Supervisor       | Kubernetes + Helm |
  |----------------|-----------------------|-------------------|
  | Deploy         | SSH + manual          | git push          |
  | Scale workers  | Edit config, restart  | Auto-scales 2-30! |
  | Restart        | supervisorctl restart | Auto-restarts     |
  | Rollback       | Manual restore        | helm rollback     |
  | Zero downtime  | ❌                     | ✅                 |
  | Auto-healing   | ❌                     | ✅                 |
  | Load balancing | External              | Built-in          |

  ---
  🛠️ Common Commands

  # Check status
  kubectl get pods -n xpos-prod
  helm status xpos -n xpos-prod

  # View logs
  kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker

  # Scale workers (or let HPA do it automatically!)
  kubectl scale deployment xpos-worker -n xpos-prod --replicas=20

  # Run artisan command
  POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")
  kubectl exec -it $POD -n xpos-prod -- php artisan cache:clear

  # Rollback
  helm rollback xpos -n xpos-prod

  ---
  📚 Next Steps

  1. Read: QUICK-START.md for immediate setup
  2. Configure: Update values files with your domains/DB hosts
  3. Setup: Add GitHub secrets
  4. Deploy: Push to develop branch to test
  5. Monitor: Setup Prometheus/Grafana (optional)

  ---
  🎉 That's It!

  You now have enterprise-grade Kubernetes deployment with:
  - ✅ Automated CI/CD
  - ✅ Multi-environment (dev/staging/prod)
  - ✅ Auto-scaling workers
  - ✅ Self-healing
  - ✅ Zero-downtime deployments
  - ✅ One-command rollbacks

  No more Supervisor configs! Kubernetes handles everything! 🚀