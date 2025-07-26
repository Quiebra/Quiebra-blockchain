// blockchain/scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MemecoinFactory
  const treasury = deployer.address; // Set your treasury address here
  const basePrice = ethers.parseUnits("0.001", 18); // 0.001 ETH per token
  const slope = ethers.parseUnits("0.000001", 18); // 0.000001 ETH per token per token
  const curveType = 0; // 0 = linear
  const MemecoinFactory = await ethers.getContractFactory("MemecoinFactory");
  const factory = await MemecoinFactory.deploy(treasury, basePrice, slope, curveType);
  await factory.waitForDeployment();
  console.log("MemecoinFactory deployed to:", factory.target);

  // Deploy TradingBotExecutor with router address (set to 0x... for now)
  const router = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3"; // Replace with real router address
  const TradingBotExecutor = await ethers.getContractFactory("TradingBotExecutor");
  const executor = await TradingBotExecutor.deploy(treasury, 100, router);
  await executor.waitForDeployment();
  console.log("TradingBotExecutor deployed to:", executor.target);

  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});