#!/bin/bash
# deploy.sh - Mealicious Kubernetes Deployment (Linux/Mac)
# Usage: bash kubernetes/deploy.sh
# Requires: minikube, kubectl, docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo " Mealicious - Kubernetes Deployment"
echo "========================================"

# 1. Check Docker
echo -e "\n[1/7] Checking Docker..."
if docker info >/dev/null 2>&1; then
    echo "  Docker is running."
else
    echo "  ERROR: Docker is not running. Please start Docker first."
    exit 1
fi

# 2. Start minikube if not running
echo -e "\n[2/7] Checking Minikube..."
if minikube status | grep -q "Running"; then
    echo "  Minikube is running."
else
    echo "  Starting Minikube..."
    minikube start --driver=docker
    minikube addons enable ingress
    echo "  Minikube started with ingress addon."
fi

# 3. Point Docker to minikube's daemon
echo -e "\n[3/7] Configuring Docker for Minikube..."
eval $(minikube docker-env)
echo "  Docker now targets minikube's daemon."

# 4. Build the Docker image
echo -e "\n[4/7] Building Docker image..."
docker build -t mealicious:local "$ROOT_DIR"
echo "  Image built: mealicious:local"

# 5. Apply Kubernetes manifests
echo -e "\n[5/7] Applying Kubernetes manifests..."
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"
kubectl apply -f "$SCRIPT_DIR/configmap.yaml"
kubectl apply -f "$SCRIPT_DIR/secrets.yaml"
kubectl apply -f "$SCRIPT_DIR/postgres-db.yaml"
kubectl apply -f "$SCRIPT_DIR/app.yaml"
kubectl apply -f "$SCRIPT_DIR/ingress.yaml"
echo "  All manifests applied."

# 6. Wait for pods to be ready
echo -e "\n[6/7] Waiting for pods to be ready..."
kubectl wait --namespace mealicious --for=condition=ready pod --selector=app=mealicious-db --timeout=120s
kubectl wait --namespace mealicious --for=condition=ready pod --selector=app=mealicious --timeout=120s
echo "  All pods are ready!"

# 7. Show status
echo -e "\n[7/7] Deployment complete!"
echo ""
echo "========================================"
echo " All resources deployed!"
echo "========================================"
echo ""
kubectl get all -n mealicious
echo ""
echo "Access the site:"
echo "  Option 1:  kubectl port-forward -n mealicious svc/mealicious 3000:3000"
echo "             Then visit http://localhost:3000"
echo ""
echo "  Option 2:  minikube service mealicious -n mealicious --url"
echo "             Then visit the returned URL"
echo ""
echo "  Ingress:   Add to hosts file: \$(minikube ip) mealicious.local"
echo "             Then visit http://mealicious.local"
echo ""
echo "Admin panel: http://localhost:3000/admin"
echo "  Email:    admin@mealicious.com"
echo "  Password: admin123"
