/**
 * Centralized environment configuration
 * Ensures zero hardcoded network, contract, or IPFS values across the app
 */

export const envConfig = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 968),
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Botchain Testnet',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.bohr.life',
  explorerUrl: (process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://scan.bohr.life').replace(/\/$/, ''),
  currencyName: process.env.NEXT_PUBLIC_CURRENCY_NAME || 'BOT',
  currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'BOT',
  currencyDecimals: Number(process.env.NEXT_PUBLIC_CURRENCY_DECIMALS || 18),
  
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '',
  contractAddress: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as `0x${string}`,
  isContractConfigured: Boolean(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS &&
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS.startsWith('0x') &&
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS.length === 42
  ),
  
  pinataGateway: (process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/').replace(/\/$/, '') + '/',
  isPinataServerConfigured: Boolean(process.env.PINATA_JWT),
};
