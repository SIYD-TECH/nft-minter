'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { BotchainNFTABI } from '@/abi/BotchainNFT';
import { envConfig } from '@/config/env';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Bot,
  Zap,
  X,
} from 'lucide-react';

// Preset Cyber Bot avatars (SVG data URIs for instant preview and fallback)
const PRESET_BOTS = [
  {
    name: 'Cyber Sentinel',
    desc: 'Elite vanguard protecting the Botchain core nodes.',
    type: 'Sentinel',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%230b0e14"/><circle cx="200" cy="200" r="140" fill="%23111927" stroke="%2322c55e" stroke-width="4"/><rect x="130" y="140" width="140" height="110" rx="20" fill="%231b263b" stroke="%2300f0ff" stroke-width="3"/><circle cx="170" cy="185" r="14" fill="%2300f0ff"/><circle cx="230" cy="185" r="14" fill="%2300f0ff"/><line x1="160" y1="225" x2="240" y2="225" stroke="%2322c55e" stroke-width="6" stroke-linecap="round"/><line x1="200" y1="140" x2="200" y2="90" stroke="%2322c55e" stroke-width="6"/><circle cx="200" cy="80" r="12" fill="%23ff0055"/></svg>`,
  },
  {
    name: 'Neon Cortex',
    desc: 'Autonomous AI synthesis unit connected to Bohr neural layers.',
    type: 'Cortex AI',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23090b10"/><circle cx="200" cy="200" r="140" fill="%23131326" stroke="%239d4edd" stroke-width="4"/><polygon points="200,120 270,240 130,240" fill="%23240046" stroke="%23c77dff" stroke-width="3"/><circle cx="200" cy="190" r="22" fill="%23e0aaff"/><circle cx="200" cy="190" r="10" fill="%23ffffff"/><line x1="130" y1="240" x2="200" y2="280" stroke="%239d4edd" stroke-width="4"/><line x1="270" y1="240" x2="200" y2="280" stroke="%239d4edd" stroke-width="4"/></svg>`,
  },
  {
    name: 'Valkyrie Mech',
    desc: 'High-speed orbital scout with quantum radar arrays.',
    type: 'Valkyrie',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%230a0d13"/><rect x="120" y="120" width="160" height="160" rx="30" fill="%231a2233" stroke="%23ffb703" stroke-width="4"/><rect x="150" y="160" width="100" height="30" rx="15" fill="%2300f0ff"/><rect x="160" y="220" width="80" height="20" rx="6" fill="%23fb8500"/><polygon points="120,160 80,200 120,240" fill="%23ffb703"/><polygon points="280,160 320,200 280,240" fill="%23ffb703"/></svg>`,
  },
  {
    name: 'Shadow Automaton',
    desc: 'Stealth surveillance construct calibrated for zero latency.',
    type: 'Automaton',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%2305070a"/><circle cx="200" cy="200" r="140" fill="%230d121c" stroke="%23ff0055" stroke-width="3"/><path d="M140 160 L200 130 L260 160 L240 240 L160 240 Z" fill="%231e0814" stroke="%23ff0055" stroke-width="3"/><circle cx="175" cy="180" r="8" fill="%2300ffff"/><circle cx="225" cy="180" r="8" fill="%2300ffff"/><path d="M180 215 Q200 230 220 215" stroke="%23ff0055" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  },
];

interface MinterProps {
  onMintSuccess?: () => void;
}

interface SuccessToastState {
  show: boolean;
  tokenId?: string;
  txHash?: string;
}

export const Minter: React.FC<MinterProps> = ({ onMintSuccess }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Contract address is strictly pulled from centralized env config
  const contractAddress = envConfig.contractAddress;

  // Form State
  const [name, setName] = useState('Cyber Sentinel #1');
  const [description, setDescription] = useState('First generation guardian minted on Botchain Testnet.');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(PRESET_BOTS[0].svg);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [customIpfsUrl, setCustomIpfsUrl] = useState<string>('');
  const [traits, setTraits] = useState<Array<{ trait_type: string; value: string }>>([
    { trait_type: 'Class', value: 'Sentinel' },
    { trait_type: 'Network', value: envConfig.chainName },
  ]);

  // Minting Lifecycle State
  const [isUploadingIpfs, setIsUploadingIpfs] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Clean Toast Notification State (replaces canvas-confetti)
  const [toast, setToast] = useState<SuccessToastState>({ show: false });

  const isCorrectChain = chainId === envConfig.chainId;

  // Read mint price from contract
  const { data: mintPriceData } = useReadContract({
    address: contractAddress,
    abi: BotchainNFTABI,
    functionName: 'mintPrice',
    query: {
      enabled: envConfig.isContractConfigured,
    },
  });

  const mintPriceWei = (mintPriceData as bigint) || BigInt(0);
  const mintPriceBot = formatEther(mintPriceWei);

  // Wagmi Write Contract Hook
  const { data: hash, isPending: isWritePending, writeContract } = useWriteContract();

  // Transaction confirmation hook
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle trait modification
  const addTrait = () => {
    setTraits([...traits, { trait_type: '', value: '' }]);
  };

  const updateTrait = (index: number, key: 'trait_type' | 'value', val: string) => {
    const updated = [...traits];
    updated[index][key] = val;
    setTraits(updated);
  };

  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  // Handle image upload selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setSelectedPreset(-1);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Select Preset
  const handleSelectPreset = (idx: number) => {
    setSelectedPreset(idx);
    setImageFile(null);
    setImagePreview(PRESET_BOTS[idx].svg);
    setName(`${PRESET_BOTS[idx].name} #${Math.floor(Math.random() * 900) + 100}`);
    setDescription(PRESET_BOTS[idx].desc);
    setTraits([
      { trait_type: 'Class', value: PRESET_BOTS[idx].type },
      { trait_type: 'Network', value: envConfig.chainName },
    ]);
  };

  // Perform IPFS Pin & Contract Mint
  const handleMint = async () => {
    setErrorMessage('');
    setStatusMessage('');

    if (!envConfig.isContractConfigured) {
      setErrorMessage('App not configured — contact the site owner.');
      return;
    }

    if (!isConnected) {
      setErrorMessage('Please connect your wallet first.');
      return;
    }

    if (!isCorrectChain) {
      try {
        await switchChain({ chainId: envConfig.chainId });
      } catch (err: any) {
        setErrorMessage(`Please switch to ${envConfig.chainName} in your wallet.`);
        return;
      }
    }

    try {
      setIsUploadingIpfs(true);
      let finalImageUri = customIpfsUrl.trim();

      // Step 1: Pin Image to Pinata (if a file is selected)
      if (imageFile) {
        setStatusMessage('Uploading image asset to Pinata IPFS...');
        const formData = new FormData();
        formData.append('file', imageFile);

        const res = await fetch('/api/pinata', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload image to Pinata IPFS');
        }

        const data = await res.json();
        finalImageUri = data.ipfsUrl || `ipfs://${data.ipfsHash}`;
      } else if (!finalImageUri) {
        // Use preview data URI as fallback
        finalImageUri = imagePreview;
      }

      // Step 2: Build standard ERC-721 Metadata
      const metadataPayload = {
        name: name.trim() || 'Botchain NFT',
        description: description.trim(),
        image: finalImageUri,
        attributes: traits.filter((t) => t.trait_type.trim() && t.value.trim()),
      };

      // Step 3: Pin Metadata JSON to Pinata IPFS
      setStatusMessage('Pinning NFT metadata to Pinata IPFS...');
      let tokenURI = '';

      const metaRes = await fetch('/api/pinata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          metadata: metadataPayload,
        }),
      });

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        tokenURI = metaData.tokenURI || `ipfs://${metaData.ipfsHash}`;
      } else {
        // Fallback to data URI if Pinata is offline
        const encoded = encodeURIComponent(JSON.stringify(metadataPayload));
        tokenURI = `data:application/json;utf8,${encoded}`;
      }

      setIsUploadingIpfs(false);
      setStatusMessage('Sending mint transaction to Botchain...');

      // Step 4: Call contract mint()
      writeContract(
        {
          address: contractAddress,
          abi: BotchainNFTABI,
          functionName: 'mint',
          args: [tokenURI],
          value: mintPriceWei,
        },
        {
          onSuccess: (txHash) => {
            setStatusMessage(`Transaction submitted! Hash: ${txHash.slice(0, 10)}...`);
          },
          onError: (err) => {
            console.error('Mint write error:', err);
            setErrorMessage(err.message || 'Transaction was rejected or failed.');
            setStatusMessage('');
          },
        }
      );
    } catch (err: any) {
      console.error('Minting error:', err);
      setIsUploadingIpfs(false);
      setErrorMessage(err.message || 'An error occurred during metadata preparation.');
      setStatusMessage('');
    }
  };

  // Ref to track confirmed transaction hash and prevent infinite re-renders
  const handledTxRef = useRef<string | null>(null);

  // Trigger minimal clean success toast upon transaction receipt confirmation
  useEffect(() => {
    if (isConfirmed && hash && handledTxRef.current !== hash) {
      handledTxRef.current = hash;
      setStatusMessage('');
      
      // Extract minted token ID from Transfer event topic if available
      let extractedTokenId: string | undefined;
      if (receipt?.logs && receipt.logs.length > 0) {
        try {
          const transferLog = receipt.logs.find(
            (log) =>
              log.topics[0]?.toLowerCase() ===
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'.toLowerCase()
          );
          if (transferLog && transferLog.topics[3]) {
            extractedTokenId = BigInt(transferLog.topics[3]).toString();
          }
        } catch {
          // Fallback if log format differs
        }
      }

      setToast({
        show: true,
        tokenId: extractedTokenId,
        txHash: hash,
      });

      if (onMintSuccess) {
        onMintSuccess();
      }
    }
  }, [isConfirmed, hash, receipt, onMintSuccess]);

  return (
    <div className="relative glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 glow-box">
      {/* Minimal Clean Success Toast / Notification */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full sm:w-auto transition-all duration-300 animate-in fade-in slide-in-from-top-4">
          <div className="p-4 rounded-2xl bg-[#0b0e14]/95 backdrop-blur-xl border border-emerald-500/40 shadow-2xl shadow-emerald-500/10 flex items-start gap-3">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="flex-1 pr-2">
              <h4 className="text-sm font-bold text-white">
                NFT Minted Successfully! {toast.tokenId ? `Token #${toast.tokenId}` : ''}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Your NFT is now live on the {envConfig.chainName}.
              </p>

              {toast.txHash && (
                <a
                  href={`${envConfig.explorerUrl}/tx/${toast.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono mt-2 transition"
                >
                  <span>View transaction on BohrScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <button
              onClick={() => setToast({ show: false })}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Artwork Preview & Selection */}
        <div className="w-full lg:w-5/12 flex flex-col items-center">
          <div className="relative aspect-square w-full max-w-sm rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl group">
            <img
              src={imagePreview}
              alt="NFT Preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Preview</span>
            </div>
          </div>

          {/* Preset Bot Avatars Picker */}
          <div className="w-full max-w-sm mt-4">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block mb-2">
              Choose Preset or Upload Custom
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_BOTS.map((bot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                    selectedPreset === idx
                      ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/20'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                  title={bot.name}
                >
                  <img src={bot.svg} alt={bot.name} className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>

            {/* Custom File Upload Input */}
            <div className="mt-3">
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-white/20 hover:border-emerald-400/50 bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-medium cursor-pointer transition"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{imageFile ? imageFile.name : 'Upload Custom Image (PNG, JPG, GIF)'}</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Form & Mint Action */}
        <div className="w-full lg:w-7/12 space-y-5">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              <span>{envConfig.chainName} Minter</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Mint Your NFT
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Store your artwork and metadata decentralized on Pinata IPFS and mint onto Botchain.
            </p>
          </div>

          {/* Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                NFT Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cyber Sentinel #01"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-500 focus:outline-none text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your NFT story, utility, or attributes..."
                className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-500 focus:outline-none text-white text-sm"
              />
            </div>
          </div>

          {/* Dynamic Attributes / Traits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase text-gray-300">
                Attributes / Traits ({traits.length})
              </label>
              <button
                type="button"
                onClick={addTrait}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Trait</span>
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {traits.map((trait, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Trait Type (e.g. Element)"
                    value={trait.trait_type}
                    onChange={(e) => updateTrait(idx, 'trait_type', e.target.value)}
                    className="w-1/2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Plasma)"
                    value={trait.value}
                    onChange={(e) => updateTrait(idx, 'value', e.target.value)}
                    className="w-1/2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeTrait(idx)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Mint Button */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-gray-400">Mint Price:</span>
              <span className="font-mono font-bold text-white flex items-center gap-1">
                <span className="text-emerald-400">{mintPriceBot}</span>
                <span>{envConfig.currencySymbol}</span>
              </span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 mb-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="break-all">{errorMessage}</span>
              </div>
            )}

            {/* Status Feedback */}
            {statusMessage && (
              <div className="p-3 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Mint Action Button */}
            <button
              type="button"
              disabled={isUploadingIpfs || isWritePending || isConfirming}
              onClick={handleMint}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-base tracking-wide transition shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploadingIpfs ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Pinning to Pinata IPFS...</span>
                </>
              ) : isWritePending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Confirm in Wallet...</span>
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Confirming on Botchain...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Mint NFT ({mintPriceBot} {envConfig.currencySymbol})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
