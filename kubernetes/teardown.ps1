# teardown.ps1 - Remove Mealicious Kubernetes resources
$ErrorActionPreference = "SilentlyContinue"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Tearing down Mealicious Kubernetes resources..." -ForegroundColor Yellow
kubectl delete namespace mealicious --ignore-not-found
Write-Host "Done." -ForegroundColor Green
