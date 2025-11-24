# Secure Learn Key - Encrypted Learning Progress Tracker

A privacy-preserving learning progress tracking application built with FHEVM (Fully Homomorphic Encryption Virtual Machine) that allows students to securely record their study minutes and task completions on-chain. All data is encrypted, and only the student can decrypt and view their progress.

## 🎯 Features

- **🔒 Encrypted Study Minutes**: Record study time with complete privacy
- **✅ Encrypted Task Completion**: Track completed tasks privately
- **➕ FHE Accumulation**: Contract performs encrypted addition on-chain using Fully Homomorphic Encryption
- **🔐 Private Decryption**: Only the user can decrypt and view their totals
- **💼 Rainbow Wallet Integration**: Seamless wallet connection using RainbowKit
- **🌐 Multi-Network Support**: Works on local Hardhat network and Sepolia testnet

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm** or **yarn/pnpm**: Package manager
- **Rainbow Wallet**: Browser extension installed (for frontend)

### Installation

1. **Install root dependencies**

   ```bash
   npm install
   ```

2. **Install UI dependencies**

   ```bash
   cd ui
   npm install
   cd ..
   ```

3. **Set up environment variables**

   ```bash
   # Set up Hardhat environment variables
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

4. **Configure frontend environment**

   Create `ui/.env.local` file:

   ```env
   # Optional: Get a free Project ID from https://cloud.walletconnect.com/
   # For local development, you can leave this as is (RainbowKit will use defaults)
   VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID

   # Set this after deploying the contract
   VITE_CONTRACT_ADDRESS=
   ```

### Local Development

1. **Compile contracts**

   ```bash
   npm run compile
   npm run typechain
   ```

2. **Start Hardhat node with FHEVM support**

   ```bash
   # Terminal 1: Start a local FHEVM-ready node
   npx hardhat node
   ```

3. **Deploy the contract**

   ```bash
   # Terminal 2: Deploy to local network
   npx hardhat deploy --network localhost
   ```

   Copy the deployed contract address and update `ui/.env.local`:

   ```env
   VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

4. **Start the frontend**

   ```bash
   cd ui
   npm run dev
   ```

5. **Connect your wallet and test**

   - Install Rainbow wallet browser extension
   - Connect to Localhost network (Chain ID: 31337)
   - Start recording your learning progress!

## 📜 Available Scripts

| Script             | Description                    |
| ------------------ | ------------------------------ |
| `npm run compile`  | Compile all contracts          |
| `npm run test`     | Run all tests (local network)  |
| `npm run test:sepolia` | Run tests on Sepolia testnet |
| `npm run coverage` | Generate coverage report       |
| `npm run lint`     | Run linting checks             |
| `npm run clean`    | Clean build artifacts          |

## 📁 Project Structure

```
secure-learn-key/
├── contracts/                           # Smart contract source files
│   └── EncryptedLearningProgress.sol  # Main learning progress contract
├── deploy/                              # Deployment scripts
│   └── 001_deploy_EncryptedLearningProgress.ts
├── test/                                # Test files
│   ├── EncryptedLearningProgress.ts   # Local network tests
│   └── EncryptedLearningProgressSepolia.ts # Sepolia testnet tests
├── ui/                                  # Frontend React application
│   ├── src/
│   │   ├── components/                 # React components
│   │   ├── hooks/                      # Custom React hooks
│   │   │   └── useLearningProgress.tsx # Main contract interaction hook
│   │   ├── fhevm/                      # FHEVM integration
│   │   ├── lib/                        # Utility functions
│   │   └── pages/                     # Page components
│   └── package.json
├── hardhat.config.ts                   # Hardhat configuration
└── package.json                        # Root dependencies
```

## 🔐 Smart Contract

### EncryptedLearningProgress Contract

The core contract that stores encrypted learning progress on-chain.

**Location**: `contracts/EncryptedLearningProgress.sol`

#### Key Functions

- **`addStudyMinutes(externalEuint32 encryptedMinutes, bytes calldata inputProof)`**
  - Adds study minutes to user's encrypted total
  - Accepts encrypted minutes and input proof
  - Performs encrypted addition on-chain
  - Grants decryption permissions to the user

- **`completeTask(externalEuint32 encryptedTaskCount, bytes calldata inputProof)`**
  - Increments task completion count by 1
  - Accepts encrypted task count (typically 1) and input proof
  - Performs encrypted addition on-chain
  - Grants decryption permissions to the user

- **`getEncryptedStudyMinutes(address user)`**
  - Returns the encrypted study minutes for a user
  - View function, can be called by anyone
  - Returns encrypted handle that only the user can decrypt

- **`getEncryptedTaskCount(address user)`**
  - Returns the encrypted task count for a user
  - View function, can be called by anyone
  - Returns encrypted handle that only the user can decrypt

- **`hasInitialized(address user)`**
  - Checks if a user has recorded any progress
  - Returns boolean indicating initialization status

## 🔒 Encryption & Decryption Logic

### Encryption Flow

1. **Client-Side Encryption**:
   ```typescript
   // Create encrypted input using FHEVM instance
   const encryptedInput = fhevmInstance.createEncryptedInput(
     contractAddress,
     userAddress
   );
   
   // Add the plaintext value (study minutes or task count)
   encryptedInput.add32(value);
   
   // Encrypt and get handle + proof
   const encrypted = await encryptedInput.encrypt();
   // Returns: { handles: string[], inputProof: string }
   ```

2. **On-Chain Submission**:
   ```typescript
   // Submit encrypted handle and proof to contract
   const tx = await contract.addStudyMinutes(
     encrypted.handles[0],      // Encrypted handle
     encrypted.inputProof       // Cryptographic proof
   );
   ```

3. **Contract Processing**:
   - Contract verifies the input proof
   - Converts external encrypted value to internal `euint32`
   - Performs encrypted addition: `FHE.add(existingTotal, newValue)`
   - Grants decryption permissions: `FHE.allow(encryptedValue, user)`

### Decryption Flow

1. **Get Encrypted Handle**:
   ```typescript
   // Fetch latest encrypted value from contract
   const encryptedValue = await contract.getEncryptedStudyMinutes(userAddress);
   const handle = ethers.hexlify(encryptedValue);
   ```

2. **Generate Decryption Keypair**:
   ```typescript
   // Generate keypair for EIP712 signature
   const keypair = fhevmInstance.generateKeypair();
   ```

3. **Create EIP712 Signature**:
   ```typescript
   // Create EIP712 typed data for decryption request
   const eip712 = fhevmInstance.createEIP712(
     keypair.publicKey,
     [contractAddress],
     startTimestamp,
     durationDays
   );
   
   // Sign with user's wallet
   const signature = await signer.signTypedData(
     eip712.domain,
     { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
     eip712.message
   );
   ```

4. **Decrypt**:
   ```typescript
   // For local network, remove "0x" prefix from signature
   const signatureForDecrypt = chainId === 31337 
     ? signature.replace("0x", "") 
     : signature;
   
   // Decrypt using FHEVM instance
   const decryptedResult = await fhevmInstance.userDecrypt(
     [{ handle, contractAddress }],
     keypair.privateKey,
     keypair.publicKey,
     signatureForDecrypt,
     [contractAddress],
     userAddress,
     startTimestamp,
     durationDays
   );
   
   // Extract decrypted value
   const decryptedValue = Number(decryptedResult[handle] || 0);
   ```

## 🧪 Testing

### Local Network Testing

```bash
# Start local Hardhat node with FHEVM support
npx hardhat node

# In another terminal, run tests
npm run test
```

Tests verify:
- Initialization state
- Encrypted addition for study minutes
- Encrypted addition for task count
- Accumulation of multiple additions
- User isolation (separate progress per user)
- Decryption functionality

### Sepolia Testnet Testing

```bash
# Deploy contract first
npx hardhat deploy --network sepolia

# Update VITE_CONTRACT_ADDRESS in ui/.env.local with Sepolia address

# Then run Sepolia-specific tests
npm run test:sepolia
```

## 🚢 Deployment

### Deploy to Local Network

```bash
# Start a local FHEVM-ready node
npx hardhat node

# Deploy to local network
npx hardhat deploy --network localhost
```

### Deploy to Sepolia Testnet

```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## 🔧 Technical Stack

### Frontend
- **React** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn-ui** - UI components
- **RainbowKit** - Wallet connection
- **wagmi** - Ethereum React Hooks
- **FHEVM Relayer SDK** - FHE encryption/decryption

### Smart Contracts
- **Solidity** ^0.8.24
- **FHEVM** - Fully Homomorphic Encryption
- **Hardhat** - Development environment

## ⚠️ Troubleshooting

### WalletConnect 403/400 Errors

If you see errors in the console about WalletConnect configuration:

1. **For local development**: These errors can be ignored. RainbowKit will use local defaults and the app will work fine with Rainbow wallet extension.

2. **For production**: Get a free Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/):
   - Create an account
   - Create a new project
   - Copy the Project ID
   - Add it to `ui/.env.local`: `VITE_WALLETCONNECT_PROJECT_ID=your_project_id`
   - Restart the dev server

### Contract Not Deployed

If you see "Contract not deployed" errors:

1. Make sure Hardhat node is running: `npx hardhat node`
2. Deploy the contract: `npx hardhat deploy --network localhost`
3. Copy the contract address to `ui/.env.local`
4. Restart the frontend dev server

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **FHEVM Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

---

**Built with ❤️ using FHEVM by Zama**
