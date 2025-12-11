# Deploy Dev Environment - Step by Step

## Current Status

✅ Dev database: Hardcoded to `mysql.db.svc` (root/root)
✅ Dev domain: `dev.xpos.az`
✅ Dev ingress: Created
✅ Helm chart: Ready
⚠️ Need: APP_KEY for dev
⚠️ Need: KUBECONFIG in GitHub

## Step 1: Generate Dev APP_KEY

```bash
cd /Users/ruslan/projects/xpos/xpos
php artisan key:generate --show
```

**Copy the output** (looks like: `base64:xxxxxxxxxxxxx`)

## Step 2: Update Dev Values

```bash
nano /Users/ruslan/projects/xpos/iac/helm/xpos/values-dev.yaml
```

Find line 15 and replace:
```yaml
secrets:
  appKey: "base64:GENERATE_THIS_WITH_ARTISAN"  # ← Replace with generated key
```

With:
```yaml
secrets:
  appKey: "base64:YOUR_GENERATED_KEY_HERE"     # ← Paste the key from step 1
```

Save and exit (Ctrl+X, Y, Enter)

## Step 3: Add KUBECONFIG to GitHub

```bash
# Get your kubeconfig (base64 encoded)
cat ~/.kube/config | base64 | pbcopy   # macOS - copies to clipboard
# Or for Linux:
# cat ~/.kube/config | base64 | xclip -selection clipboard
```

**Add to GitHub:**
1. Go to: https://github.com/rbutdayev/xpos/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `KUBECONFIG`
4. Value: Paste the base64 string
5. Click **"Add secret"**

## Step 4: Commit and Push

```bash
cd /Users/ruslan/projects/xpos

# Check what's changed
git status

# Add all changes
git add .

# Commit
git commit -m "Configure Kubernetes deployment for dev and prod"

# Create develop branch and push
git checkout -b develop
git push origin develop
```

## Step 5: Watch Deployment

**GitHub Actions will automatically:**
1. Build 3 Docker images (web, worker, scheduler)
2. Push to GHCR (ghcr.io/rbutdayev/xpos-*)
3. Deploy to Kubernetes namespace: xpos-dev
4. Apply ingress for dev.xpos.az
5. Run migrations

**Monitor progress:**
- Go to: https://github.com/rbutdayev/xpos/actions
- Click on the running workflow
- Watch the logs

## Step 6: Verify Deployment

```bash
# Check pods
kubectl get pods -n xpos-dev

# Should see:
# xpos-web-xxxxx          1/1     Running
# xpos-worker-xxxxx       1/1     Running
# xpos-scheduler-xxxxx    1/1     Running
# redis-xxxxx             1/1     Running

# Check ingress
kubectl get ingress -n xpos-dev

# Check logs
kubectl logs -f -n xpos-dev -l app.kubernetes.io/component=web
```

## Step 7: Access Application

```bash
# Make sure DNS is configured
# dev.xpos.az → Your cluster IP

# Test
curl https://dev.xpos.az

# Or open in browser:
# https://dev.xpos.az
```

## Troubleshooting

### Workflow fails at "Build and push"

**Solution:** Make sure GitHub Actions has permissions
- Go to: https://github.com/rbutdayev/xpos/settings/actions
- Under "Workflow permissions" → Select "Read and write permissions"
- Save

### Workflow fails at "Deploy with Helm"

**Solution:** Check KUBECONFIG secret
```bash
# Verify kubeconfig works locally
kubectl cluster-info

# Re-add to GitHub if needed
cat ~/.kube/config | base64
```

### Pods stuck in "ImagePullBackOff"

**Solution:** Make packages public
1. Go to: https://github.com/rbutdayev?tab=packages
2. Click each package (xpos-web, xpos-worker, xpos-scheduler)
3. Package settings → Change visibility → Public

### Database connection errors

**Solution:** Ensure MySQL is running in Kubernetes
```bash
# Check if MySQL exists
kubectl get pods -n db

# If not, deploy MySQL first
kubectl create namespace db
helm install mysql bitnami/mysql \
  --namespace db \
  --set auth.rootPassword=root \
  --set auth.database=xpos_dev
```

### Ingress not working

**Solution:** Check cert-manager and nginx-ingress
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check cert-manager
kubectl get pods -n cert-manager

# Check certificate
kubectl get certificate -n xpos-dev
```

## Quick Commands Reference

```bash
# View all dev resources
kubectl get all -n xpos-dev

# View logs
kubectl logs -f -n xpos-dev -l app.kubernetes.io/component=web
kubectl logs -f -n xpos-dev -l app.kubernetes.io/component=worker

# Shell into web pod
POD=$(kubectl get pod -n xpos-dev -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD -n xpos-dev -- bash

# Run artisan commands
kubectl exec -n xpos-dev $POD -- php artisan migrate
kubectl exec -n xpos-dev $POD -- php artisan tinker

# Restart deployment
kubectl rollout restart deployment/xpos-web -n xpos-dev
kubectl rollout restart deployment/xpos-worker -n xpos-dev
```

## Expected Timeline

```
Push to develop
  ↓
GitHub Actions triggered (0-30 seconds)
  ↓
Build images (5-10 minutes)
  ↓
Push to GHCR (1-2 minutes)
  ↓
Deploy to Kubernetes (2-3 minutes)
  ↓
Pods starting (1-2 minutes)
  ↓
✅ dev.xpos.az is live! (Total: ~10-15 minutes)
```

## Checklist

```
Pre-deployment:
[ ] Generate dev APP_KEY (php artisan key:generate --show)
[ ] Update iac/helm/xpos/values-dev.yaml line 15
[ ] Add KUBECONFIG to GitHub Secrets
[ ] Ensure MySQL is running in k8s (namespace: db, service: mysql.db.svc)
[ ] DNS: dev.xpos.az → cluster IP

Deploy:
[ ] git add .
[ ] git commit -m "Configure K8s deployment"
[ ] git checkout -b develop
[ ] git push origin develop

Monitor:
[ ] Watch GitHub Actions: https://github.com/rbutdayev/xpos/actions
[ ] Check pods: kubectl get pods -n xpos-dev
[ ] Check ingress: kubectl get ingress -n xpos-dev

Verify:
[ ] Visit: https://dev.xpos.az
[ ] Test login
[ ] Check worker is processing jobs
[ ] Check Redis is working
```

Ready to go! 🚀
