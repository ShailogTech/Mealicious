# deploy.ps1 - Mealicious Kubernetes Deployment (Windows/PowerShell)
# Usage: .\kubernetes\deploy.ps1
# Requires: minikube, kubectl, docker

$ErrorActionPreference = "Stop"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR = Split-Path -Parent $SCRIPT_DIR

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Mealicious - Kubernetes Deployment"    -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Refresh PATH (for minikube after install)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 2. Check Docker is running
Write-Host "`n[1/7] Checking Docker..." -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    Write-Host "  Docker is running." -ForegroundColor Green
} catch {
    Write-Host "  Docker is NOT running. Starting Docker Desktop..." -ForegroundColor Red
    Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "  Waiting 20s for Docker to start..."
    Start-Sleep -Seconds 20
}

# 3. Start minikube if not running
Write-Host "`n[2/7] Checking Minikube..." -ForegroundColor Yellow
$status = minikube status 2>&1
if ($status -match "Running") {
    Write-Host "  Minikube is running." -ForegroundColor Green
} else {
    Write-Host "  Starting Minikube..." -ForegroundColor Yellow
    minikube start --driver=docker 2>&1 | Write-Host
    minikube addons enable ingress 2>&1 | Out-Null
    Write-Host "  Minikube started with ingress addon." -ForegroundColor Green
}

# 4. Point Docker to minikube's daemon
Write-Host "`n[3/7] Configuring Docker for Minikube..." -ForegroundColor Yellow
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Write-Host "  Docker now targets minikube's daemon." -ForegroundColor Green

# 5. Build the Docker image
Write-Host "`n[4/7] Building Docker image..." -ForegroundColor Yellow
docker build -t mealicious:local $ROOT_DIR 2>&1 | Write-Host
Write-Host "  Image built: mealicious:local" -ForegroundColor Green

# 6. Apply Kubernetes manifests
Write-Host "`n[5/7] Applying Kubernetes manifests..." -ForegroundColor Yellow
kubectl apply -f "$SCRIPT_DIR\namespace.yaml" 2>&1 | Write-Host
kubectl apply -f "$SCRIPT_DIR\configmap.yaml" 2>&1 | Write-Host
kubectl apply -f "$SCRIPT_DIR\secrets.yaml" 2>&1 | Write-Host
kubectl apply -f "$SCRIPT_DIR\postgres-db.yaml" 2>&1 | Write-Host
kubectl apply -f "$SCRIPT_DIR\app.yaml" 2>&1 | Write-Host
kubectl apply -f "$SCRIPT_DIR\ingress.yaml" 2>&1 | Write-Host
Write-Host "  All manifests applied." -ForegroundColor Green

# 7. Wait for pods to be ready
Write-Host "`n[6/7] Waiting for pods to be ready..." -ForegroundColor Yellow
kubectl wait --namespace mealicious --for=condition=ready pod --selector=app=mealicious-db --timeout=120s 2>&1 | Write-Host
kubectl wait --namespace mealicious --for=condition=ready pod --selector=app=mealicious --timeout=120s 2>&1 | Write-Host
Write-Host "  All pods are ready!" -ForegroundColor Green

# 8. Show status and access info
Write-Host "`n[7/7] Deployment complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " All resources deployed!"                -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
kubectl get all -n mealicious 2>&1 | Write-Host
Write-Host ""
Write-Host "Access the site:" -ForegroundColor Yellow
Write-Host "  Option 1:  kubectl port-forward -n mealicious svc/mealicious 3000:3000"
Write-Host "             Then visit http://localhost:3000"
Write-Host ""
Write-Host "  Option 2:  minikube service mealicious -n mealicious --url"
Write-Host "             Then visit the returned URL"
Write-Host ""
Write-Host "  Ingress:   Add to hosts file: <MINIKUBE_IP> mealicious.local"
Write-Host "             Then visit http://mealicious.local"
Write-Host ""
Write-Host "Admin panel: http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host "  Email:    admin@mealicious.com"
Write-Host "  Password: admin123"
