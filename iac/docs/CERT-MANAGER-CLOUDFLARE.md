# Cert-Manager with Cloudflare (Wildcard SSL)

## Prerequisites
- K3s cluster running
- Domain in Cloudflare
- Cloudflare API Token

## Get Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Create Token → Edit zone DNS template
3. Permissions:
   - `Zone:DNS:Edit`
   - `Zone:Zone:Read`
4. Zone Resources: Include → Specific zone → your-domain.com
5. Copy token

## Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.2/cert-manager.yaml

# Wait for pods
kubectl get pods -n cert-manager
```

## Configure Cloudflare Secret

```bash
kubectl create secret generic cloudflare-api-token \
  --namespace cert-manager \
  --from-literal=api-token=eqa18h9gZr5okIbIHUq50GlGA93iDtDDftkXUKuP
```

## Create ClusterIssuer

```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: hello@xpos.az
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        cloudflare:
          apiTokenSecretRef:
            name: cloudflare-api-token
            key: api-token
EOF
```

## Create Staging Issuer (for testing)

```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: your@email.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - dns01:
        cloudflare:
          apiTokenSecretRef:
            name: cloudflare-api-token
            key: api-token
EOF
```

## Use in Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - "*.example.com"
    - "example.com"
    secretName: wildcard-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80
```

## Verify Certificate

```bash
kubectl get certificate
kubectl describe certificate wildcard-tls
```

## Troubleshoot

```bash
# Check cert-manager logs
kubectl logs -n cert-manager deploy/cert-manager

# Check certificate status
kubectl get certificaterequest
kubectl describe certificaterequest

# Check challenge
kubectl get challenges
kubectl describe challenge
```
