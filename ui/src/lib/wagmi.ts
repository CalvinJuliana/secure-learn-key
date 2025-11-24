import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// Localhost chain for development
const localhost = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
  },
});

// Get WalletConnect Project ID from environment variable
// For local development with Rainbow wallet extension, you can use a placeholder
// For production, get a free Project ID from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Note: If you see 403/400 errors in console about WalletConnect config, it's because:
// 1. The Project ID is a placeholder, OR
// 2. The Project ID is invalid
// This won't break the app (RainbowKit will use local defaults), but for production:
// 1. Get a free Project ID from https://cloud.walletconnect.com/
// 2. Create ui/.env.local with: VITE_WALLETCONNECT_PROJECT_ID=your_project_id
// 3. Restart the dev server

export const config = getDefaultConfig({
  appName: 'Secure Learn Key',
  projectId: projectId,
  chains: [localhost, sepolia, mainnet, polygon, optimism, arbitrum, base],
  ssr: false,
});
