'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { BotchainNFTABI } from '@/abi/BotchainNFT';
import { NFTCard, NFTItem } from './NFTCard';
import { NFTDetailModal } from './NFTDetailModal';
import { resolveIpfsUrl, NFTMetadata } from '@/utils/ipfs';
import { envConfig } from '@/config/env';
import {
  LayoutGrid,
  User,
  Search,
  RefreshCw,
  Sparkles,
  Inbox,
  Loader2,
  Filter,
} from 'lucide-react';

interface GalleryProps {
  onOpenMinter?: () => void;
  refreshKey?: number;
}

export const Gallery: React.FC<GalleryProps> = ({
  onOpenMinter,
  refreshKey = 0,
}) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // Contract address is strictly pulled from centralized env config
  const contractAddress = envConfig.contractAddress;

  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);

  // Gallery Data States
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [manualRefresh, setManualRefresh] = useState(0);

  // Read total supply from contract
  const { data: totalSupplyData, refetch: refetchSupply } = useReadContract({
    address: contractAddress,
    abi: BotchainNFTABI,
    functionName: 'totalSupply',
    query: {
      enabled: envConfig.isContractConfigured,
    },
  });

  const totalSupply = totalSupplyData ? Number(totalSupplyData) : 0;

  // Read user balance
  const { data: userBalanceData, refetch: refetchUserBalance } = useReadContract({
    address: contractAddress,
    abi: BotchainNFTABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(envConfig.isContractConfigured && address),
    },
  });

  const userBalance = userBalanceData ? Number(userBalanceData) : 0;

  // Fetch NFTs from contract
  useEffect(() => {
    let isCancelled = false;

    async function loadNFTs() {
      if (!contractAddress || !contractAddress.startsWith('0x') || !publicClient) {
        setNfts([]);
        return;
      }

      setIsLoading(true);

      try {
        let tokenIdsToLoad: bigint[] = [];

        if (activeTab === 'my' && address) {
          // Try batch query helper tokensOfOwner
          try {
            const ownedTokens = (await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: BotchainNFTABI,
              functionName: 'tokensOfOwner',
              args: [address],
            })) as bigint[];
            tokenIdsToLoad = [...ownedTokens];
          } catch (e) {
            // Fallback to tokenOfOwnerByIndex
            const count = userBalance;
            const ids: bigint[] = [];
            for (let i = 0; i < count; i++) {
              const id = (await publicClient.readContract({
                address: contractAddress as `0x${string}`,
                abi: BotchainNFTABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [address, BigInt(i)],
              })) as bigint;
              ids.push(id);
            }
            tokenIdsToLoad = ids;
          }
        } else {
          // Load all tokens
          const total = totalSupply;
          if (total > 0) {
            const ids: bigint[] = [];
            for (let i = 0; i < total; i++) {
              try {
                const id = (await publicClient.readContract({
                  address: contractAddress as `0x${string}`,
                  abi: BotchainNFTABI,
                  functionName: 'tokenByIndex',
                  args: [BigInt(i)],
                })) as bigint;
                ids.push(id);
              } catch (err) {
                // If tokenByIndex is out of bounds or 1-indexed fallback
                ids.push(BigInt(i + 1));
              }
            }
            tokenIdsToLoad = ids;
          }
        }

        if (isCancelled) return;

        // Fetch details for each token
        const loadedItems: NFTItem[] = await Promise.all(
          tokenIdsToLoad.map(async (tokenId) => {
            try {
              const [tokenURI, owner] = await Promise.all([
                publicClient.readContract({
                  address: contractAddress as `0x${string}`,
                  abi: BotchainNFTABI,
                  functionName: 'tokenURI',
                  args: [tokenId],
                }) as Promise<string>,
                publicClient.readContract({
                  address: contractAddress as `0x${string}`,
                  abi: BotchainNFTABI,
                  functionName: 'ownerOf',
                  args: [tokenId],
                }) as Promise<string>,
              ]);

              // Fetch metadata JSON
              let metadata: NFTMetadata | null = null;
              try {
                if (tokenURI.startsWith('data:application/json')) {
                  const jsonStr = decodeURIComponent(tokenURI.replace('data:application/json;utf8,', ''));
                  metadata = JSON.parse(jsonStr);
                } else {
                  const resolvedUri = resolveIpfsUrl(tokenURI);
                  const res = await fetch(resolvedUri);
                  if (res.ok) {
                    metadata = await res.json();
                  }
                }
              } catch (metaErr) {
                console.warn(`Could not resolve metadata for token ${tokenId}`, metaErr);
              }

              return {
                tokenId,
                tokenURI,
                owner,
                metadata,
              };
            } catch (err) {
              console.error(`Error loading token ${tokenId}:`, err);
              return {
                tokenId,
                tokenURI: '',
                owner: '0x0000000000000000000000000000000000000000',
                metadata: null,
              };
            }
          })
        );

        if (!isCancelled) {
          // Sort descending by token ID
          setNfts(loadedItems.sort((a, b) => (b.tokenId > a.tokenId ? 1 : -1)));
        }
      } catch (err) {
        console.error('Failed to load gallery items:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadNFTs();

    return () => {
      isCancelled = true;
    };
  }, [contractAddress, activeTab, totalSupply, userBalance, address, publicClient, refreshKey, manualRefresh]);

  // Filtered NFTs based on search
  const filteredNFTs = useMemo(() => {
    if (!searchTerm.trim()) return nfts;
    const query = searchTerm.toLowerCase();
    return nfts.filter((nft) => {
      const matchId = nft.tokenId.toString().includes(query);
      const matchName = nft.metadata?.name?.toLowerCase().includes(query);
      const matchOwner = nft.owner.toLowerCase().includes(query);
      const matchTrait = nft.metadata?.attributes?.some(
        (a) =>
          a.trait_type.toLowerCase().includes(query) ||
          String(a.value).toLowerCase().includes(query)
      );
      return matchId || matchName || matchOwner || matchTrait;
    });
  }, [nfts, searchTerm]);

  const handleRefresh = () => {
    refetchSupply();
    refetchUserBalance();
    setManualRefresh((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-emerald-400" />
            <span>NFT Gallery</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Explore all NFTs minted across the {envConfig.chainName}
          </p>
        </div>

        {/* Tab switcher & refresh */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="p-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Collection ({totalSupply})</span>
            </button>

            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'my'
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My NFTs ({userBalance})</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition disabled:opacity-50"
            title="Refresh Gallery"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, Token ID (#1), trait, or owner address..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Gallery Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-3" />
          <p className="text-sm text-gray-300 font-medium">Querying Botchain Testnet...</p>
          <p className="text-xs text-gray-500 mt-1">Resolving IPFS metadata and token states</p>
        </div>
      ) : filteredNFTs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredNFTs.map((nft) => (
            <NFTCard key={nft.tokenId.toString()} nft={nft} onSelect={setSelectedNFT} />
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center glass-panel rounded-3xl border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-4 border border-white/5">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {searchTerm
              ? 'No NFTs match your search'
              : activeTab === 'my'
              ? 'You do not own any NFTs yet'
              : 'No NFTs have been minted yet'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mt-1 mb-5">
            {searchTerm
              ? 'Try searching with a different token ID or keyword.'
              : activeTab === 'my'
              ? 'Mint an NFT to view it in your personal collection.'
              : 'Be the first pioneer to mint an NFT on the Botchain Testnet!'}
          </p>
          {onOpenMinter && (
            <button
              onClick={onOpenMinter}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-wide transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mint an NFT</span>
            </button>
          )}
        </div>
      )}

      {/* NFT Detail Modal */}
      <NFTDetailModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />
    </div>
  );
};
