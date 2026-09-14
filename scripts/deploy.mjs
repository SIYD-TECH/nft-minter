import { createWalletClient, createPublicClient, http, defineChain, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to read .env or .env.local
function loadEnv() {
  const envPath = resolve(__dirname, '../.env.local');
  const env: Record<string, string> = {};
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[match[1]] = val;
      }
    }
  }
  return env;
}

async function main() {
  console.log('🚀 Botchain Testnet NFT Deployment Script');
  console.log('==========================================');

  const env = loadEnv();

  const rpcUrl = env.NEXT_PUBLIC_RPC_URL || 'https://rpc.bohr.life';
  const chainId = Number(env.NEXT_PUBLIC_CHAIN_ID || 968);
  const chainName = env.NEXT_PUBLIC_CHAIN_NAME || 'Botchain Testnet';
  const currencySymbol = env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'BOT';

  const privateKey = process.env.PRIVATE_KEY || env.PRIVATE_KEY;
  if (!privateKey || !privateKey.startsWith('0x')) {
    console.error('❌ Error: PRIVATE_KEY is missing or invalid in .env.local or environment.');
    console.error('Please set PRIVATE_KEY=0x... in .env.local with your testnet BOT deployer wallet.');
    process.exit(1);
  }

  const botchain = defineChain({
    id: chainId,
    name: chainName,
    nativeCurrency: { name: currencySymbol, symbol: currencySymbol, decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
  });

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`🔑 Deployer Address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: botchain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: botchain,
    transport: http(rpcUrl),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Deployer Balance: ${formatEther(balance)} ${currencySymbol}`);

  if (balance === BigInt(0)) {
    console.warn(`⚠️ Warning: Account balance is 0 ${currencySymbol}. Ensure you have testnet BOT for gas.`);
  }

  // Load compiled artifact
  const artifactPath = resolve(__dirname, '../src/abi/BotchainNFTArtifact.json');
  if (!existsSync(artifactPath)) {
    console.error(`❌ Compiled artifact not found at ${artifactPath}. Run build/compile first.`);
    process.exit(1);
  }

  const { abi, bytecode } = JSON.parse(readFileSync(artifactPath, 'utf8'));

  const name = env.NFT_NAME || 'Botchain Punks';
  const symbol = env.NFT_SYMBOL || 'BOTPUNK';
  const maxSupply = BigInt(env.NFT_MAX_SUPPLY || '10000');
  const mintPrice = BigInt(env.NFT_MINT_PRICE || '0');

  console.log(`📦 Deploying ${name} (${symbol}) to ${chainName}...`);

  const hash = await walletClient.deployContract({
    abi,
    bytecode: bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`,
    args: [name, symbol, maxSupply, mintPrice],
  });

  console.log(`⏳ Deployment tx broadcasted: ${hash}`);
  console.log(`🔎 Track on Explorer: ${env.NEXT_PUBLIC_EXPLORER_URL || 'https://scan.bohr.life'}/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.contractAddress) {
    console.log(`\n🎉 SUCCESS! Contract Deployed at: ${receipt.contractAddress}`);

    // Update .env.local automatically
    const envLocalPath = resolve(__dirname, '../.env.local');
    if (existsSync(envLocalPath)) {
      let content = readFileSync(envLocalPath, 'utf8');
      if (content.includes('NEXT_PUBLIC_CONTRACT_ADDRESS=')) {
        content = content.replace(
          /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
          `NEXT_PUBLIC_CONTRACT_ADDRESS="${receipt.contractAddress}"`
        );
      } else {
        content += `\nNEXT_PUBLIC_CONTRACT_ADDRESS="${receipt.contractAddress}"\n`;
      }
      writeFileSync(envLocalPath, content, 'utf8');
      console.log(`✅ Updated NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local`);
    }
  } else {
    console.error('❌ Failed: No contract address in transaction receipt.');
  }
}

main().catch((err) => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});
