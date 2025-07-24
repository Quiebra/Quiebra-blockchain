import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

const SEI_TESTNET_RPC_URL = process.env.SEI_TESTNET_RPC_URL || "[https://rpc.atlantic-2.sei.io](https://rpc.atlantic-2.sei.io)";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

if (!PRIVATE_KEY) {
  console.warn("PRIVATE_KEY is not set in .env. Please set it for deployment.");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20", // Use a recent Solidity version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    seiTestnet: {
      url: SEI_TESTNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 71371, // Chain ID for Sei Atlantic-2 testnet
    },
    // You can add more networks here (e.g., local development, other testnets)
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Optional: for contract verification
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;