# Secrets Management Guide

## How Production Secrets Work

**Helm automatically creates Kubernetes Secrets from your values file!** ✅

### Complete Flow:

```
Step 1: Edit values-prod.yaml
┌─────────────────────────────────────┐
│ iac/helm/xpos/values-prod.yaml     │
│                                     │
│ secrets:                            │
│   appKey: "base64:xxx"              │ ← You put credentials here
│   databasePassword: "prod_pass"    │
│   redisPassword: ""                 │
└─────────────────────────────────────┘
              ↓
Step 2: Helm reads values and creates Secret
┌─────────────────────────────────────┐
│ Kubernetes Secret (auto-created)   │
│ Name: xpos-secrets                  │
│                                     │
│ Data (base64 encoded):              │
│   APP_KEY: YmFzZTY0Onh4eA==        │
│   DB_PASSWORD: cHJvZF9wYXNz        │
└─────────────────────────────────────┘
              ↓
Step 3: Pods mount secret as ENV vars
┌─────────────────────────────────────┐
│ Pod Environment Variables           │
│                                     │
│ APP_KEY=base64:xxx                  │
│ DB_PASSWORD=prod_pass               │
│ DB_HOST=mysql.db.svc                │
│ DB_USERNAME=root                    │
└─────────────────────────────────────┘
```

## Template: secret.yaml

This Helm template creates the Kubernetes Secret:

```yaml
# iac/helm/xpos/templates/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: xpos-secrets
type: Opaque
stringData:
  APP_KEY: {{ .Values.secrets.appKey }}           # From values-prod.yaml
  DB_PASSWORD: {{ .Values.secrets.databasePassword }}  # From values-prod.yaml
  REDIS_PASSWORD: {{ .Values.secrets.redisPassword }}
```

**Helm fills in the values and creates the secret automatically!**

## Example: Production Setup

### 1. Edit `iac/helm/xpos/values-prod.yaml`:

```yaml
config:
  database:
    host: "prod-mysql.database.svc"
    database: xpos_prod
    username: xpos_prod

# Put your production credentials here:
secrets:
  appKey: "base64:YOUR_PROD_APP_KEY_HERE"      # Generate with: php artisan key:generate --show
  databasePassword: "YourStrongProdPassword123"
  redisPassword: ""
```

### 2. Deploy with Helm:

```bash
helm upgrade --install xpos ./iac/helm/xpos \
  --namespace xpos-prod \
  --values ./iac/helm/xpos/values-prod.yaml
```

### 3. Helm automatically creates:

```bash
# Check the created secret
kubectl get secret xpos-secrets -n xpos-prod

NAME            TYPE     DATA   AGE
xpos-secrets    Opaque   2      10s

# View secret (base64 encoded)
kubectl get secret xpos-secrets -n xpos-prod -o yaml

# Decode to see values
kubectl get secret xpos-secrets -n xpos-prod -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

### 4. Pods automatically use it:

```yaml
# In deployment templates, secrets are mounted as env vars:
env:
- name: APP_KEY
  valueFrom:
    secretKeyRef:
      name: xpos-secrets
      key: APP_KEY
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: xpos-secrets
      key: DB_PASSWORD
```

## Security: Should I Commit values-prod.yaml?

**Option 1: Commit Encrypted (Recommended for GitOps)**

Use tools like:
- **SOPS** (Secret Operations)
- **Sealed Secrets**
- **Helm Secrets plugin**

```bash
# Encrypt with SOPS
sops -e values-prod.yaml > values-prod.enc.yaml

# Commit encrypted file
git add values-prod.enc.yaml
git commit -m "Add encrypted prod values"

# Deploy (SOPS decrypts automatically)
helm secrets upgrade --install xpos ./iac/helm/xpos \
  -f values-prod.enc.yaml
```

**Option 2: Don't Commit (Store Separately)**

```bash
# Add to .gitignore
echo "iac/helm/xpos/values-prod.yaml" >> .gitignore

# Store in secure location (password manager, vault, etc.)
# Pass credentials during deployment
helm upgrade --install xpos ./iac/helm/xpos \
  --set secrets.appKey="base64:xxx" \
  --set secrets.databasePassword="xxx"
```

**Option 3: Use External Secrets (Advanced)**

Use Kubernetes External Secrets Operator to pull from:
- AWS Secrets Manager
- Google Secret Manager
- HashiCorp Vault
- Azure Key Vault

## Current Setup (Simple)

For now, you're using **Option 2 (Simple)**:

1. Edit `values-prod.yaml` with real credentials
2. Keep file locally (don't commit with real secrets)
3. Helm reads values and creates Kubernetes Secret
4. Secret exists only in Kubernetes

## Verify Secrets Work

After deploying:

```bash
# Check secret exists
kubectl get secret xpos-secrets -n xpos-prod

# Get a pod
POD=$(kubectl get pod -n xpos-prod -l app.kubernetes.io/component=web -o jsonpath="{.items[0].metadata.name}")

# Check environment variables are set
kubectl exec -n xpos-prod $POD -- env | grep -E "APP_KEY|DB_PASSWORD"

# Test database connection
kubectl exec -n xpos-prod $POD -- php artisan tinker --execute="DB::connection()->getPdo();"
```

## Summary

| Question | Answer |
|----------|--------|
| Where do I put prod credentials? | `iac/helm/xpos/values-prod.yaml` |
| Who creates the Kubernetes Secret? | Helm (automatically) ✅ |
| When is the secret created? | During `helm install/upgrade` |
| Where is the secret stored? | In Kubernetes (etcd, encrypted) |
| How do pods access it? | As environment variables |
| Should I commit values-prod.yaml? | Optional (encrypt or store separately) |

## Quick Reference

```bash
# 1. Edit credentials
nano iac/helm/xpos/values-prod.yaml

# 2. Deploy (Helm creates secret automatically)
helm upgrade --install xpos ./iac/helm/xpos \
  --namespace xpos-prod \
  --values ./iac/helm/xpos/values-prod.yaml

# 3. Verify
kubectl get secret xpos-secrets -n xpos-prod
```

**You don't need to manually create secrets - Helm does it!** ✅
