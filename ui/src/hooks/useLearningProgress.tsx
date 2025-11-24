import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "./useInMemoryStorage";

// Contract ABI
const EncryptedLearningProgressABI = [
  "function addStudyMinutes(bytes32 encryptedMinutes, bytes calldata inputProof) external",
  "function completeTask(bytes32 encryptedTaskCount, bytes calldata inputProof) external",
  "function getEncryptedStudyMinutes(address user) external view returns (bytes32)",
  "function getEncryptedTaskCount(address user) external view returns (bytes32)",
  "function hasInitialized(address user) external view returns (bool)",
  "event StudyMinutesAdded(address indexed user, uint256 timestamp)",
  "event TaskCompleted(address indexed user, uint256 timestamp)",
];

interface UseLearningProgressState {
  contractAddress: string | undefined;
  encryptedStudyMinutes: string | undefined;
  encryptedTaskCount: string | undefined;
  decryptedStudyMinutes: number | undefined;
  decryptedTaskCount: number | undefined;
  isLoading: boolean;
  message: string | undefined;
  addStudyMinutes: (minutes: number) => Promise<void>;
  completeTask: () => Promise<void>;
  decryptStudyMinutes: () => Promise<void>;
  decryptTaskCount: () => Promise<void>;
  loadEncryptedData: () => Promise<void>;
}

export function useLearningProgress(contractAddress: string | undefined): UseLearningProgressState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  const [encryptedStudyMinutes, setEncryptedStudyMinutes] = useState<string | undefined>(undefined);
  const [encryptedTaskCount, setEncryptedTaskCount] = useState<string | undefined>(undefined);
  const [decryptedStudyMinutes, setDecryptedStudyMinutes] = useState<number | undefined>(undefined);
  const [decryptedTaskCount, setDecryptedTaskCount] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersProvider, setEthersProvider] = useState<ethers.JsonRpcProvider | undefined>(undefined);

  // Get EIP1193 provider
  const eip1193Provider = useCallback(() => {
    if (chainId === 31337) {
      return "http://localhost:8545";
    }
    if (walletClient?.transport) {
      const transport = walletClient.transport as any;
      if (transport.value && typeof transport.value.request === "function") {
        return transport.value;
      }
      if (typeof transport.request === "function") {
        return transport;
      }
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return undefined;
  }, [chainId, walletClient]);

  // Initialize FHEVM
  const { instance: fhevmInstance, status: fhevmStatus, error: fhevmError } = useFhevm({
    provider: eip1193Provider(),
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected && !!contractAddress,
  });

  // Update message when FHEVM status changes
  useEffect(() => {
    if (fhevmStatus === "loading" && isConnected && contractAddress) {
      setMessage("Initializing FHEVM...");
    } else if (fhevmStatus === "ready") {
      // Clear initialization message when ready
      setMessage((prev) => {
        if (prev && prev.includes("Initializing")) {
          return undefined;
        }
        return prev;
      });
    } else if (fhevmStatus === "error" && fhevmError) {
      setMessage(`FHEVM Error: ${fhevmError.message}. Please check your network connection.`);
    }
  }, [fhevmStatus, fhevmError, isConnected, contractAddress]);

  // Convert walletClient to ethers signer
  useEffect(() => {
    if (!walletClient || !chainId) {
      setEthersSigner(undefined);
      setEthersProvider(undefined);
      return;
    }

    const setupEthers = async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        setEthersProvider(provider as any);
        setEthersSigner(signer);
      } catch (error) {
        console.error("Error setting up ethers:", error);
        setEthersSigner(undefined);
        setEthersProvider(undefined);
      }
    };

    setupEthers();
  }, [walletClient, chainId]);

  const addStudyMinutes = useCallback(
    async (minutes: number) => {
      // Detailed error checking
      if (!contractAddress) {
        const error = new Error("Contract address not configured. Please set VITE_CONTRACT_ADDRESS in ui/.env.local");
        setMessage(error.message);
        throw error;
      }
      if (!address) {
        const error = new Error("Wallet not connected. Please connect your Rainbow wallet.");
        setMessage(error.message);
        throw error;
      }
      if (!ethersSigner) {
        const error = new Error("Wallet signer not available. Please ensure your wallet is connected.");
        setMessage(error.message);
        throw error;
      }
      if (!fhevmInstance) {
        const error = new Error("FHEVM instance not initialized. Please wait for initialization or check your network connection.");
        setMessage(error.message);
        throw error;
      }
      if (!ethersProvider) {
        const error = new Error("Ethers provider not available.");
        setMessage(error.message);
        throw error;
      }

      if (minutes < 1) {
        const error = new Error("Study minutes must be at least 1");
        setMessage(error.message);
        throw error;
      }

      try {
        setIsLoading(true);
        setMessage("Encrypting study minutes...");

        // Encrypt minutes using FHEVM
        const encryptedInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedInput.add32(minutes);
        const encrypted = await encryptedInput.encrypt();

        setMessage("Submitting to blockchain...");

        // Verify contract is deployed
        const contractCode = await ethersProvider.getCode(contractAddress);
        if (contractCode === "0x" || contractCode.length <= 2) {
          throw new Error(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        }

        const contract = new ethers.Contract(contractAddress, EncryptedLearningProgressABI, ethersSigner);

        const tx = await contract.addStudyMinutes(
          encrypted.handles[0],
          encrypted.inputProof,
          {
            gasLimit: 5000000,
          }
        );
        await tx.wait();

        setMessage("Study minutes added successfully. Refreshing...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reload encrypted data
        await loadEncryptedData();
        setMessage("Study minutes added successfully!");
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        console.error("[useLearningProgress] Error adding study minutes:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const completeTask = useCallback(
    async () => {
      // Detailed error checking
      if (!contractAddress) {
        const error = new Error("Contract address not configured. Please set VITE_CONTRACT_ADDRESS in ui/.env.local");
        setMessage(error.message);
        throw error;
      }
      if (!address) {
        const error = new Error("Wallet not connected. Please connect your Rainbow wallet.");
        setMessage(error.message);
        throw error;
      }
      if (!ethersSigner) {
        const error = new Error("Wallet signer not available. Please ensure your wallet is connected.");
        setMessage(error.message);
        throw error;
      }
      if (!fhevmInstance) {
        const error = new Error("FHEVM instance not initialized. Please wait for initialization or check your network connection.");
        setMessage(error.message);
        throw error;
      }
      if (!ethersProvider) {
        const error = new Error("Ethers provider not available.");
        setMessage(error.message);
        throw error;
      }

      try {
        setIsLoading(true);
        setMessage("Encrypting task completion...");

        // Encrypt task count (1) using FHEVM
        const encryptedInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedInput.add32(1);
        const encrypted = await encryptedInput.encrypt();

        setMessage("Submitting to blockchain...");

        const contract = new ethers.Contract(contractAddress, EncryptedLearningProgressABI, ethersSigner);

        const tx = await contract.completeTask(
          encrypted.handles[0],
          encrypted.inputProof,
          {
            gasLimit: 5000000,
          }
        );
        await tx.wait();

        setMessage("Task completed successfully. Refreshing...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reload encrypted data
        await loadEncryptedData();
        setMessage("Task completed successfully!");
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        console.error("[useLearningProgress] Error completing task:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const decryptStudyMinutes = useCallback(
    async () => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        setMessage("Missing requirements for decryption");
        return;
      }

      try {
        setMessage("Fetching encrypted study minutes...");

        const contract = new ethers.Contract(contractAddress, EncryptedLearningProgressABI, ethersProvider);
        const hasInit = await contract.hasInitialized(address);
        
        if (!hasInit) {
          throw new Error("You haven't added any study minutes yet.");
        }

        const latestEncrypted = await contract.getEncryptedStudyMinutes(address);
        let handle = typeof latestEncrypted === "string" ? latestEncrypted : ethers.hexlify(latestEncrypted);
        handle = handle.toLowerCase();

        if (!handle || handle === "0x" || handle.length !== 66) {
          throw new Error(`Invalid handle format: ${handle}`);
        }

        setEncryptedStudyMinutes(handle);
        setMessage("Decrypting study minutes...");

        // Generate keypair for EIP712 signature
        let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
        if (typeof (fhevmInstance as any).generateKeypair === "function") {
          keypair = (fhevmInstance as any).generateKeypair();
        } else {
          keypair = {
            publicKey: new Uint8Array(32).fill(0),
            privateKey: new Uint8Array(32).fill(0),
          };
        }

        // Create EIP712 signature
        const contractAddresses = [contractAddress as `0x${string}`];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";

        let eip712: any;
        if (typeof (fhevmInstance as any).createEIP712 === "function") {
          eip712 = (fhevmInstance as any).createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimestamp,
            durationDays
          );
        } else {
          eip712 = {
            domain: {
              name: "FHEVM",
              version: "1",
              chainId: chainId,
              verifyingContract: contractAddresses[0],
            },
            types: {
              UserDecryptRequestVerification: [
                { name: "publicKey", type: "bytes" },
                { name: "contractAddresses", type: "address[]" },
                { name: "startTimestamp", type: "string" },
                { name: "durationDays", type: "string" },
              ],
            },
            message: {
              publicKey: ethers.hexlify(keypair.publicKey),
              contractAddresses,
              startTimestamp,
              durationDays,
            },
          };
        }

        const signature = await ethersSigner.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        const signatureForDecrypt = chainId === 31337 
          ? signature.replace("0x", "") 
          : signature;

        const decryptedResult = await (fhevmInstance as any).userDecrypt(
          [{ handle, contractAddress: contractAddress as `0x${string}` }],
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        const decrypted = Number(decryptedResult[handle] || 0);
        setDecryptedStudyMinutes(decrypted);
        setMessage(`Decrypted study minutes: ${decrypted} minutes`);
      } catch (error: any) {
        console.error("[useLearningProgress] Error decrypting study minutes:", error);
        setMessage(`Error decrypting: ${error.message || String(error)}`);
        throw error;
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId]
  );

  const decryptTaskCount = useCallback(
    async () => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        setMessage("Missing requirements for decryption");
        return;
      }

      try {
        setMessage("Fetching encrypted task count...");

        const contract = new ethers.Contract(contractAddress, EncryptedLearningProgressABI, ethersProvider);
        const hasInit = await contract.hasInitialized(address);
        
        if (!hasInit) {
          throw new Error("You haven't completed any tasks yet.");
        }

        const latestEncrypted = await contract.getEncryptedTaskCount(address);
        let handle = typeof latestEncrypted === "string" ? latestEncrypted : ethers.hexlify(latestEncrypted);
        handle = handle.toLowerCase();

        if (!handle || handle === "0x" || handle.length !== 66) {
          throw new Error(`Invalid handle format: ${handle}`);
        }

        setEncryptedTaskCount(handle);
        setMessage("Decrypting task count...");

        // Generate keypair for EIP712 signature
        let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
        if (typeof (fhevmInstance as any).generateKeypair === "function") {
          keypair = (fhevmInstance as any).generateKeypair();
        } else {
          keypair = {
            publicKey: new Uint8Array(32).fill(0),
            privateKey: new Uint8Array(32).fill(0),
          };
        }

        // Create EIP712 signature
        const contractAddresses = [contractAddress as `0x${string}`];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";

        let eip712: any;
        if (typeof (fhevmInstance as any).createEIP712 === "function") {
          eip712 = (fhevmInstance as any).createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimestamp,
            durationDays
          );
        } else {
          eip712 = {
            domain: {
              name: "FHEVM",
              version: "1",
              chainId: chainId,
              verifyingContract: contractAddresses[0],
            },
            types: {
              UserDecryptRequestVerification: [
                { name: "publicKey", type: "bytes" },
                { name: "contractAddresses", type: "address[]" },
                { name: "startTimestamp", type: "string" },
                { name: "durationDays", type: "string" },
              ],
            },
            message: {
              publicKey: ethers.hexlify(keypair.publicKey),
              contractAddresses,
              startTimestamp,
              durationDays,
            },
          };
        }

        const signature = await ethersSigner.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        const signatureForDecrypt = chainId === 31337 
          ? signature.replace("0x", "") 
          : signature;

        const decryptedResult = await (fhevmInstance as any).userDecrypt(
          [{ handle, contractAddress: contractAddress as `0x${string}` }],
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        const decrypted = Number(decryptedResult[handle] || 0);
        setDecryptedTaskCount(decrypted);
        setMessage(`Decrypted task count: ${decrypted} tasks`);
      } catch (error: any) {
        console.error("[useLearningProgress] Error decrypting task count:", error);
        setMessage(`Error decrypting: ${error.message || String(error)}`);
        throw error;
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId]
  );

  const loadEncryptedData = useCallback(async () => {
    if (!contractAddress || !ethersProvider || !address) {
      return;
    }

    try {
      setIsLoading(true);

      const contractCode = await ethersProvider.getCode(contractAddress);
      if (contractCode === "0x" || contractCode.length <= 2) {
        setMessage(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        return;
      }

      const contract = new ethers.Contract(contractAddress, EncryptedLearningProgressABI, ethersProvider);
      const hasInit = await contract.hasInitialized(address);
      
      if (!hasInit) {
        setEncryptedStudyMinutes(undefined);
        setEncryptedTaskCount(undefined);
        return;
      }

      const encryptedMinutes = await contract.getEncryptedStudyMinutes(address);
      const encryptedTasks = await contract.getEncryptedTaskCount(address);
      setEncryptedStudyMinutes(encryptedMinutes);
      setEncryptedTaskCount(encryptedTasks);
    } catch (error: any) {
      console.error("[useLearningProgress] Error loading encrypted data:", error);
      setMessage(`Error loading data: ${error.message || String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, ethersProvider, address]);

  useEffect(() => {
    if (contractAddress && ethersProvider && address) {
      loadEncryptedData();
    }
  }, [contractAddress, ethersProvider, address, loadEncryptedData]);

  return {
    contractAddress,
    encryptedStudyMinutes,
    encryptedTaskCount,
    decryptedStudyMinutes,
    decryptedTaskCount,
    isLoading,
    message,
    addStudyMinutes,
    completeTask,
    decryptStudyMinutes,
    decryptTaskCount,
    loadEncryptedData,
  };
}

