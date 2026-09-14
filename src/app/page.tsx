'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Minter } from '@/components/Minter';
import { Gallery } from '@/components/Gallery';
import { envConfig } from '@/config/env';
import { Bot, Sparkles, LayoutGrid, AlertCircle, ExternalLink, HardDrive } from 'lucide-react';

export default function Home() {
  const [refreshGalleryKey, setRefreshGalleryKey] = useState(0);

  const minterRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleMintSuccess = useCallback(() => {
    setRefreshGalleryKey((prev) => prev + 1);
    if (galleryRef.current) {
      galleryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollToMinter = () => {
    if (minterRef.current) {
      minterRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToGallery = () => {
    if (galleryRef.current) {
      galleryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* If contract address is missing or invalid in environment, show clear error state */}
        {!envConfig.isContractConfigured ? (
          <div className="py-24 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 shadow-lg shadow-amber-500/10">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              App Not Configured
            </h2>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              The contract address is not configured. Please contact the site owner.
            </p>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 border border-white/10 glow-box-cyan">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Decentralized NFT Protocol on {envConfig.chainName}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  Create, Mint & Collect <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                    Next-Gen Botchain NFTs
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
                  Mint digital artifacts with permanent decentralized storage on{' '}
                  <strong className="text-white">Pinata IPFS</strong>, confirmed in seconds on the{' '}
                  <strong className="text-white">{envConfig.chainName}</strong> (Chain ID: {envConfig.chainId}).
                </p>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={scrollToMinter}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-wide transition shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Start Minting</span>
                  </button>

                  <button
                    onClick={scrollToGallery}
                    className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm tracking-wide transition flex items-center gap-2"
                  >
                    <LayoutGrid className="w-4 h-4 text-emerald-400" />
                    <span>Explore Gallery</span>
                  </button>
                </div>
              </div>

              {/* Quick specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
                <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                  <span className="text-[11px] font-mono uppercase text-gray-400 block">Chain ID</span>
                  <span className="text-base font-bold font-mono text-emerald-400">{envConfig.chainId}</span>
                </div>

                <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                  <span className="text-[11px] font-mono uppercase text-gray-400 block">Native Token</span>
                  <span className="text-base font-bold font-mono text-white">{envConfig.currencySymbol}</span>
                </div>

                <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                  <span className="text-[11px] font-mono uppercase text-gray-400 block">Metadata Storage</span>
                  <span className="text-base font-bold text-cyan-400 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Pinata IPFS</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                  <span className="text-[11px] font-mono uppercase text-gray-400 block">Block Explorer</span>
                  <a
                    href={envConfig.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-bold text-gray-300 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <span>BohrScan</span>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                </div>
              </div>
            </section>

            {/* Minter Section */}
            <section ref={minterRef}>
              <Minter onMintSuccess={handleMintSuccess} />
            </section>

            {/* Gallery Section */}
            <section ref={galleryRef}>
              <Gallery onOpenMinter={scrollToMinter} refreshKey={refreshGalleryKey} />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#06080d] mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>{envConfig.chainName} &bull; Powered by Reown AppKit & Pinata</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href={envConfig.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition"
            >
              BohrScan Explorer
            </a>
            <a
              href="https://rpc.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition"
            >
              RPC Endpoint
            </a>
            <a
              href="https://app.pinata.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition"
            >
              Pinata Cloud
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
