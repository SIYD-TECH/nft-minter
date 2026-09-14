# 🤖 Botchain NFT Minter & Gallery dApp

A decentralized application (dApp) built with **Next.js**, **TypeScript**, **Reown AppKit**, **Wagmi v2**, and **Viem** for minting and exploring NFTs on the **Botchain Testnet** (Chain ID: `968`).

Artwork and ERC-721 JSON metadata are permanently pinned to **Pinata IPFS** for decentralized storage.

---

## 🌟 Features

- **Decentralized Storage via Pinata IPFS**:
  - Secure server-side `/api/pinata` endpoint for pinning image assets and OpenSea-compliant ERC-721 metadata JSON.
  - Automatic IPFS gateway resolution (`NEXT_PUBLIC_PINATA_GATEWAY`).
- **Botchain Testnet Native**:
  - Custom chain definition for Botchain Testnet (Chain ID `968`, RPC `https://rpc.bohr.life`, BohrScan Explorer `https://scan.bohr.life/`).
  - Native currency: `BOT`.
  - Automatic network switch detection in navbar.
- **Modern Web3 Wallet Connection**:
  - Powered by **Reown AppKit** (`@reown/appkit`, `@reown/appkit-adapter-wagmi`, `wagmi@2.x`).
  - Supports MetaMask, Rabby, Coinbase Wallet, WalletConnect, and browser-injected wallets.
- **Interactive NFT Minter**:
  - Live preview with instant preset cyber/bot avatars or custom image file upload.
  - Custom traits/attributes key-value editor.
  - Step-by-step transaction state: Uploading to Pinata -> Wallet Signature -> On-chain Confirmation -> Confetti celebration!
  - Direct transaction link to BohrScan.
- **Collection Gallery View**:
  - **All Collection**: Queries `totalSupply` and enumerates every minted token on Botchain.
  - **My NFTs**: Instant filtered view of NFTs owned by the connected wallet.
  - Search by Name, Token ID, Trait, or Owner address.
  - Detail modal with high-resolution image preview, raw IPFS URI, and trait pills.
- **Contract Management & 1-Click Deployment**:
  - Deploy an ERC-721 contract with 1 click directly from MetaMask inside the dApp.
  - Or deploy via CLI with `npm run deploy:contract`.
  - Switch active contract addresses on the fly with automatic persistence.
- **Zero Hardcoded Values**:
  - 100% of network parameters, contract addresses, token symbols, and API keys are driven via environment variables.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description | Default / Example |
|---|---|---|
| `NEXT_PUBLIC_CHAIN_ID` | Botchain Testnet Chain ID | `968` |
| `NEXT_PUBLIC_CHAIN_NAME` | Network Name | `Botchain Testnet` |
| `NEXT_PUBLIC_RPC_URL` | RPC Endpoint | `https://rpc.bohr.life` |
| `NEXT_PUBLIC_EXPLORER_URL` | BohrScan Explorer URL | `https://scan.bohr.life` |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | Native Currency | `BOT` |
| `NEXT_PUBLIC_PROJECT_ID` | Reown AppKit Project ID | Free from [cloud.reown.com](https://cloud.reown.com) |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Active ERC-721 Contract Address | `0x...` |
| `PINATA_JWT` | Pinata API JWT Token (Server Only) | From [app.pinata.cloud](https://app.pinata.cloud) |
| `NEXT_PUBLIC_PINATA_GATEWAY` | IPFS Dedicated Gateway URL | `https://gateway.pinata.cloud/ipfs/` |
| `PRIVATE_KEY` | Deployer Wallet Private Key (CLI deploy) | `0x...` |

---

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Deploy Smart Contract**:
   - **Option A (In-Browser)**: Connect MetaMask on Botchain Testnet, click "Deploy / Set Contract" in the header, and click "Deploy Collection with Wallet".
   - **Option B (CLI)**:
     ```bash
     npm run deploy:contract
     ```

---

## 📜 Smart Contract (`BotchainNFT.sol`)

- **Standard**: Full OpenZeppelin-compatible ERC-721 with `ERC721Enumerable` and `ERC721URIStorage`.
- **Functions**:
  - `mint(string uri)`: Mints token with metadata URI to `msg.sender`.
  - `tokensOfOwner(address owner)`: Batch queries all token IDs owned by an address.
  - `totalSupply()`, `tokenByIndex(index)`, `tokenOfOwnerByIndex(owner, index)`: Full enumeration.
  - `tokenURI(tokenId)`: Retrieves token metadata IPFS URI.
