'use client';

import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { envConfig } from '@/config/env';
import { Bot, ExternalLink, AlertTriangle, CheckCircle2, FileCode2 } from 'lucide-react';

interface NavbarProps {
  contractAddress: string;
  onOpenContractModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ contractAddress, onOpenContractModal }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = isConnected ? chainId === envConfig.chainId : true;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#080a0f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo & Network Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#080a0f] rounded-[10px] flex items-center justify-center">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-white">BOTCHAIN</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Testnet
              </span>
            </div>
            <p className="text-xs text-gray-400">NFT Minter & Gallery</p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Contract Address Status */}
          <button
            onClick={onOpenContractModal}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition"
            title="Configure or Deploy Contract"
          >
            <FileCode2 className="w-4 h-4 text-emerald-400" />
            <span>
              {contractAddress
                ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
                : 'Set Contract'}
            </span>
          </button>

          {/* Network Switch Prompt (if wrong chain) */}
          {isConnected && !isCorrectNetwork && (
            <button
              onClick={() => switchChain({ chainId: envConfig.chainId })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs text-amber-300 font-medium transition animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Switch to {envConfig.chainName} ({envConfig.chainId})</span>
            </button>
          )}

          {/* Network Active Badge */}
          {isConnected && isCorrectNetwork && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Chain {envConfig.chainId}</span>
            </div>
          )}

          {/* BohrScan Explorer Link */}
          <a
            href={envConfig.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>

          {/* Reown AppKit Button */}
          <div className="flex items-center">
            {/* @ts-ignore custom element */}
            <appkit-button balance="show" />
          </div>
        </div>
      </div>
    </header>
  );
};
