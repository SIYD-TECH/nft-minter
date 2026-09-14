'use client';

import React, { useState } from 'react';
import { resolveIpfsUrl, NFTMetadata } from '@/utils/ipfs';
import { envConfig } from '@/config/env';
import { ExternalLink, Sparkles, User, Tag, Image as ImageIcon } from 'lucide-react';

export interface NFTItem {
  tokenId: bigint;
  tokenURI: string;
  owner: string;
  metadata?: NFTMetadata | null;
  isLoading?: boolean;
}

interface NFTCardProps {
  nft: NFTItem;
  onSelect?: (nft: NFTItem) => void;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, onSelect }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = resolveIpfsUrl(nft.metadata?.image);
  const shortOwner = `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`;

  return (
    <div
      onClick={() => onSelect && onSelect(nft)}
      className="group relative rounded-2xl glass-card overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col"
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full bg-black/40 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
            <ImageIcon className="w-8 h-8 text-gray-500" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/60 p-4 text-center">
            <Sparkles className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-xs text-gray-400">Metadata preview</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={nft.metadata?.name || `NFT #${nft.tokenId.toString()}`}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Token ID pill */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-white flex items-center gap-1.5">
          <span className="text-emerald-400">#</span>
          <span>{nft.tokenId.toString()}</span>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
            {nft.metadata?.name || `Bot #${nft.tokenId.toString()}`}
          </h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 min-h-[32px]">
            {nft.metadata?.description || 'No description provided.'}
          </p>

          {/* Traits badges */}
          {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {nft.metadata.attributes.slice(0, 3).map((attr, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-300 font-mono"
                >
                  <span className="text-gray-500 mr-1">{attr.trait_type}:</span>
                  <span className="text-emerald-400 font-semibold">{attr.value}</span>
                </span>
              ))}
              {nft.metadata.attributes.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-400">
                  +{nft.metadata.attributes.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Owner & Explorer info */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-mono text-gray-300">{shortOwner}</span>
          </div>

          <a
            href={`${envConfig.explorerUrl}/address/${nft.owner}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition"
            title="View owner on BohrScan"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
