const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  console.log("\n==================================================");
  console.log(`🚀 Deploying BotchainNFT to ${networkName}...`);
  console.log("==================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    console.error("❌ Error: No deployer account found. Ensure MAINNET_PRIVATE_KEY or PRIVATE_KEY is set in .env.local");
    process.exit(1);
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  const currencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "BOT";
  const explorerUrl = networkName === "botchainMainnet" 
    ? "https://scan.botchain.ai" 
    : (process.env.NEXT_PUBLIC_EXPLORER_URL || "https://scan.bohr.life").replace(/\/$/, "");

  console.log(`👤 Deployer Address: ${deployerAddress}`);
  console.log(`💰 Deployer Balance: ${hre.ethers.formatEther(balance)} ${currencySymbol}`);
  
  const name = process.env.NFT_NAME || "Botchain Punks";
  const symbol = process.env.NFT_SYMBOL || "BOTPUNK";
  const maxSupply = BigInt(process.env.NFT_MAX_SUPPLY || "10000");
  const mintPrice = BigInt(process.env.NFT_MINT_PRICE || "0");

  console.log(`\n📦 Deploying BotchainNFT (${name} [${symbol}], maxSupply=${maxSupply}, mintPrice=${mintPrice})...`);

  const BotchainNFT = await hre.ethers.getContractFactory("BotchainNFT");
  const botchainNFT = await BotchainNFT.deploy(name, symbol, maxSupply, mintPrice);

  await botchainNFT.waitForDeployment();
  const contractAddress = await botchainNFT.getAddress();
  const deploymentTx = botchainNFT.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : null;

  console.log(`\n🎉 BotchainNFT successfully deployed to: ${contractAddress}`);
  if (txHash) {
    console.log(`🧾 Transaction Hash: ${txHash}`);
    console.log(`🔎 Explorer Link: ${explorerUrl}/tx/${txHash}`);
  }
  console.log(`🔎 Contract Link: ${explorerUrl}/address/${contractAddress}`);

  // Update .env.local with deployed address
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    if (envContent.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_CONTRACT_ADDRESS="${contractAddress}"`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_CONTRACT_ADDRESS="${contractAddress}"\n`;
    }
    fs.writeFileSync(envPath, envContent, "utf8");
    console.log(`✅ Updated NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local to ${contractAddress}`);
  }

  // Update src/abi if artifacts exist
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/BotchainNFT.sol/BotchainNFT.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiDir = path.resolve(__dirname, "../src/abi");
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }
    const artifactExport = {
      contractName: "BotchainNFT",
      abi: artifact.abi,
      bytecode: artifact.bytecode,
    };
    fs.writeFileSync(path.resolve(abiDir, "BotchainNFTArtifact.json"), JSON.stringify(artifactExport, null, 2), "utf8");
    console.log(`✅ Updated frontend artifact in src/abi/BotchainNFTArtifact.json`);
  }

  console.log("\n==================================================");
  console.log("🚀 Deployment Complete!");
  console.log("==================================================\n");
}

main().catch((error) => {
  console.error("❌ Fatal deployment error:", error);
  process.exit(1);
});
