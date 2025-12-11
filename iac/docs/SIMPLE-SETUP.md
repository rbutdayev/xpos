# Simple Setup Guide - No GitHub Secrets for Credentials!

## ✅ What You Changed

- **NO database passwords in GitHub!** ✅
- **NO app keys in GitHub!** ✅
- **Only KUBECONFIG in GitHub** ✅
- **Only 2 environments:** dev + prod (no staging) ✅
- **Domains:** dev.xpos.az and app.xpos.az ✅

## 1. GitHub Secrets (Only 1!)

Go to: **GitHub → Settings → Secrets and variables → Actions**

```bash
# Get your kubeconfig
cat ~/.kube/config | base64

# Add ONE secret:
Name: KUBECONFIG
Value: <paste base64 output>
```

**That's it for GitHub!** 🎉

## 2. Edit Helm Values Files

### File 1: `xpos/helm/xpos/values.yaml`

```yaml
# Line 10: Update your GitHub org/username
image:
  repository: YOUR-GITHUB-USERNAME/xpos  # ← ruslan/xpos or your-org/xpos
```

### File 2: `xpos/helm/xpos/values-dev.yaml`

```yaml
# Update these sections:

config:
  database:
    host: "YOUR-DEV-DB-HOST"     # ← Change!
    database: xpos_dev
    username: xpos_dev

# Add real credentials here (stored in Kubernetes, not GitHub!)
secrets:
  appKey: "base64:YOUR-DEV-APP-KEY"              # ← Generate with: php artisan key:generate --show
  databasePassword: "YOUR-DEV-DB-PASSWORD"        # ← Your dev database password
  redisPassword: ""
```

### File 3: `xpos/helm/xpos/values-prod.yaml`

```yaml
# Update these sections:

config:
  database:
    host: "YOUR-PROD-DB-HOST"    # ← Change!
    database: xpos_prod
    username: xpos_prod

# Add real credentials here (stored in Kubernetes, not GitHub!)
secrets:
  appKey: "base64:YOUR-PROD-APP-KEY"             # ← Generate with: php artisan key:generate --show
  databasePassword: "YOUR-PROD-DB-PASSWORD"       # ← Your prod database password
  redisPassword: ""
```

## 3. Deployment

```bash
# Dev (on develop branch push)
git checkout -b develop
git add .
git commit -m "Configure K8s deployment"
git push origin develop
# ✅ Auto-deploys to: dev.xpos.az

# Prod (on version tag)
git checkout main
git merge develop
git tag v1.0.0
git push origin v1.0.0
# ✅ Auto-deploys to: app.xpos.az
```

## Summary - Files to Edit

```bash
# 1. Add GitHub secret
KUBECONFIG only!

# 2. Edit 3 files:
xpos/helm/xpos/values.yaml         # Update image.repository
xpos/helm/xpos/values-dev.yaml     # Update DB host + credentials
xpos/helm/xpos/values-prod.yaml    # Update DB host + credentials
```

## Generate APP_KEY

```bash
cd xpos
php artisan key:generate --show

# Output: base64:xxxxxxxxxxxxx
# Copy this to values-dev.yaml and values-prod.yaml
```

## Checklist

```
Setup:
[ ] Add KUBECONFIG to GitHub Secrets (only one!)
[ ] Edit values.yaml → image.repository
[ ] Edit values-dev.yaml → database.host
[ ] Edit values-dev.yaml → secrets.appKey
[ ] Edit values-dev.yaml → secrets.databasePassword
[ ] Edit values-prod.yaml → database.host
[ ] Edit values-prod.yaml → secrets.appKey
[ ] Edit values-prod.yaml → secrets.databasePassword
[ ] DNS: dev.xpos.az → cluster IP
[ ] DNS: app.xpos.az → cluster IP
[ ] Push to develop → deploy!
```

## Where Are Secrets?

```
GitHub Secrets:
  ✅ KUBECONFIG only

Kubernetes Secrets (auto-created by Helm):
  ✅ APP_KEY (from values-dev.yaml / values-prod.yaml)
  ✅ DB_PASSWORD (from values-dev.yaml / values-prod.yaml)
  ✅ REDIS_PASSWORD (from values-dev.yaml / values-prod.yaml)
```

## Security Note

**Values files contain secrets!** Add to `.gitignore` if you want:

```bash
# Option 1: Commit encrypted values (recommended for GitOps)
# Use sealed-secrets or SOPS to encrypt

# Option 2: Don't commit values files
echo "xpos/helm/xpos/values-dev.yaml" >> .gitignore
echo "xpos/helm/xpos/values-prod.yaml" >> .gitignore

# Then pass values via --set or store them separately
```

## Quick Commands

```bash
# Edit files
nano xpos/helm/xpos/values.yaml
nano xpos/helm/xpos/values-dev.yaml
nano xpos/helm/xpos/values-prod.yaml

# Generate APP_KEY
cd xpos && php artisan key:generate --show

# Deploy
git push origin develop    # dev
git tag v1.0.0 && git push origin v1.0.0  # prod
```

That's it! Much simpler! 🚀
