try {
  require('@nomicfoundation/hardhat-toolbox');
} catch (e) {
  // toolbox optional if using standalone compilation
}
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  if (process.loadEnvFile) {
    try {
      process.loadEnvFile('.env.local');
    } catch (err) {}
  }
}

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const accounts = PRIVATE_KEY && PRIVATE_KEY.length >= 64 
  ? [PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`] 
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.25',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    botchainTestnet: {
      url: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.bohr.life',
      chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 968),
      accounts,
    },
    botchainMainnet: {
      url: process.env.MAINNET_RPC_URL,
      chainId: Number(process.env.MAINNET_CHAIN_ID),
      accounts: process.env.MAINNET_PRIVATE_KEY 
        ? [process.env.MAINNET_PRIVATE_KEY.startsWith('0x') ? process.env.MAINNET_PRIVATE_KEY : `0x${process.env.MAINNET_PRIVATE_KEY}`] 
        : [],
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};
