import { defineChain } from 'viem';
import { envConfig } from './env';

export const botchainTestnet = defineChain({
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
      name: 'BohrScan',
      url: envConfig.explorerUrl,
    },
  },
  testnet: true,
});
