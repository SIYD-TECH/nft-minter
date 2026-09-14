'use client';

import React, { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { BotchainNFTABI } from '@/abi/BotchainNFT';
import { BOTCHAIN_NFT_BYTECODE } from '@/abi/BotchainNFTBytecode';
import { envConfig } from '@/config/env';
import {
  X,
  FileCode2,
  Rocket,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Loader2,
  Settings,
} from 'lucide-react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  onUpdateAddress: (address: string) => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onUpdateAddress,
}) => {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [inputAddress, setInputAddress] = useState(currentAddress);
  const [collectionName, setCollectionName] = useState('Botchain Punks');
  const [collectionSymbol, setCollectionSymbol] = useState('BOTPUNK');
  const [maxSupply, setMaxSupply] = useState('10000');
  const [mintPrice, setMintPrice] = useState('0');

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSaveAddress = () => {
    setErrorMsg('');
    const trimmed = inputAddress.trim();
    if (!trimmed || !trimmed.startsWith('0x') || trimmed.length !== 42) {
      setErrorMsg('Please provide a valid Ethereum contract address (0x...)');
      return;
    }
    onUpdateAddress(trimmed);
    setSuccessMsg('Contract address saved!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleDeployContract = async () => {
    setErrorMsg('');
    setSuccessMsg('');

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
        setSuccessMsg(`Contract successfully deployed at: ${receipt.contractAddress}`);
        setInputAddress(receipt.contractAddress);
        onUpdateAddress(receipt.contractAddress);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
          <Settings className="w-4 h-4" />
          <span>Contract Settings</span>
        </div>
        <h2 className="text-2xl font-black text-white">Smart Contract Setup</h2>
        <p className="text-xs text-gray-400 mt-1">
          Connect an existing ERC-721 contract or deploy a fresh one on {envConfig.chainName}.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="font-mono break-all">{successMsg}</span>
          </div>
        )}

        {/* Section 1: Use Existing Contract Address */}
        <div className="mt-6 space-y-3">
          <label className="block text-xs font-mono uppercase text-gray-300">
            Active Contract Address
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none placeholder:text-gray-600"
            />
            {currentAddress && (
              <button
                type="button"
                onClick={() => copyToClipboard(currentAddress)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition"
                title="Copy Address"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveAddress}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition"
            >
              Save
            </button>
          </div>
        </div>

        {/* Section 2: 1-Click Deploy Fresh Contract */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Rocket className="w-4 h-4 text-emerald-400" />
                <span>Deploy New Contract</span>
              </h4>
              <p className="text-[11px] text-gray-400">
                Deploy ERC-721 directly using your connected wallet onto {envConfig.chainName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">Collection Name</label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">Symbol</label>
              <input
                type="text"
                value={collectionSymbol}
                onChange={(e) => setCollectionSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {deployStep && (
            <div className="p-3 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
              <span>{deployStep}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isDeploying || !isConnected}
            onClick={handleDeployContract}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Deploying to {envConfig.chainName}...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 text-emerald-400" />
                <span>Deploy Collection with Wallet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
