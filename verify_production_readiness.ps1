Write-Host "=========================================="
Write-Host "   Verifying Production Readiness"
Write-Host "=========================================="

# 1. Backend Verification
Write-Host "1. Backend Tests..."
Set-Location "./backend"
mvn clean test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend Tests Failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend Tests Passed" -ForegroundColor Green
Set-Location ".."

# 2. Frontend Verification
Write-Host "2. Frontend Build..."
Set-Location "./frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend Build Failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend Build Success" -ForegroundColor Green
Set-Location ".."

# 3. Check for Hardcoded Localhost
Write-Host "3. Checking for Hardcoded 'localhost'..."
Get-ChildItem -Recurse -File -Exclude "node_modules",".git","target",".next","*.log" | Select-String "localhost"

Write-Host "⚠️  Please review the output above. Ensure 'localhost' remains only in dev configs."

Write-Host "=========================================="
Write-Host "   READY FOR DEPLOYMENT"
Write-Host "=========================================="
