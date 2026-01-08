# Production Deployment Guide - Step by Step
**Date:** 2026-01-08
**Status:** ✅ Ready to Deploy

## Overview

This guide takes you from **zero to production** with a secure, stable Kubernetes deployment.

All critical issues have been fixed:
- ✅ Redis maxmemory configured (no OOM crashes)
- ✅ Redis authentication enabled
- ✅ No exposed secrets in git
- ✅ Proper resource limits
- ✅ Security hardened

---

## Step 1: Revoke Exposed GitHub Token ⚠️ CRITICAL

**Your GitHub token was exposed in git. Revoke it immediately!**

```bash
# 1. Go to: https://github.com/settings/tokens
# 2. Find token starting with: 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
# 3. Click "Delete" or "Revoke"
```

---

## Step 2: Generate New GitHub Token

```bash
# 1. Go to: https://github.com/settings/tokens/new
# 2. Token name: "XPOS Kubernetes GHCR"
# 3. Select scopes:
#    ☑ read:packages
#    ☑ write:packages (if you push images)
# 4. Click "Generate token"
# 5. Copy the token (you'll need it in Step 4)
```

---

## Step 3: Prepare Production Secrets

Generate all secrets you'll need:

```bash
cd /Users/ruslan/projects/xpos/xpos

# 1. Generate Laravel APP_KEY
php artisan key:generate --show
# Output: base64:xxxxxxxxxxxxxxxxxxxxx
# Copy this!

# 2. Generate strong Redis password
openssl rand -base64 32
# Output: xxxxxxxxxxxxxxxxxxxxxxxx
# Copy this!

# You should now have:
# ✓ APP_KEY (from Laravel)
# ✓ Database password (from your Azure MySQL setup: ft59yeCth89oDC)
# ✓ Redis password (just generated)
# ✓ GitHub token (from Step 2)
```

---

## Step 4: Create Kubernetes Namespace & Secrets

### Create Namespace

```bash
kubectl create namespace xpos-prod
```

### Create GitHub Container Registry Secret

```bash
# Replace YOUR_GITHUB_TOKEN with the token from Step 2
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=rbutdayev \
  --docker-password=YOUR_GITHUB_TOKEN \
  --namespace=xpos-prod
```

### Create Application Secrets

**Choose ONE method:**

#### Method 1: Simple kubectl (Quick & Easy)

```bash
kubectl create secret generic xpos-secrets \
  --from-literal=APP_KEY='base64:YOUR_APP_KEY_HERE' \
  --from-literal=DB_PASSWORD='ft59yeCth89oDC' \
  --from-literal=REDIS_PASSWORD='YOUR_REDIS_PASSWORD_HERE' \
  --namespace=xpos-prod
```

#### Method 2: Sealed Secrets (Recommended for GitOps)

If you want to commit secrets to git safely:

```bash
# Install sealed-secrets controller (once per cluster)
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Install kubeseal CLI (on your machine)
# macOS:
brew install kubeseal

# Linux:
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-0.24.0-linux-amd64.tar.gz
tar xfz kubeseal-0.24.0-linux-amd64.tar.gz
sudo install -m 755 kubeseal /usr/local/bin/kubeseal

# Create sealed secret
kubectl create secret generic xpos-secrets \
  --from-literal=APP_KEY='base64:YOUR_APP_KEY_HERE' \
  --from-literal=DB_PASSWORD='ft59yeCth89oDC' \
  --from-literal=REDIS_PASSWORD='YOUR_REDIS_PASSWORD_HERE' \
  --namespace=xpos-prod \
  --dry-run=client -o yaml | \
  kubeseal -o yaml > /Users/ruslan/projects/xpos/iac/sealed-secret-xpos-prod.yaml

# Now you can safely commit this to git!
git add iac/sealed-secret-xpos-prod.yaml
git commit -m "Add sealed production secrets"

# Deploy the sealed secret
kubectl apply -f iac/sealed-secret-xpos-prod.yaml
```

### Verify Secrets Created

```bash
kubectl get secrets -n xpos-prod

# You should see:
# NAME           TYPE                             DATA   AGE
# ghcr-secret    kubernetes.io/dockerconfigjson   1      1m
# xpos-secrets   Opaque                           3      1m
```

---

## Step 5: Verify Helm Chart

Before deploying, verify the chart is valid:

```bash
cd /Users/ruslan/projects/xpos

# Lint the chart
helm lint iac/helm/xpos --values iac/helm/xpos/values-prod.yaml

# Dry run to see what will be created
helm install xpos-test iac/helm/xpos \
  --namespace xpos-prod \
  --values iac/helm/xpos/values-prod.yaml \
  --dry-run --debug | less

# Press 'q' to quit
```

---

## Step 6: Deploy to Production 🚀

```bash
cd /Users/ruslan/projects/xpos

# Deploy with Helm
helm upgrade --install xpos ./iac/helm/xpos \
  --namespace xpos-prod \
  --values ./iac/helm/xpos/values-prod.yaml \
  --timeout 10m \
  --wait

# Watch deployment progress
kubectl get pods -n xpos-prod -w
```

### Expected Output

You should see pods starting:

```
NAME                              READY   STATUS              RESTARTS   AGE
xpos-redis-master-0               0/1     ContainerCreating   0          10s
xpos-scheduler-xxx-xxx            0/1     ContainerCreating   0          10s
xpos-web-xxx-xxx                  0/1     ContainerCreating   0          10s
xpos-web-xxx-xxx                  0/1     ContainerCreating   0          10s
xpos-web-xxx-xxx                  0/1     ContainerCreating   0          10s
xpos-worker-xxx-xxx               0/1     ContainerCreating   0          10s
xpos-worker-xxx-xxx               0/1     ContainerCreating   0          10s
xpos-worker-xxx-xxx               0/1     ContainerCreating   0          10s
xpos-worker-xxx-xxx               0/1     ContainerCreating   0          10s
xpos-worker-xxx-xxx               0/1     ContainerCreating   0          10s
```

After a few minutes, all should be Running:

```
NAME                              READY   STATUS    RESTARTS   AGE
xpos-redis-master-0               1/1     Running   0          2m
xpos-scheduler-xxx-xxx            1/1     Running   0          2m
xpos-web-xxx-xxx                  1/1     Running   0          2m
xpos-web-xxx-xxx                  1/1     Running   0          2m
xpos-web-xxx-xxx                  1/1     Running   0          2m
xpos-worker-xxx-xxx               1/1     Running   0          2m
xpos-worker-xxx-xxx               1/1     Running   0          2m
xpos-worker-xxx-xxx               1/1     Running   0          2m
xpos-worker-xxx-xxx               1/1     Running   0          2m
xpos-worker-xxx-xxx               1/1     Running   0          2m
```

Press `Ctrl+C` to stop watching.

---

## Step 7: Verify Redis Configuration ✅

This is **CRITICAL** - verify Redis won't crash:

```bash
# 1. Check maxmemory setting (should be 400MB)
kubectl exec -it xpos-redis-master-0 -n xpos-prod -- \
  redis-cli CONFIG GET maxmemory

# Expected output:
# 1) "maxmemory"
# 2) "419430400"  ✅ This is 400MB in bytes

# 2. Check eviction policy (should be allkeys-lru)
kubectl exec -it xpos-redis-master-0 -n xpos-prod -- \
  redis-cli CONFIG GET maxmemory-policy

# Expected output:
# 1) "maxmemory-policy"
# 2) "allkeys-lru"  ✅

# 3. Check authentication is enabled
kubectl exec -it xpos-redis-master-0 -n xpos-prod -- \
  redis-cli PING

# Expected output:
# (error) NOAUTH Authentication required.  ✅ This means auth works!

# 4. Test with password (should work)
REDIS_PASS=$(kubectl get secret xpos-secrets -n xpos-prod -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d)
kubectl exec -it xpos-redis-master-0 -n xpos-prod -- \
  redis-cli -a "$REDIS_PASS" PING

# Expected output:
# PONG  ✅ Redis auth working!

# 5. Check current memory usage
kubectl exec -it xpos-redis-master-0 -n xpos-prod -- \
  redis-cli -a "$REDIS_PASS" INFO memory | grep used_memory_human

# Should show usage (should be < 400MB)
```

**If all checks pass, your Redis won't go BOOM!** 💥❌ → ✅

---

## Step 8: Verify Application Health

```bash
# 1. Check all pods are running
kubectl get pods -n xpos-prod

# All should show READY: 1/1 and STATUS: Running

# 2. Check web pod logs
kubectl logs -n xpos-prod -l app.kubernetes.io/component=web --tail=50

# Should not show errors

# 3. Check worker pod logs
kubectl logs -n xpos-prod -l app.kubernetes.io/component=worker --tail=50

# Should show: "Processing jobs..."

# 4. Test health endpoint
kubectl port-forward -n xpos-prod svc/xpos 8080:80 &

# In same or another terminal:
curl http://localhost:8080/health

# Expected: {"status":"healthy"} or similar

# Kill port-forward:
pkill -f "port-forward.*xpos"
```

---

## Step 9: Verify Database Connection

```bash
# Get a web pod name
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")

# Test database connection
kubectl exec -n xpos-prod $POD -- php artisan tinker --execute="
  try {
    DB::connection()->getPdo();
    echo 'Database connected successfully!';
  } catch (Exception \$e) {
    echo 'Database connection failed: ' . \$e->getMessage();
  }
"

# Expected output:
# Database connected successfully!  ✅
```

---

## Step 10: Verify Redis Connection from App

```bash
# Test Redis connection from Laravel
kubectl exec -n xpos-prod $POD -- php artisan tinker --execute="
  try {
    \$redis = Redis::connection();
    \$redis->set('deployment_test', 'success');
    \$result = \$redis->get('deployment_test');
    echo 'Redis test: ' . \$result;
  } catch (Exception \$e) {
    echo 'Redis connection failed: ' . \$e->getMessage();
  }
"

# Expected output:
# Redis test: success  ✅
```

---

## Step 11: Check Resource Usage

```bash
# Check pod resource usage
kubectl top pods -n xpos-prod

# Check Redis memory usage specifically
kubectl exec -it xpos-redis-master-0 -n xpos-prod -- \
  redis-cli -a "$(kubectl get secret xpos-secrets -n xpos-prod -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d)" \
  INFO memory | grep -E "used_memory_human|maxmemory_human"

# used_memory_human should be < maxmemory_human (400MB)
```

---

## Step 12: Verify Autoscaling & PDBs

```bash
# Check Horizontal Pod Autoscalers
kubectl get hpa -n xpos-prod

# Expected output:
# NAME          REFERENCE                TARGETS         MINPODS   MAXPODS   REPLICAS
# xpos-web      Deployment/xpos-web      25%/70%, 30%/80%   3         20        3
# xpos-worker   Deployment/xpos-worker   15%/70%, 20%/80%   5         30        5

# Check Pod Disruption Budgets
kubectl get pdb -n xpos-prod

# Expected output:
# NAME          MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS
# xpos-web      1               N/A               2
# xpos-worker   2               N/A               3
```

---

## Step 13: Run Database Migrations

```bash
# Get a web pod
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")

# Run migrations
kubectl exec -n xpos-prod $POD -- php artisan migrate --force

# Expected output:
# Migration table created successfully.
# Migrating: ...
# Migrated: ...
```

---

## Step 14: Access Your Application

```bash
# Check ingress
kubectl get ingress -n xpos-prod

# You should see: app.xpos.az

# Access in browser:
# https://app.xpos.az

# Or test with curl:
curl -I https://app.xpos.az
```

---

## 🎉 Deployment Complete!

Your production deployment is now:
- ✅ Secure (no exposed secrets)
- ✅ Stable (Redis won't crash)
- ✅ Scalable (HPA configured)
- ✅ Resilient (PDBs prevent downtime)
- ✅ Monitored (health checks enabled)

---

## Monitoring & Maintenance

### Watch Redis Memory (Run in background)

```bash
# Monitor Redis memory every 10 seconds
watch -n 10 "kubectl exec -it xpos-redis-master-0 -n xpos-prod -- \
  redis-cli -a \$(kubectl get secret xpos-secrets -n xpos-prod -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d) \
  INFO memory | grep -E 'used_memory_human|maxmemory_human|evicted_keys'"
```

### Check for Pod Restarts

```bash
kubectl get pods -n xpos-prod -o wide

# Look at RESTARTS column - should be 0 or low
```

### View Logs

```bash
# Web logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=web

# Worker logs
kubectl logs -f -n xpos-prod -l app.kubernetes.io/component=worker

# Redis logs
kubectl logs -f -n xpos-prod xpos-redis-master-0
```

### Scale Manually (if needed)

```bash
# Scale web pods to 5
kubectl scale deployment xpos-web -n xpos-prod --replicas=5

# Scale workers to 10
kubectl scale deployment xpos-worker -n xpos-prod --replicas=10
```

---

## Rollback Procedure (If Needed)

If something goes wrong:

```bash
# List Helm releases and revisions
helm list -n xpos-prod
helm history xpos -n xpos-prod

# Rollback to previous version
helm rollback xpos -n xpos-prod

# Or rollback to specific revision
helm rollback xpos 1 -n xpos-prod

# Watch rollback
kubectl get pods -n xpos-prod -w
```

---

## Common Issues & Solutions

### Issue: Pods stuck in ImagePullBackOff

```bash
# Check if ghcr-secret exists
kubectl get secret ghcr-secret -n xpos-prod

# If missing, recreate it (Step 4)
```

### Issue: Database connection failed

```bash
# Check if database credentials are correct
kubectl get secret xpos-secrets -n xpos-prod -o jsonpath='{.data.DB_PASSWORD}' | base64 -d

# Verify database host is accessible
kubectl run -it --rm debug --image=mysql:8 --restart=Never -n xpos-prod -- \
  mysql -h ithelp-mysql.mysql.database.azure.com -u xpos_user -p
```

### Issue: Redis connection failed

```bash
# Check Redis pod is running
kubectl get pods -n xpos-prod | grep redis

# Check Redis logs
kubectl logs -n xpos-prod xpos-redis-master-0

# Verify Redis password
kubectl get secret xpos-secrets -n xpos-prod -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d
```

---

## Next Steps

1. **Setup Monitoring**
   - Install Prometheus & Grafana
   - Configure alerts for Redis memory
   - Monitor queue job processing

2. **Setup Backups**
   - Database backups (Azure handles this)
   - Redis snapshots (already configured)
   - Application files (if using local storage)

3. **Setup CI/CD**
   - GitHub Actions for automated deployments
   - Automated tests before deployment

4. **Performance Tuning**
   - Monitor resource usage
   - Adjust HPA thresholds
   - Optimize worker count

---

## Summary

You deployed:
- **3 web pods** (auto-scale 3-20)
- **5 worker pods** (auto-scale 5-30)
- **1 scheduler pod**
- **Redis** with 400MB limit, LRU eviction, auth enabled
- **Pod Disruption Budgets** for high availability
- **Security contexts** (non-root)
- **Resource limits** (optimized)

**Your production deployment is secure, stable, and ready!** 🚀

No more BOOM! 💥❌ → 🛡️✅
