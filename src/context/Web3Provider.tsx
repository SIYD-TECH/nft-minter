'use client';

import React, { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { State, WagmiProvider } from 'wagmi';
import { wagmiAdapter, projectId } from '@/config/wagmi';
import { botchainTestnet } from '@/config/chains';

// Set up React Query client
const queryClient = new QueryClient();

// Configure metadata
const metadata = {
  name: 'Botchain NFT Minter & Gallery',
  description: 'Mint and view NFTs on the Botchain Testnet',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://bohr.life',
  icons: ['https://scan.bohr.life/favicon.ico'],
};

// Initialize AppKit with Botchain testnet
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [botchainTestnet] as any,
  defaultNetwork: botchainTestnet as any,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#22c55e',
    '--w3m-border-radius-master': '12px',
  },
});

interface Web3ProviderProps {
  children: ReactNode;
  initialState?: State;
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as any} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
