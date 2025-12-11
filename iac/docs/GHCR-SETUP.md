# GitHub Container Registry (GHCR) Setup

## Is GHCR Already Enabled?

**Yes!** GHCR is automatically available for all GitHub accounts. ✅

No manual activation needed - GitHub Actions will automatically push images to:
```
ghcr.io/rbutdayev/xpos-web
ghcr.io/rbutdayev/xpos-worker
ghcr.io/rbutdayev/xpos-scheduler
```

## What Happens on First Push

1. You push to `develop` branch
2. GitHub Actions builds 3 Docker images
3. **GHCR automatically creates the packages** (first time only)
4. Images are pushed to your account

**First time:** Packages are created as **private** by default.

## Make Packages Public (Recommended)

After the first successful build:

### Option A: Via GitHub UI

1. Go to: https://github.com/rbutdayev?tab=packages
2. You'll see 3 packages:
   - `xpos-web`
   - `xpos-worker`
   - `xpos-scheduler`
3. Click each package → **Package settings** → **Change visibility** → **Public**

### Option B: Keep Private (Need Extra Setup)

If you want to keep packages private, you need to configure `imagePullSecrets` in Kubernetes:

```bash
# Create a GitHub Personal Access Token (PAT)
# Go to: https://github.com/settings/tokens
# Generate new token (classic)
# Permissions: read:packages

# Create imagePullSecret in Kubernetes
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=rbutdayev \
  --docker-password=YOUR_GITHUB_PAT \
  -n xpos-dev

kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=rbutdayev \
  --docker-password=YOUR_GITHUB_PAT \
  -n xpos-prod
```

Then update `values.yaml`:
```yaml
global:
  imagePullSecrets:
    - name: ghcr-secret
```

## Verify GHCR Works

After first push to develop:

```bash
# Check GitHub Actions
# Go to: https://github.com/rbutdayev/xpos/actions

# Check if images were pushed
# Go to: https://github.com/rbutdayev?tab=packages

# Pull image manually (if public)
docker pull ghcr.io/rbutdayev/xpos-web:develop
```

## Your Configuration (Already Set!)

✅ Registry: `ghcr.io`
✅ Repository: `rbutdayev/xpos`

**Full image names:**
```
ghcr.io/rbutdayev/xpos-web:develop
ghcr.io/rbutdayev/xpos-web:main
ghcr.io/rbutdayev/xpos-web:v1.0.0

ghcr.io/rbutdayev/xpos-worker:develop
ghcr.io/rbutdayev/xpos-worker:v1.0.0

ghcr.io/rbutdayev/xpos-scheduler:develop
ghcr.io/rbutdayev/xpos-scheduler:v1.0.0
```

## GitHub Actions Permissions (Already Configured!)

The workflow file `.github/workflows/build-and-push.yml` already has:

```yaml
permissions:
  contents: read
  packages: write  # ← Allows pushing to GHCR
```

And uses `GITHUB_TOKEN` (automatically provided):

```yaml
- name: Log in to Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}  # ← Automatic!
```

## Troubleshooting

### "Permission denied" when pushing

**Solution:** Check workflow has `packages: write` permission (already set ✅)

### "Package not found" when pulling in Kubernetes

**Solution:** Make package public or configure imagePullSecrets

### Images not showing in GitHub Packages

**Solution:** Check GitHub Actions logs for build errors

## Summary

**What you need to do:**
1. ✅ Nothing! GHCR is already enabled
2. ✅ GitHub username already set: `rbutdayev`
3. ✅ Registry already configured: `ghcr.io`
4. 📦 After first build: Make packages public (recommended)

**Recommended after first deploy:**
```bash
# 1. Push to trigger build
git push origin develop

# 2. Wait for build to complete
# Check: https://github.com/rbutdayev/xpos/actions

# 3. Make packages public
# Go to: https://github.com/rbutdayev?tab=packages
# Click each package → Change visibility → Public
```

That's it! 🚀
