import { defineChain } from 'viem';
import { envConfig } from './env';

export const botchainChain = defineChain({
  id: envConfig.chainId,
  name: envConfig.chainName,
  nativeCurrency: {
    name: envConfig.currencyName,
    symbol: envConfig.currencySymbol,
    decimals: envConfig.currencyDecimals,
  },
  rpcUrls: {
    default: {
      http: [envConfig.rpcUrl],
    },
    public: {
      http: [envConfig.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: envConfig.explorerName,
      url: envConfig.explorerUrl,
    },
  },
  testnet: envConfig.isTestnet,
});

// Backwards compatibility alias
export const botchainTestnet = botchainChain;
