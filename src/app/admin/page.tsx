'use client';

import React, { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { BotchainNFTABI } from '@/abi/BotchainNFT';
import { BOTCHAIN_NFT_BYTECODE } from '@/abi/BotchainNFTBytecode';
import { envConfig } from '@/config/env';
import { Navbar } from '@/components/Navbar';
import {
  Rocket,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Loader2,
  Shield,
  FileCode2,
} from 'lucide-react';

export default function AdminPage() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [collectionName, setCollectionName] = useState('Botchain Punks');
  const [collectionSymbol, setCollectionSymbol] = useState('BOTPUNK');
  const [maxSupply, setMaxSupply] = useState('10000');
  const [mintPrice, setMintPrice] = useState('0');

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deployedAddress, setDeployedAddress] = useState('');
  const [copied, setCopied] = useState(false);

  const handleDeployContract = async () => {
    setErrorMsg('');
    setDeployedAddress('');

    if (!isConnected || !walletClient || !publicClient) {
      setErrorMsg('Please connect your wallet first to deploy a contract.');
      return;
    }

    try {
      setIsDeploying(true);
      setDeployStep('Requesting contract deployment transaction from wallet...');

      const hash = await walletClient.deployContract({
        abi: BotchainNFTABI,
        bytecode: BOTCHAIN_NFT_BYTECODE as `0x${string}`,
        args: [
          collectionName.trim() || 'Botchain Punks',
          collectionSymbol.trim() || 'BOTPUNK',
          BigInt(maxSupply || '10000'),
          BigInt(mintPrice || '0'),
        ],
      });

      setDeployStep(`Broadcasting transaction (${hash.slice(0, 8)}...)... waiting for block confirmation...`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.contractAddress) {
        setDeployStep('');
        setIsDeploying(false);
        setDeployedAddress(receipt.contractAddress);
      } else {
        throw new Error('Deployment completed but no contract address was returned.');
      }
    } catch (err: any) {
      console.error('Deployment error:', err);
      setIsDeploying(false);
      setDeployStep('');
      setErrorMsg(err.shortMessage || err.message || 'Failed to deploy contract.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Developer Admin Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Hidden Developer Route (/admin)</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-2">
            Smart Contract Admin
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Internal developer workspace for inspecting and deploying ERC-721 contracts on {envConfig.chainName}.
          </p>
        </div>

        {/* Section 1: Active Environment Configuration */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
            <span>Active Contract (from NEXT_PUBLIC_CONTRACT_ADDRESS)</span>
          </h3>

          {envConfig.isContractConfigured ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-black/40 border border-emerald-500/30">
              <div className="font-mono text-sm text-emerald-300 break-all">
                {envConfig.contractAddress}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(envConfig.contractAddress)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <a
                  href={`${envConfig.explorerUrl}/address/${envConfig.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition"
                  title="View on BohrScan"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              No contract is configured in <code>.env.local</code>. Deploy one below or set <code>NEXT_PUBLIC_CONTRACT_ADDRESS</code>.
            </div>
          )}
        </div>

        {/* Section 2: Deploy New Contract Tool */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-400" />
              <span>Deploy New Contract</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Deploy an ERC-721 contract with your connected wallet. Copy the address to <code>.env.local</code> after deployment.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {deployedAddress && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Contract Deployed Successfully!</span>
              </div>
              <div className="font-mono text-xs break-all bg-black/40 p-3 rounded-xl border border-emerald-500/30">
                NEXT_PUBLIC_CONTRACT_ADDRESS=&quot;{deployedAddress}&quot;
              </div>
              <p className="text-xs text-gray-300">
                Update <code>.env.local</code> with this address to activate it for all visitors.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Collection Name</label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Symbol</label>
              <input
                type="text"
                value={collectionSymbol}
                onChange={(e) => setCollectionSymbol(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Max Supply</label>
              <input
                type="number"
                value={maxSupply}
                onChange={(e) => setMaxSupply(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Mint Price (Wei)</label>
              <input
                type="text"
                value={mintPrice}
                onChange={(e) => setMintPrice(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {deployStep && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
              <span>{deployStep}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isDeploying || !isConnected}
            onClick={handleDeployContract}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying to {envConfig.chainName}...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span>Deploy Collection with Connected Wallet</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
