# Infrastructure as Code (IaC)

This directory contains all infrastructure configuration for XPOS.

## Structure

```
iac/
├── helm/
│   └── xpos/              # Helm chart for Kubernetes deployment
│       ├── Chart.yaml
│       ├── values.yaml    # Default values
│       ├── values-dev.yaml
│       ├── values-prod.yaml
│       └── templates/     # Kubernetes manifests
├── ingress-dev.yaml       # Ingress for dev.xpos.az
├── ingress-prod.yaml      # Ingress for app.xpos.az
└── README.md              # This file
```

## Helm Chart

The Helm chart deploys:
- **xpos-web**: Web application (PHP-FPM + Nginx)
- **xpos-worker**: Queue workers (background jobs)
- **xpos-scheduler**: Laravel scheduler (cron jobs)
- **Redis**: Cache, queue, sessions

### Deploy with Helm

```bash
# Development
helm upgrade --install xpos ./iac/helm/xpos \
  --namespace xpos-dev \
  --create-namespace \
  --values ./iac/helm/xpos/values-dev.yaml

# Production
helm upgrade --install xpos ./iac/helm/xpos \
  --namespace xpos-prod \
  --create-namespace \
  --values ./iac/helm/xpos/values-prod.yaml
```

## Ingress

Ingress resources define how external traffic reaches the application.

### Apply Ingress

```bash
# Development
kubectl apply -f iac/ingress-dev.yaml

# Production
kubectl apply -f iac/ingress-prod.yaml
```

### URLs

- **Development**: https://dev.xpos.az → xpos-dev namespace
- **Production**: https://app.xpos.az → xpos-prod namespace

## Configuration Files to Edit

Before deploying:

1. **`helm/xpos/values.yaml`**
   - Line 12: `repository: rbutdayev/xpos` ✅ (already set)

2. **`helm/xpos/values-dev.yaml`**
   - Line 15: `appKey: "base64:xxx"` (generate with artisan)
   - Database config already hardcoded ✅

3. **`helm/xpos/values-prod.yaml`**
   - Lines 7-9: Database host and username
   - Line 15-16: APP_KEY and database password

4. **Ingress files** (optional)
   - Already configured for dev.xpos.az and app.xpos.az ✅
   - Update annotations if needed (rate limiting, etc.)

## Automated Deployment

GitHub Actions automatically deploys when you:

```bash
# Deploy to dev
git push origin develop

# Deploy to prod
git tag v1.0.0
git push origin v1.0.0
```

Workflow applies both Helm chart AND ingress files.

## Manual Deployment Steps

```bash
# 1. Deploy Helm chart
helm upgrade --install xpos ./iac/helm/xpos \
  --namespace xpos-dev \
  --values ./iac/helm/xpos/values-dev.yaml

# 2. Apply ingress
kubectl apply -f iac/ingress-dev.yaml

# 3. Run migrations
kubectl exec -n xpos-dev deployment/xpos-web -- php artisan migrate --force

# 4. Verify
kubectl get pods -n xpos-dev
kubectl get ingress -n xpos-dev
```

## Prerequisites

- Kubernetes cluster with:
  - Nginx Ingress Controller
  - cert-manager (for SSL/TLS)
  - Storage class with ReadWriteMany support

## Troubleshooting

### Ingress not working

```bash
# Check ingress
kubectl get ingress -n xpos-dev
kubectl describe ingress xpos-dev-ingress -n xpos-dev

# Check ingress controller
kubectl get pods -n ingress-nginx
```

### SSL certificate issues

```bash
# Check certificate
kubectl get certificate -n xpos-dev
kubectl describe certificate xpos-dev-tls -n xpos-dev

# Check cert-manager
kubectl get pods -n cert-manager
```

### Service not accessible

```bash
# Check service
kubectl get svc -n xpos-dev
kubectl describe svc xpos-web -n xpos-dev

# Check endpoints
kubectl get endpoints -n xpos-dev
```

## See Also

- **Helm Chart Docs**: `helm/xpos/README.md`
- **Setup Guide**: `../FINAL-SETUP.md`
- **Single Cluster Setup**: `../SINGLE-CLUSTER-DEPLOYMENT.md`
