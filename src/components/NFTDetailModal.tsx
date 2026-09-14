'use client';

import React from 'react';
import { NFTItem } from './NFTCard';
import { resolveIpfsUrl } from '@/utils/ipfs';
import { envConfig } from '@/config/env';
import { X, ExternalLink, Bot, User, Hash, ShieldCheck, Tag } from 'lucide-react';

interface NFTDetailModalProps {
  nft: NFTItem | null;
  onClose: () => void;
}

export const NFTDetailModal: React.FC<NFTDetailModalProps> = ({ nft, onClose }) => {
  if (!nft) return null;

  const imageUrl = resolveIpfsUrl(nft.metadata?.image);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
          {/* Image */}
          <div className="flex flex-col items-center">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/50 border border-white/10 shadow-lg">
              <img
                src={imageUrl}
                alt={nft.metadata?.name || `NFT #${nft.tokenId.toString()}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <span className="text-emerald-400">#</span>
                <span>{nft.tokenId.toString()}</span>
              </div>
            </div>

            {/* IPFS URI Pill */}
            {nft.tokenURI && (
              <a
                href={resolveIpfsUrl(nft.tokenURI)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs text-gray-400 hover:text-emerald-400 font-mono transition max-w-full truncate px-3 py-1.5 rounded-lg bg-white/5 border border-white/5"
              >
                <span>View Raw Metadata</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Metadata details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
                <Bot className="w-4 h-4" />
                <span>{envConfig.chainName} Collection</span>
              </div>
              <h2 className="text-2xl font-black text-white">
                {nft.metadata?.name || `Bot #${nft.tokenId.toString()}`}
              </h2>
              <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                {nft.metadata?.description || 'No description provided for this NFT.'}
              </p>

              {/* Attributes / Traits */}
              {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attributes & Traits</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {nft.metadata.attributes.map((attr, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col"
                      >
                        <span className="text-[11px] text-gray-400 font-mono uppercase">
                          {attr.trait_type}
                        </span>
                        <span className="text-sm font-semibold text-emerald-300 truncate mt-0.5">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ownership and Explorer link */}
            <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Owner</span>
                <a
                  href={`${envConfig.explorerUrl}/address/${nft.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>
                    {nft.owner.slice(0, 8)}...{nft.owner.slice(-6)}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Token Standard</span>
                <span className="font-mono text-gray-300">ERC-721</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Network</span>
                <span className="font-mono text-emerald-400">{envConfig.chainName} ({envConfig.chainId})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
