import solc from 'solc';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('⚙️ Compiling BotchainNFT.sol...');

const contractPath = resolve(__dirname, '../contracts/BotchainNFT.sol');
const source = readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'BotchainNFT.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasError = false;
  for (const error of output.errors) {
    if (error.severity === 'error') {
      console.error('❌ Solidity Error:', error.formattedMessage);
      hasError = true;
    } else {
      console.warn('⚠️ Solidity Warning:', error.formattedMessage);
    }
  }
  if (hasError) {
    process.exit(1);
  }
}

const contract = output.contracts['BotchainNFT.sol']['BotchainNFT'];
const abi = contract.abi;
const bytecode = contract.evm.bytecode.object;

const abiDir = resolve(__dirname, '../src/abi');
if (!existsSync(abiDir)) {
  mkdirSync(abiDir, { recursive: true });
}

// 1. Write Full Artifact JSON
const artifact = {
  contractName: 'BotchainNFT',
  abi,
  bytecode: bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`,
};
writeFileSync(resolve(abiDir, 'BotchainNFTArtifact.json'), JSON.stringify(artifact, null, 2), 'utf8');

// 2. Write TS Bytecode Export
const bytecodeTs = `// Auto-generated EVM bytecode for BotchainNFT
export const BOTCHAIN_NFT_BYTECODE = "${artifact.bytecode}" as const;
`;
writeFileSync(resolve(abiDir, 'BotchainNFTBytecode.ts'), bytecodeTs, 'utf8');

console.log(`✅ Successfully compiled BotchainNFT!`);
console.log(`📊 Bytecode length: ${artifact.bytecode.length / 2} bytes`);
console.log(`📁 Artifact saved to src/abi/BotchainNFTArtifact.json & src/abi/BotchainNFTBytecode.ts`);
