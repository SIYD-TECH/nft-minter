import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/context/Web3Provider';
import { envConfig } from '@/config/env';

export const metadata: Metadata = {
  title: `${envConfig.chainName} NFT Minter & Gallery`,
  description: `Mint and showcase your decentralized NFTs on ${envConfig.chainName} powered by Pinata IPFS.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#080a0f] text-slate-100 selection:bg-emerald-500 selection:text-black">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
