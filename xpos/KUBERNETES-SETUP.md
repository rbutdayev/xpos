# Kubernetes Migration Guide for XPOS

## Overview

This guide will help you migrate from a VM-based setup with Supervisor to Kubernetes with Helm and GitHub Actions CI/CD.

## What's Different?

### Before (VM + Supervisor)
- Manual SSH deployment
- Supervisor manages PHP-FPM, Nginx, and queue workers
- Manual scaling (edit supervisor config)
- Single point of failure

### After (Kubernetes + Helm + GitHub Actions)
- Automated CI/CD pipeline
- Kubernetes manages everything (no Supervisor needed!)
- Auto-scaling with HPA
- Self-healing, high availability
- GitOps workflow

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    GitHub                                │
│                                                          │
│  Push to branch → GitHub Actions                        │
│                      ↓                                   │
│                  Build Images                            │
│                      ↓                                   │
│              Push to GHCR                                │
│                      ↓                                   │
│              Deploy with Helm                            │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│               Kubernetes Cluster                         │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Web Pods   │  │ Worker Pods │  │Scheduler Pod│    │
│  │  (2-20x)    │  │  (2-30x)    │  │   (1x)      │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │  Redis Pod  │  │   Storage   │                      │
│  └─────────────┘  └─────────────┘                      │
└──────────────────────────────────────────────────────────┘
```

## Setup Steps

### 1. Build Docker Images

We have 3 Dockerfiles:
- `Dockerfile.web` - Web application (PHP-FPM + Nginx)
- `Dockerfile.worker` - Queue workers
- `Dockerfile.scheduler` - Laravel scheduler (cron)

**No Supervisor in these images!** Kubernetes handles process management.

### 2. Setup GitHub Container Registry

The images will be pushed to GitHub Container Registry (GHCR).

**Enable GHCR:**
1. Go to your GitHub repo → Settings → Packages
2. Make packages public (or configure imagePullSecrets)

### 3. Setup GitHub Secrets

Add these secrets to your GitHub repo (Settings → Secrets → Actions):

**For each environment (dev, staging, prod):**

```bash
# Kubernetes Config (base64 encoded)
KUBECONFIG_DEV
KUBECONFIG_STAGING
KUBECONFIG_PROD

# Application Secrets
APP_KEY_DEV
APP_KEY_STAGING
APP_KEY_PROD

DB_PASSWORD_DEV
DB_PASSWORD_STAGING
DB_PASSWORD_PROD

# Optional: Slack notifications
SLACK_WEBHOOK
```

**To get kubeconfig:**
```bash
# On your local machine with kubectl configured
cat ~/.kube/config | base64
```

### 4. Update Helm Values

Edit the values files for your environments:

**`helm/xpos/values-dev.yaml`:**
```yaml
config:
  appUrl: "https://xpos-dev.yourdomain.com"
  database:
    host: "mysql-dev.yourdomain.com"
    port: 3306
    database: xpos_dev
    username: xpos_dev

ingress:
  hosts:
    - host: xpos-dev.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
```

Repeat for staging and production.

### 5. Update GitHub Workflow

Edit `.github/workflows/build-and-push.yml`:

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: your-github-org/xpos  # Change this!
```

### 6. Push to GitHub

```bash
git add .
git commit -m "Add Kubernetes deployment"
git push origin main
```

This will trigger:
1. Build Docker images
2. Push to GHCR
3. Run tests

### 7. Deploy to Dev

```bash
# Push to develop branch
git checkout -b develop
git push origin develop
```

This triggers:
1. Build images with `develop` tag
2. Deploy to dev cluster
3. Run migrations
4. Notify Slack

### 8. Deploy to Staging

```bash
# Push to staging branch
git checkout -b staging
git cherry-pick <commits>
git push origin staging
```

### 9. Deploy to Production

```bash
# Create a release tag
git tag v1.0.0
git push origin v1.0.0
```

This triggers:
1. Build images with `v1.0.0` tag
2. Deploy to production
3. Run migrations
4. Health checks
5. Auto-rollback on failure
6. Create GitHub release

## CI/CD Workflows

### Build and Push
- **Trigger:** Push to any branch, PRs
- **Actions:**
  - Build 3 Docker images (web, worker, scheduler)
  - Run tests
  - Push to GHCR

### Deploy to Dev
- **Trigger:** Push to `develop` branch
- **Actions:**
  - Deploy with `values-dev.yaml`
  - Run migrations
  - Notify Slack

### Deploy to Staging
- **Trigger:** Push to `staging` branch
- **Actions:**
  - Deploy with `values-staging.yaml`
  - Run migrations
  - Run smoke tests
  - Notify Slack

### Deploy to Production
- **Trigger:** Push tag `v*.*.*`
- **Actions:**
  - Deploy with `values-prod.yaml`
  - Run migrations
  - Health checks
  - Auto-rollback on failure
  - Create GitHub release
  - Notify Slack

## Environment Strategy

### Branch Strategy

```
main        → Development (auto-deploy to dev)
develop     → Development (auto-deploy to dev)
staging     → Staging (auto-deploy to staging)
v*.*.*      → Production (auto-deploy to prod)
```

### Deployment Flow

```
feature/xyz → develop → staging → tag v1.0.0 → production
```

## Kubernetes Commands

### Check Deployment
```bash
# Dev
kubectl get pods -n xpos-dev

# Staging
kubectl get pods -n xpos-staging

# Production
kubectl get pods -n xpos-prod
```

### View Logs
```bash
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=web
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker
```

### Scale Workers
```bash
kubectl scale deployment xpos-worker -n xpos-prod --replicas=20
```

### Run Artisan Commands
```bash
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD -n xpos-prod -- php artisan cache:clear
```

### Rollback
```bash
# Via Helm
helm rollback xpos -n xpos-prod

# Via Kubernetes
kubectl rollout undo deployment xpos-web -n xpos-prod
```

## Monitoring

### Check HPA Status
```bash
kubectl get hpa -n xpos-prod
```

### Check Resource Usage
```bash
kubectl top pods -n xpos-prod
kubectl top nodes
```

### Check Events
```bash
kubectl get events -n xpos-prod --sort-by='.lastTimestamp'
```

## Cost Optimization

### Right-sizing
- Monitor actual resource usage
- Adjust `requests` and `limits` in values files
- Use HPA to handle traffic spikes

### Spot/Preemptible Instances
- Use for dev/staging
- Consider for production workers (not web)

### Storage
- Use appropriate storage classes
- Enable compression for logs
- Implement log rotation

## Security

### Secrets Management
- Never commit secrets to git
- Use GitHub Secrets for CI/CD
- Consider using sealed-secrets or external secrets operator

### RBAC
- Create service account with minimal permissions
- Use NetworkPolicies to restrict traffic

### Image Security
- Scan images with Trivy
- Use minimal base images (alpine)
- Run as non-root user

## Troubleshooting

### Build fails
- Check GitHub Actions logs
- Ensure Dockerfiles are correct
- Check PHP/Node versions

### Deployment fails
- Check Helm output
- Verify secrets exist
- Check resource limits

### Pods CrashLooping
```bash
kubectl describe pod <pod-name> -n xpos-prod
kubectl logs <pod-name> -n xpos-prod --previous
```

### Workers not processing
```bash
# Check worker logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker

# Scale up
kubectl scale deployment xpos-worker -n xpos-prod --replicas=10
```

## Comparison: VM vs Kubernetes

| Task | VM (Supervisor) | Kubernetes (Helm) |
|------|-----------------|-------------------|
| **Deploy** | `ssh && git pull && composer install` | `git push` (CI/CD does it) |
| **Scale workers** | Edit supervisor config, restart | `kubectl scale` or auto-scale |
| **Restart** | `supervisorctl restart` | `kubectl rollout restart` |
| **Logs** | `tail -f log file` | `kubectl logs -f` |
| **Rollback** | Manual restore | `helm rollback` |
| **Health check** | `supervisorctl status` | Automatic liveness probes |
| **Load balancing** | External LB | Built-in Service |

## Key Benefits

1. **No more SSH** - Everything via git push
2. **No Supervisor needed** - Kubernetes is the supervisor
3. **Auto-scaling** - HPA scales based on load
4. **Self-healing** - Failed pods auto-restart
5. **Zero-downtime** - Rolling updates
6. **Easy rollback** - One command
7. **GitOps** - Infrastructure as code
8. **Multi-environment** - Dev, staging, prod from same code

## Next Steps

1. ✅ Review Helm charts
2. ✅ Update values files with your domains
3. ✅ Setup GitHub secrets
4. ✅ Push to GitHub
5. ✅ Watch GitHub Actions deploy
6. ✅ Verify deployment
7. ✅ Setup monitoring (Prometheus, Grafana)
8. ✅ Setup log aggregation (Loki, ELK)
9. ✅ Setup alerts

## Support

- Check GitHub Actions logs for build/deploy issues
- Check pod logs: `kubectl logs <pod> -n <namespace>`
- Check pod events: `kubectl describe pod <pod> -n <namespace>`
- Rollback if needed: `helm rollback xpos -n <namespace>`

---

**Remember:** No more Supervisor! Kubernetes is your new supervisor, and it's way more powerful! 🚀
