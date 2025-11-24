# PowerShell script to deploy contract to localhost
# Make sure Hardhat node is running first: npx hardhat node

Write-Host "Deploying EncryptedLearningProgress contract to localhost..." -ForegroundColor Cyan

# Deploy the contract
npx hardhat deploy --network localhost

# Get the deployment address from deployments folder
$deploymentFile = Get-Content "deployments\localhost\EncryptedLearningProgress.json" | ConvertFrom-Json
$contractAddress = $deploymentFile.address

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Contract deployed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Contract Address: $contractAddress" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create ui/.env.local file (if it doesn't exist)" -ForegroundColor White
Write-Host "2. Add the following line:" -ForegroundColor White
Write-Host "   VITE_CONTRACT_ADDRESS=$contractAddress" -ForegroundColor Yellow
Write-Host "3. Restart your frontend dev server" -ForegroundColor White
Write-Host ""

