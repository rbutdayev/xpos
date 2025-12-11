# XPOS Kubernetes Setup - Quick Reference

## 🎯 What You Have

**Single Kubernetes cluster** with **3 namespaces**:
- `xpos-dev` - Development
- `xpos-staging` - Staging/QA
- `xpos-prod` - Production

**Automated CI/CD** via GitHub Actions:
- Push to `develop` → deploys to `xpos-dev`
- Push to `staging` → deploys to `xpos-staging`
- Tag `v*.*.*` → deploys to `xpos-prod`

## ⚡ Quick Setup (5 minutes)

### 1. GitHub Secrets

Add **ONE** secret in GitHub → Settings → Secrets → Actions:

```bash
# Get your kubeconfig (base64 encoded)
cat ~/.kube/config | base64

# Add to GitHub as:
Name: KUBECONFIG
Value: <paste output above>
```

Also add:
```
APP_KEY_DEV=base64:xxx
APP_KEY_STAGING=base64:xxx
APP_KEY_PROD=base64:xxx

DB_PASSWORD_DEV=xxx
DB_PASSWORD_STAGING=xxx
DB_PASSWORD_PROD=xxx
```

### 2. Update Config

Edit `helm/xpos/values.yaml`:
```yaml
image:
  repository: YOUR-GITHUB-ORG/xpos  # ← Change!
```

Edit domains in:
- `helm/xpos/values-dev.yaml`
- `helm/xpos/values-staging.yaml`
- `helm/xpos/values-prod.yaml`

### 3. Deploy!

```bash
# Test in dev
git checkout -b develop
git push origin develop
# ✨ Auto-deploys to xpos-dev namespace

# Production
git tag v1.0.0
git push origin v1.0.0
# ✨ Auto-deploys to xpos-prod namespace
```

## 📊 Architecture

```
Single Kubernetes Cluster
├── Namespace: xpos-dev
│   ├── Web pods (1)
│   ├── Worker pods (1)
│   ├── Scheduler pod (1)
│   └── Redis pod
├── Namespace: xpos-staging
│   ├── Web pods (2)
│   ├── Worker pods (2)
│   ├── Scheduler pod (1)
│   └── Redis pod
└── Namespace: xpos-prod
    ├── Web pods (3-20, auto-scaled)
    ├── Worker pods (5-30, auto-scaled)
    ├── Scheduler pod (1)
    └── Redis pod (or external)
```

## 🔑 Key Concept: No Supervisor!

**Before (VM):**
```ini
[program:worker]
numprocs=2         ← Supervisor manages this
autorestart=true   ← Supervisor manages this
```

**After (Kubernetes):**
```yaml
worker:
  replicas: 2              ← Kubernetes manages this
  autoscaling:             ← Kubernetes auto-scales!
    minReplicas: 2
    maxReplicas: 30
```

**Kubernetes IS your supervisor now!**

## 🛠️ Common Commands

### Check Status
```bash
kubectl get pods -n xpos-prod
kubectl get all -n xpos-prod
helm status xpos -n xpos-prod
```

### View Logs
```bash
# Web logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=web

# Worker logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker

# All logs (requires stern)
stern -n xpos-prod xpos
```

### Run Commands
```bash
# Get pod name
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")

# Run artisan
kubectl exec -it $POD -n xpos-prod -- php artisan migrate
kubectl exec -it $POD -n xpos-prod -- php artisan cache:clear
kubectl exec -it $POD -n xpos-prod -- php artisan tinker

# Shell into pod
kubectl exec -it $POD -n xpos-prod -- bash
```

### Scale
```bash
# Manual
kubectl scale deployment xpos-worker -n xpos-prod --replicas=20

# Check auto-scaling
kubectl get hpa -n xpos-prod
```

### Rollback
```bash
helm rollback xpos -n xpos-prod
```

## 💰 Cost Savings

| Setup | Cost/Month |
|-------|-----------|
| 3 separate clusters | ~$510 |
| **Single cluster (this)** | **~$220** |
| **Savings** | **$290/month** |

## 📚 Documentation

- `README-DEPLOYMENT.md` - Main deployment guide
- `SINGLE-CLUSTER-DEPLOYMENT.md` - Single cluster details
- `QUICK-START.md` - Feature overview
- `DEVOPS-CHECKLIST.md` - Complete checklist
- `helm/xpos/README.md` - Helm chart docs

## 🚀 Deployment Flow

```
git commit → git push → GitHub Actions
                              ↓
                    Build Docker Images
                              ↓
                      Push to GHCR
                              ↓
              Deploy to Kubernetes Namespace
                              ↓
                      Run Migrations
                              ↓
                           ✅ Done!
```

## ✨ Key Features

- ✅ One cluster, three namespaces
- ✅ One kubeconfig
- ✅ Auto-deploy on push
- ✅ Auto-scale workers (2-30)
- ✅ Self-healing pods
- ✅ Zero-downtime deployments
- ✅ One-command rollback
- ✅ No Supervisor needed!

## 🎉 Summary

**Before:** SSH + git pull + supervisor restart
**After:** `git push` (that's it!)

**Before:** Edit supervisor config to scale
**After:** Auto-scales 2-30 workers based on load

**Before:** Manual restarts, manual everything
**After:** Kubernetes handles everything

**GitHub Secrets Needed:**
```
KUBECONFIG          # ← Just one!
APP_KEY_DEV
APP_KEY_STAGING
APP_KEY_PROD
DB_PASSWORD_DEV
DB_PASSWORD_STAGING
DB_PASSWORD_PROD
```

That's it! You're ready to deploy! 🚀

---

**Need help?** See detailed docs:
- Single cluster setup: `SINGLE-CLUSTER-DEPLOYMENT.md`
- Deployment guide: `README-DEPLOYMENT.md`
- Full checklist: `DEVOPS-CHECKLIST.md`
