// blockchain/scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MemecoinToken
  const MemecoinToken = await ethers.getContractFactory("MemecoinToken");
  const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 tokens
  const memecoin = await MemecoinToken.deploy("MyMemecoin", "MMC", initialSupply);
  await memecoin.waitForDeployment();
  console.log("MemecoinToken deployed to:", memecoin.target);

  // Deploy TradingBotExecutor
  const feeRecipient = deployer.address; // For now, deployer is the fee recipient
  const feePercentageBasisPoints = 100; // 1% fee
  const TradingBotExecutor = await ethers.getContractFactory("TradingBotExecutor");
  const executor = await TradingBotExecutor.deploy(feeRecipient, feePercentageBasisPoints);
  await executor.waitForDeployment();
  console.log("TradingBotExecutor deployed to:", executor.target);

  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});