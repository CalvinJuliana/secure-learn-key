import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Encrypted Study Resources',
  projectId: '8b2f7ae10794470688877e39b7fcb0007',
  chains: [mainnet, polygon, optimism, arbitrum],
  ssr: false,
});
