# Verification script for Secure Learn Key setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Secure Learn Key - Setup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "contracts\EncryptedLearningProgress.sol")) {
    Write-Host "ERROR: Please run this script from the secure-learn-key directory" -ForegroundColor Red
    exit 1
}

Write-Host "1. Checking contract file..." -ForegroundColor Yellow
$contractContent = Get-Content "contracts\EncryptedLearningProgress.sol" -Raw
if ($contractContent -match "euint32 minutes\s*=") {
    Write-Host "   ERROR: Found 'minutes' keyword - this is a reserved word!" -ForegroundColor Red
    Write-Host "   The file should use 'encryptedMinutesValue' instead" -ForegroundColor Red
    exit 1
} else {
    Write-Host "   ✓ Contract file looks good" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Compiling contracts..." -ForegroundColor Yellow
$compileResult = npx hardhat compile 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Compilation successful" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Compilation failed" -ForegroundColor Red
    Write-Host $compileResult
    exit 1
}

Write-Host ""
Write-Host "3. Checking if Hardhat node is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' -ContentType "application/json" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✓ Hardhat node is running on port 8545" -ForegroundColor Green
    $nodeRunning = $true
} catch {
    Write-Host "   ⚠ Hardhat node is NOT running" -ForegroundColor Yellow
    Write-Host "   You need to start it with: npx hardhat node" -ForegroundColor Yellow
    $nodeRunning = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($nodeRunning) {
    Write-Host "Setup looks good! You can now deploy:" -ForegroundColor Green
    Write-Host "  npx hardhat deploy --network localhost" -ForegroundColor White
} else {
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Start Hardhat node: npx hardhat node" -ForegroundColor White
    Write-Host "  2. In another terminal, deploy: npx hardhat deploy --network localhost" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Cyan

