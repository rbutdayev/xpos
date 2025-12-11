#!/bin/bash
# Local Kubernetes deployment script for testing
# Assumes you have a local k8s cluster (minikube, kind, k3d, etc.)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   XPOS Local Kubernetes Deployment        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
NAMESPACE="xpos-local"
APP_KEY="base64:$(openssl rand -base64 32)"

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}kubectl is required${NC}" >&2; exit 1; }
command -v helm >/dev/null 2>&1 || { echo -e "${RED}helm is required${NC}" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}docker is required${NC}" >&2; exit 1; }

# Check if kubectl is connected
kubectl cluster-info >/dev/null 2>&1 || { echo -e "${RED}Not connected to a Kubernetes cluster${NC}" >&2; exit 1; }

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Build images
echo -e "${YELLOW}📦 Building Docker images...${NC}"
docker build -f Dockerfile.web -t xpos-web:local .
docker build -f Dockerfile.worker -t xpos-worker:local .
docker build -f Dockerfile.scheduler -t xpos-scheduler:local .
echo -e "${GREEN}✅ Images built${NC}"
echo ""

# Create namespace
echo -e "${YELLOW}📝 Creating namespace...${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ Namespace created${NC}"
echo ""

# Create secrets
echo -e "${YELLOW}🔐 Creating secrets...${NC}"
kubectl create secret generic xpos-secrets \
  --from-literal=APP_KEY="${APP_KEY}" \
  --from-literal=DB_PASSWORD="password" \
  --from-literal=REDIS_PASSWORD="" \
  --namespace ${NAMESPACE} \
  --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ Secrets created${NC}"
echo ""

# Deploy with Helm
echo -e "${YELLOW}🚀 Deploying with Helm...${NC}"
helm upgrade --install xpos ./helm/xpos \
  --namespace ${NAMESPACE} \
  --values ./helm/xpos/values-dev.yaml \
  --set image.registry="" \
  --set image.repository="xpos" \
  --set image.tag="local" \
  --set image.pullPolicy="Never" \
  --set web.replicaCount=1 \
  --set worker.replicaCount=1 \
  --set worker.autoscaling.enabled=false \
  --set config.database.host="mysql" \
  --set config.database.password="password" \
  --set ingress.enabled=false \
  --wait \
  --timeout 5m

echo -e "${GREEN}✅ Deployment complete${NC}"
echo ""

# Wait for pods
echo -e "${YELLOW}⏳ Waiting for pods to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=web -n ${NAMESPACE} --timeout=300s

# Get pod status
echo -e "${BLUE}📊 Pod Status:${NC}"
kubectl get pods -n ${NAMESPACE}
echo ""

# Port forward
echo -e "${YELLOW}🔌 Setting up port forwarding...${NC}"
echo -e "${GREEN}Access the application at: http://localhost:8080${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
kubectl port-forward -n ${NAMESPACE} svc/xpos-web 8080:80
