# Final Setup - Ready to Deploy!

## ✅ What's Already Done

- ✅ Dev database: hardcoded to `mysql.db.svc` (username: root, password: root)
- ✅ Domains: dev.xpos.az (dev) and app.xpos.az (prod)
- ✅ No staging environment
- ✅ Only KUBECONFIG needed in GitHub

## Files You Need to Edit

### 1. GitHub Secret (Only ONE!)

```bash
# Get your kubeconfig
cat ~/.kube/config | base64

# Add to GitHub → Settings → Secrets → Actions
Name: KUBECONFIG
Value: <paste base64>
```

### 2. File: `xpos/helm/xpos/values.yaml`

```yaml
# Line 10: Already set to your username! ✅
image:
  repository: rbutdayev/xpos  # ← Already configured!
```

### 3. File: `xpos/helm/xpos/values-dev.yaml`

```yaml
# Line 14: Generate and add APP_KEY
secrets:
  appKey: "base64:GENERATE_THIS"  # ← Run: cd xpos && php artisan key:generate --show
  # Everything else is hardcoded! ✅
```

**Dev database is hardcoded:**
- Host: `mysql.db.svc`
- Database: `xpos_dev`
- Username: `root`
- Password: `root`

### 4. File: `xpos/helm/xpos/values-prod.yaml`

```yaml
# Lines 7-9: Update production database
config:
  database:
    host: "YOUR-PROD-DB-HOST"        # ← Change this
    database: xpos_prod
    username: xpos_prod              # ← Change this

# Lines 15-17: Add production credentials
secrets:
  appKey: "base64:PROD_APP_KEY"      # ← Generate with artisan
  databasePassword: "PROD_PASSWORD"  # ← Your production DB password
  redisPassword: ""
```

## Quick Commands

```bash
# 1. Generate APP_KEY for dev
cd xpos
php artisan key:generate --show
# Copy output to values-dev.yaml line 14

# 2. Generate APP_KEY for prod
php artisan key:generate --show
# Copy output to values-prod.yaml line 15

# 3. Edit files
nano xpos/helm/xpos/values.yaml       # Update image.repository
nano xpos/helm/xpos/values-dev.yaml   # Add APP_KEY (line 14)
nano xpos/helm/xpos/values-prod.yaml  # Update DB host + credentials
```

## Deploy

```bash
# Dev
git checkout -b develop
git add .
git commit -m "Configure K8s deployment"
git push origin develop
# ✅ Deploys to: https://dev.xpos.az

# Production
git checkout main
git merge develop
git tag v1.0.0
git push origin v1.0.0
# ✅ Deploys to: https://app.xpos.az
```

## Complete Checklist

```
[ ] Add KUBECONFIG to GitHub Secrets
[ ] Edit values.yaml → image.repository (line 10)
[ ] Generate dev APP_KEY: cd xpos && php artisan key:generate --show
[ ] Edit values-dev.yaml → secrets.appKey (line 14)
[ ] Edit values-prod.yaml → config.database.host (line 7)
[ ] Edit values-prod.yaml → config.database.username (line 9)
[ ] Generate prod APP_KEY: php artisan key:generate --show
[ ] Edit values-prod.yaml → secrets.appKey (line 15)
[ ] Edit values-prod.yaml → secrets.databasePassword (line 16)
[ ] DNS: dev.xpos.az → your cluster IP
[ ] DNS: app.xpos.az → your cluster IP
[ ] MySQL in k8s with service: mysql.db.svc
[ ] Create database: xpos_dev (in MySQL)
[ ] Create production database and user
[ ] Push to develop branch → deploy dev!
[ ] Tag version → deploy prod!
```

## Summary

**Files to edit:**
1. `xpos/helm/xpos/values.yaml` - 1 line (image repo)
2. `xpos/helm/xpos/values-dev.yaml` - 1 line (APP_KEY)
3. `xpos/helm/xpos/values-prod.yaml` - 4 lines (DB host, username, APP_KEY, password)

**GitHub secrets:**
- Only `KUBECONFIG`

**Dev database:**
- Already hardcoded: `mysql.db.svc` with root/root ✅

That's it! 🚀
