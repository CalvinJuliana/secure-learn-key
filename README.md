# Secure Learn Key - Encrypted Learning Progress Tracker

A privacy-preserving learning progress tracking application built with FHEVM (Fully Homomorphic Encryption Virtual Machine) that allows students to securely record their study minutes and task completions on-chain. All data is encrypted, and only the student can decrypt and view their progress.

## 🌐 Live Demo

- **Live Demo**: [https://secure-learn-key.vercel.app/](https://secure-learn-key.vercel.app/)
- **Demo Video**: [https://github.com/CalvinJuliana/secure-learn-key/blob/main/secure-learn-key.mp4](https://github.com/CalvinJuliana/secure-learn-key/blob/main/secure-learn-key.mp4)

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

#### Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedLearningProgress is SepoliaConfig {
    // Mapping from user address to their encrypted total study minutes
    mapping(address => euint32) private _encryptedStudyMinutes;
    
    // Mapping from user address to their encrypted task completion count
    mapping(address => euint32) private _encryptedTaskCount;
    
    // Mapping to track if user has initialized their progress
    mapping(address => bool) private _hasInitialized;

    event StudyMinutesAdded(address indexed user, uint256 timestamp);
    event TaskCompleted(address indexed user, uint256 timestamp);

    /// @notice Add study minutes to user's encrypted total
    /// @param encryptedMinutes The encrypted number of study minutes to add
    /// @param inputProof The FHE input proof
    function addStudyMinutes(externalEuint32 encryptedMinutes, bytes calldata inputProof) external {
        euint32 encryptedMinutesValue = FHE.fromExternal(encryptedMinutes, inputProof);
        
        // Initialize if first time
        if (!_hasInitialized[msg.sender]) {
            _encryptedStudyMinutes[msg.sender] = encryptedMinutesValue;
            _hasInitialized[msg.sender] = true;
        } else {
            // Add to existing total using FHE addition
            _encryptedStudyMinutes[msg.sender] = FHE.add(
                _encryptedStudyMinutes[msg.sender],
                encryptedMinutesValue
            );
        }

        // Grant decryption permissions to the user
        FHE.allowThis(_encryptedStudyMinutes[msg.sender]);
        FHE.allow(_encryptedStudyMinutes[msg.sender], msg.sender);

        emit StudyMinutesAdded(msg.sender, block.timestamp);
    }

    /// @notice Complete a task (increment task count by 1)
    /// @param encryptedTaskCount The encrypted task count to add (typically 1)
    /// @param inputProof The FHE input proof
    function completeTask(externalEuint32 encryptedTaskCount, bytes calldata inputProof) external {
        euint32 taskCount = FHE.fromExternal(encryptedTaskCount, inputProof);
        
        // Initialize if first time
        if (!_hasInitialized[msg.sender]) {
            _encryptedTaskCount[msg.sender] = taskCount;
            _hasInitialized[msg.sender] = true;
        } else {
            // Add to existing count using FHE addition
            _encryptedTaskCount[msg.sender] = FHE.add(
                _encryptedTaskCount[msg.sender],
                taskCount
            );
        }

        // Grant decryption permissions to the user
        FHE.allowThis(_encryptedTaskCount[msg.sender]);
        FHE.allow(_encryptedTaskCount[msg.sender], msg.sender);

        emit TaskCompleted(msg.sender, block.timestamp);
    }

    /// @notice Get the encrypted study minutes for a user
    /// @param user The user address
    /// @return encryptedMinutes The encrypted study minutes
    function getEncryptedStudyMinutes(address user) external view returns (euint32 encryptedMinutes) {
        return _encryptedStudyMinutes[user];
    }

    /// @notice Get the encrypted task count for a user
    /// @param user The user address
    /// @return encryptedTaskCount The encrypted task completion count
    function getEncryptedTaskCount(address user) external view returns (euint32 encryptedTaskCount) {
        return _encryptedTaskCount[user];
    }

    /// @notice Check if a user has initialized their progress
    /// @param user The user address
    /// @return Whether the user has initialized
    function hasInitialized(address user) external view returns (bool) {
        return _hasInitialized[user];
    }
}
```

#### Key Functions

- **`addStudyMinutes(externalEuint32 encryptedMinutes, bytes calldata inputProof)`**
  - Adds study minutes to user's encrypted total
  - Accepts encrypted minutes and input proof
  - Performs encrypted addition on-chain using `FHE.add()`
  - Grants decryption permissions to the user
  - Emits `StudyMinutesAdded` event

- **`completeTask(externalEuint32 encryptedTaskCount, bytes calldata inputProof)`**
  - Increments task completion count by 1
  - Accepts encrypted task count (typically 1) and input proof
  - Performs encrypted addition on-chain using `FHE.add()`
  - Grants decryption permissions to the user
  - Emits `TaskCompleted` event

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

#### 1. Client-Side Encryption

The frontend encrypts plaintext values (study minutes or task count) before sending to the contract:

```typescript
// Create encrypted input using FHEVM instance
const encryptedInput = fhevmInstance.createEncryptedInput(
  contractAddress as `0x${string}`,
  userAddress as `0x${string}`
);

// Add the plaintext value (study minutes or task count)
encryptedInput.add32(minutes); // or taskCount

// Encrypt and get handle + proof
const encrypted = await encryptedInput.encrypt();
// Returns: { handles: string[], inputProof: string }
```

**Key Points:**
- `createEncryptedInput()` creates an encryption session for a specific contract and user
- `add32()` adds a 32-bit unsigned integer value to the encryption session
- `encrypt()` generates the encrypted handle and cryptographic proof
- The `inputProof` is used by the contract to verify the encrypted input

#### 2. On-Chain Submission

The encrypted handle and proof are submitted to the contract:

```typescript
// Submit encrypted handle and proof to contract
const tx = await contract.addStudyMinutes(
  encrypted.handles[0],      // Encrypted handle (bytes32)
  encrypted.inputProof       // Cryptographic proof (bytes)
);
await tx.wait();
```

**Key Points:**
- The handle is a 66-character hex string (0x + 64 hex characters)
- The input proof verifies that the encrypted value was created correctly
- The transaction is sent to the blockchain and waits for confirmation

#### 3. Contract Processing

The contract processes the encrypted input:

```solidity
// Contract verifies the input proof and converts to internal format
euint32 encryptedMinutesValue = FHE.fromExternal(encryptedMinutes, inputProof);

// Initialize or accumulate
if (!_hasInitialized[msg.sender]) {
    _encryptedStudyMinutes[msg.sender] = encryptedMinutesValue;
    _hasInitialized[msg.sender] = true;
} else {
    // Perform encrypted addition on-chain
    _encryptedStudyMinutes[msg.sender] = FHE.add(
        _encryptedStudyMinutes[msg.sender],
        encryptedMinutesValue
    );
}

// Grant decryption permissions
FHE.allowThis(_encryptedStudyMinutes[msg.sender]);
FHE.allow(_encryptedStudyMinutes[msg.sender], msg.sender);
```

**Key Points:**
- `FHE.fromExternal()` verifies the input proof and converts external format to internal `euint32`
- `FHE.add()` performs encrypted addition without decrypting the values
- `FHE.allow()` grants decryption permissions to the contract and user
- The encrypted total is stored on-chain in encrypted form

### Decryption Flow

#### 1. Get Encrypted Handle

Fetch the latest encrypted value from the contract:

```typescript
// Fetch latest encrypted value from contract
const encryptedValue = await contract.getEncryptedStudyMinutes(userAddress);
const handle = typeof encryptedValue === "string" 
  ? encryptedValue 
  : ethers.hexlify(encryptedValue);
const normalizedHandle = handle.toLowerCase();
```

**Key Points:**
- The handle is returned as a `bytes32` value
- It must be normalized to lowercase for decryption
- The handle format is 66 characters (0x + 64 hex characters)

#### 2. Generate Decryption Keypair

Generate a keypair for EIP712 signature:

```typescript
// Generate keypair for EIP712 signature
const keypair = fhevmInstance.generateKeypair();
// Returns: { publicKey: Uint8Array, privateKey: Uint8Array }
```

**Key Points:**
- The keypair is used for cryptographic authentication
- The public key is included in the EIP712 signature
- The private key is used for decryption

#### 3. Create EIP712 Signature

Create and sign an EIP712 typed data message:

```typescript
// Create EIP712 typed data for decryption request
const contractAddresses = [contractAddress as `0x${string}`];
const startTimestamp = Math.floor(Date.now() / 1000).toString();
const durationDays = "10";

const eip712 = fhevmInstance.createEIP712(
  keypair.publicKey,
  contractAddresses,
  startTimestamp,
  durationDays
);

// Sign with user's wallet
const signature = await ethersSigner.signTypedData(
  eip712.domain,
  { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
  eip712.message
);
```

**Key Points:**
- EIP712 provides structured data signing for better security
- The signature authorizes the decryption request
- `startTimestamp` and `durationDays` define the validity period
- The signature must be created by the wallet owner

#### 4. Decrypt

Decrypt the encrypted handle:

```typescript
// For local network, remove "0x" prefix from signature
const signatureForDecrypt = chainId === 31337 
  ? signature.replace("0x", "") 
  : signature;

// Decrypt using FHEVM instance
const decryptedResult = await fhevmInstance.userDecrypt(
  [{ handle: normalizedHandle, contractAddress }],
  keypair.privateKey,
  keypair.publicKey,
  signatureForDecrypt,
  contractAddresses,
  userAddress as `0x${string}`,
  startTimestamp,
  durationDays
);

// Extract decrypted value
const decryptedValue = Number(decryptedResult[normalizedHandle] || 0);
```

**Key Points:**
- Local network (31337) requires signature without "0x" prefix
- Sepolia testnet requires signature with "0x" prefix
- `userDecrypt()` returns a map of handle to decrypted value
- The decrypted value is a number representing the total

### Key Encryption/Decryption Details

#### Encryption Types

- **`euint32`**: Encrypted 32-bit unsigned integer (internal contract format)
- **`externalEuint32`**: External format for passing encrypted values as function parameters
- **Handle Format**: 66 characters (0x + 64 hex characters)

#### FHE Operations

- **`FHE.fromExternal()`**: Converts external encrypted value to internal format and verifies proof
- **`FHE.add()`**: Performs encrypted addition on-chain without decrypting
- **`FHE.allow()`**: Grants decryption permissions to specific addresses
- **`FHE.allowThis()`**: Grants decryption permission to the contract itself

#### Permission Model

- Only the contract and the user can decrypt encrypted values
- Permissions are set automatically when data is added
- Each encrypted value has its own permission set
- Permissions persist across transactions

#### Network-Specific Behavior

- **Localhost (31337)**: Uses `@fhevm/mock-utils` for local testing
  - Signature format: Remove "0x" prefix
  - No relayer required
  - Faster for development
- **Sepolia (11155111)**: Uses `@zama-fhe/relayer-sdk` with Zama's FHE relayer
  - Signature format: Keep "0x" prefix
  - Requires relayer for decryption
  - Production-ready

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
- **RainbowKit** - Wallet connection (with English locale)
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

### FHEVM Not Initialized

If you see "FHEVM instance not initialized" errors:

1. Check your network connection
2. Ensure you're connected to the correct network (localhost or Sepolia)
3. Wait a few seconds for FHEVM to initialize
4. Refresh the page if the issue persists

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **FHEVM Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

---

**Built with ❤️ using FHEVM by Zama**
