# Deployment Guide

## Quick Start - Deploy to Localhost

### Step 1: Start Hardhat Node

Open a terminal and run:

```bash
cd secure-learn-key
npx hardhat node
```

Keep this terminal running. You should see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### Step 2: Deploy Contract

Open a **new terminal** and run:

```bash
cd secure-learn-key
npx hardhat deploy --network localhost
```

You should see output like:
```
deploying "EncryptedLearningProgress" (tx: 0x...) ... deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 3: Configure Frontend

1. Copy the contract address from the deployment output (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`)

2. Create `ui/.env.local` file:

```env
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID
```

3. Restart your frontend dev server if it's running:

```bash
cd ui
npm run dev
```

### Step 4: Connect Wallet and Test

1. Open the app in your browser (usually http://localhost:5173)
2. Click the "Connect Wallet" button in the top right
3. Select Rainbow wallet and connect to Localhost network (Chain ID: 31337)
4. Start adding study minutes and completing tasks!

## Troubleshooting

### "Cannot connect to the network localhost"

**Solution**: Make sure Hardhat node is running in a separate terminal:
```bash
npx hardhat node
```

### "Contract address not configured"

**Solution**: 
1. Deploy the contract first (see Step 2)
2. Copy the contract address
3. Add it to `ui/.env.local`
4. Restart the dev server

### Contract address not found after deployment

The contract address is printed in the deployment output. You can also find it in:
- `deployments/localhost/EncryptedLearningProgress.json` (after deployment)

## Deploy to Sepolia Testnet

1. Set up environment variables:
```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
```

2. Deploy:
```bash
npx hardhat deploy --network sepolia
```

3. Update `ui/.env.local` with the Sepolia contract address

4. Verify on Etherscan:
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

