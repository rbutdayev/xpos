# Setup Checklist - What You Need to Fix/Add

## 1. GitHub Secrets (REQUIRED)

Go to: **GitHub → Settings → Secrets and variables → Actions**

Add these secrets:

```bash
# Get your kubeconfig (base64 encoded)
cat ~/.kube/config | base64

# Add as GitHub secret:
Name: KUBECONFIG
Value: <paste base64 output>
```

```bash
# Generate Laravel keys
cd xpos
php artisan key:generate --show

# Add as GitHub secrets:
Name: APP_KEY_DEV
Value: base64:your-generated-key-here

Name: APP_KEY_STAGING
Value: base64:your-generated-key-here

Name: APP_KEY_PROD
Value: base64:your-generated-key-here
```

```bash
# Database passwords
Name: DB_PASSWORD_DEV
Value: your-dev-database-password

Name: DB_PASSWORD_STAGING
Value: your-staging-database-password

Name: DB_PASSWORD_PROD
Value: your-production-database-password
```

```bash
# Optional: Slack notifications
Name: SLACK_WEBHOOK
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## 2. Update Helm Values Files

### File: `xpos/helm/xpos/values.yaml`

```yaml
# Line 8-10: Update image repository
image:
  registry: ghcr.io
  repository: YOUR-GITHUB-ORG/xpos  # ← CHANGE THIS!
  # Example: ruslan/xpos or your-company/xpos
```

### File: `xpos/helm/xpos/values-dev.yaml`

```yaml
# Update these lines:
config:
  appUrl: "https://xpos-dev.YOUR-DOMAIN.com"  # ← CHANGE
  database:
    host: "YOUR-DB-HOST"                       # ← CHANGE
    database: xpos_dev
    username: xpos_dev

ingress:
  hosts:
    - host: xpos-dev.YOUR-DOMAIN.com           # ← CHANGE
```

### File: `xpos/helm/xpos/values-staging.yaml`

```yaml
# Update these lines:
config:
  appUrl: "https://xpos-staging.YOUR-DOMAIN.com"  # ← CHANGE
  database:
    host: "YOUR-DB-HOST"                           # ← CHANGE
    database: xpos_staging
    username: xpos_staging

ingress:
  hosts:
    - host: xpos-staging.YOUR-DOMAIN.com           # ← CHANGE
```

### File: `xpos/helm/xpos/values-prod.yaml`

```yaml
# Update these lines:
config:
  appUrl: "https://xpos.YOUR-DOMAIN.com"  # ← CHANGE
  database:
    host: "YOUR-DB-HOST"                   # ← CHANGE
    database: xpos_prod
    username: xpos_prod

ingress:
  hosts:
    - host: xpos.YOUR-DOMAIN.com           # ← CHANGE

  # If using SSL:
  tls:
    - secretName: xpos-prod-tls
      hosts:
        - xpos.YOUR-DOMAIN.com             # ← CHANGE
```

## 3. Verify/Create Dockerfiles

Check these files exist in `xpos/` directory:

- [ ] `xpos/Dockerfile.web` - ✅ Already created
- [ ] `xpos/Dockerfile.worker` - ✅ Already created
- [ ] `xpos/Dockerfile.scheduler` - ✅ Already created

## 4. DNS Configuration (Before Deploying)

Create DNS A records pointing to your cluster:

```
xpos-dev.yourdomain.com      → YOUR-CLUSTER-IP
xpos-staging.yourdomain.com  → YOUR-CLUSTER-IP
xpos.yourdomain.com          → YOUR-CLUSTER-IP
```

## 5. Database Setup (Before Deploying)

Create databases:

```sql
CREATE DATABASE xpos_dev;
CREATE DATABASE xpos_staging;
CREATE DATABASE xpos_prod;

-- Create users (update passwords!)
CREATE USER 'xpos_dev'@'%' IDENTIFIED BY 'dev_password';
CREATE USER 'xpos_staging'@'%' IDENTIFIED BY 'staging_password';
CREATE USER 'xpos_prod'@'%' IDENTIFIED BY 'prod_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON xpos_dev.* TO 'xpos_dev'@'%';
GRANT ALL PRIVILEGES ON xpos_staging.* TO 'xpos_staging'@'%';
GRANT ALL PRIVILEGES ON xpos_prod.* TO 'xpos_prod'@'%';
FLUSH PRIVILEGES;
```

## 6. Optional: Update Workflow URLs

If you want to change the health check URLs in workflows:

### File: `.github/workflows/deploy-staging.yml` (line 80)
```yaml
curl -f https://xpos-staging.YOUR-DOMAIN.com/health || exit 1
```

### File: `.github/workflows/deploy-prod.yml` (line 104)
```yaml
curl -f https://xpos.YOUR-DOMAIN.com/health || exit 1
```

## Summary of Files to Edit

### Required:
1. ✅ Add GitHub Secrets (8 secrets)
2. ✅ `xpos/helm/xpos/values.yaml` - Update image repository
3. ✅ `xpos/helm/xpos/values-dev.yaml` - Update domain & DB
4. ✅ `xpos/helm/xpos/values-staging.yaml` - Update domain & DB
5. ✅ `xpos/helm/xpos/values-prod.yaml` - Update domain & DB

### Optional:
6. `.github/workflows/deploy-staging.yml` - Update health check URL
7. `.github/workflows/deploy-prod.yml` - Update health check URL

## Quick Edit Commands

```bash
cd /Users/ruslan/projects/xpos

# Edit image repository
nano xpos/helm/xpos/values.yaml

# Edit dev environment
nano xpos/helm/xpos/values-dev.yaml

# Edit staging environment
nano xpos/helm/xpos/values-staging.yaml

# Edit production environment
nano xpos/helm/xpos/values-prod.yaml
```

## Verification Before Deploying

```bash
# 1. Check if files exist
ls -la xpos/Dockerfile.*
ls -la xpos/helm/xpos/values*.yaml

# 2. Verify GitHub secrets
# Go to: https://github.com/YOUR-ORG/YOUR-REPO/settings/secrets/actions

# 3. Test kubeconfig
cat ~/.kube/config | base64 -d > /tmp/test-kubeconfig
kubectl --kubeconfig=/tmp/test-kubeconfig cluster-info
rm /tmp/test-kubeconfig

# 4. Verify Helm chart
helm lint xpos/helm/xpos --values xpos/helm/xpos/values-dev.yaml
```

## After Editing, Deploy!

```bash
# Test in dev first
git add .
git commit -m "Configure Kubernetes deployment"
git checkout -b develop
git push origin develop

# Monitor deployment on GitHub
# Go to: https://github.com/YOUR-ORG/YOUR-REPO/actions
```

## Checklist

Copy this to track your progress:

```
Setup Checklist:
[ ] Add KUBECONFIG to GitHub Secrets
[ ] Add APP_KEY_DEV to GitHub Secrets
[ ] Add APP_KEY_STAGING to GitHub Secrets
[ ] Add APP_KEY_PROD to GitHub Secrets
[ ] Add DB_PASSWORD_DEV to GitHub Secrets
[ ] Add DB_PASSWORD_STAGING to GitHub Secrets
[ ] Add DB_PASSWORD_PROD to GitHub Secrets
[ ] Add SLACK_WEBHOOK to GitHub Secrets (optional)
[ ] Update image.repository in values.yaml
[ ] Update appUrl in values-dev.yaml
[ ] Update database.host in values-dev.yaml
[ ] Update ingress.hosts in values-dev.yaml
[ ] Update appUrl in values-staging.yaml
[ ] Update database.host in values-staging.yaml
[ ] Update ingress.hosts in values-staging.yaml
[ ] Update appUrl in values-prod.yaml
[ ] Update database.host in values-prod.yaml
[ ] Update ingress.hosts in values-prod.yaml
[ ] Update ingress.tls in values-prod.yaml
[ ] Create DNS records
[ ] Create databases (dev, staging, prod)
[ ] Test kubectl connection
[ ] Lint Helm chart
[ ] Push to develop branch
[ ] Verify deployment works
```

That's it! Once these are updated, you're ready to deploy! 🚀
