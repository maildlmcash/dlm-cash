import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// WalletConnect project ID
const projectId = '8aae32d6a17b641c00e66f5de6aeccf7';

export const config = getDefaultConfig({
  appName: 'DLM Crypto',
  projectId,
  chains: [sepolia],
  ssr: false,
});
