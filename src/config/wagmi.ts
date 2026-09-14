import { cookieStorage, createStorage } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botchainTestnet } from './chains';
import { envConfig } from './env';

export const projectId = envConfig.projectId || 'b56e18d47c72ab683b10814fe9495694';

export const networks = [botchainTestnet] as const;

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks: [botchainTestnet] as any,
});

export const config = wagmiAdapter.wagmiConfig;
