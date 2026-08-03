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
docker info | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Docker is running." -ForegroundColor Green
} else {
    Write-Host "  Docker is NOT running. Starting Docker Desktop..." -ForegroundColor Red
    Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "  Waiting for Docker to become ready (up to 4 min)..."
    $deadline = (Get-Date).AddMinutes(4)
    while ((Get-Date) -lt $deadline) {
        docker info | Out-Null
        if ($LASTEXITCODE -eq 0) { break }
        Start-Sleep -Seconds 5
    }
    if ($LASTEXITCODE -ne 0) { throw "Docker did not become ready in time." }
    Write-Host "  Docker is running." -ForegroundColor Green
}

# 3. Start minikube if not running
Write-Host "`n[2/7] Checking Minikube..." -ForegroundColor Yellow
$status = (minikube status | Out-String)
if ($status -match "host: Running") {
    Write-Host "  Minikube is running." -ForegroundColor Green
} else {
    Write-Host "  Starting Minikube..." -ForegroundColor Yellow
    minikube start --driver=docker
    if ($LASTEXITCODE -ne 0) { throw "minikube start failed." }
    Write-Host "  Minikube started." -ForegroundColor Green
}
# Ensure the ingress controller exists even if minikube was already running
minikube addons enable ingress | Out-Null

# 4. Point Docker to minikube's daemon
Write-Host "`n[3/7] Configuring Docker for Minikube..." -ForegroundColor Yellow
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Write-Host "  Docker now targets minikube's daemon." -ForegroundColor Green

# 5. Build the Docker image
Write-Host "`n[4/7] Building Docker image..." -ForegroundColor Yellow
docker build -t mealicious:local $ROOT_DIR
if ($LASTEXITCODE -ne 0) { throw "docker build failed." }
Write-Host "  Image built: mealicious:local" -ForegroundColor Green

# 6. Apply Kubernetes manifests
Write-Host "`n[5/7] Applying Kubernetes manifests..." -ForegroundColor Yellow
foreach ($m in @("namespace","configmap","secrets","postgres-db","app","ingress")) {
    kubectl apply -f "$SCRIPT_DIR\$m.yaml"
    if ($LASTEXITCODE -ne 0) { throw "kubectl apply failed for $m.yaml" }
}
Write-Host "  All manifests applied." -ForegroundColor Green

# The image tag is always "mealicious:local", so the Deployment spec does not
# change between builds and Kubernetes has no reason to restart the pod. Force
# a rollout, otherwise the freshly built image is never actually deployed.
Write-Host "  Rolling out freshly built image..." -ForegroundColor Yellow
kubectl rollout restart deployment/mealicious -n mealicious
if ($LASTEXITCODE -ne 0) { throw "kubectl rollout restart failed." }
kubectl rollout status deployment/mealicious -n mealicious --timeout=300s
if ($LASTEXITCODE -ne 0) { throw "Rollout did not complete." }

# 7. Wait for pods to be ready
Write-Host "`n[6/7] Waiting for pods to be ready..." -ForegroundColor Yellow
kubectl wait --namespace mealicious --for=condition=ready pod --selector=app=mealicious-db --timeout=180s
kubectl wait --namespace mealicious --for=condition=ready pod --selector=app=mealicious --timeout=300s
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Pods did not all become ready. Recent state:" -ForegroundColor Red
    kubectl get pods -n mealicious
} else {
    Write-Host "  All pods are ready!" -ForegroundColor Green
}

# 8. Show status and access info
Write-Host "`n[7/7] Deployment complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " All resources deployed!"                -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
kubectl get all -n mealicious
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
