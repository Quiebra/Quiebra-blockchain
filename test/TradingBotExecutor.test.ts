// blockchain/test/TradingBotExecutor.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TradingBotExecutor", function () {
  let TradingBotExecutor;
  let executor: any;
  let owner: any;
  let feeRecipient: any;
  let addr1: any;
  let mockTokenIn: any;
  let mockTokenOut: any;

  beforeEach(async function () {
    [owner, feeRecipient, addr1] = await ethers.getSigners();

    // Deploy mock ERC20 tokens for testing
    const MockERC20 = await ethers.getContractFactory("MemecoinToken"); // Reusing MemecoinToken as a mock ERC20
    mockTokenIn = await MockERC20.deploy("TokenIn", "TIN", ethers.parseUnits("1000000", 18));
    await mockTokenIn.waitForDeployment();
    mockTokenOut = await MockERC20.deploy("TokenOut", "TOUT", ethers.parseUnits("1000000", 18));
    await mockTokenOut.waitForDeployment();

    TradingBotExecutor = await ethers.getContractFactory("TradingBotExecutor");
    executor = await TradingBotExecutor.deploy(feeRecipient.address, 100); // 1% fee
    await executor.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await executor.owner()).to.equal(owner.address);
    });

    it("Should set the correct fee recipient and percentage", async function () {
      expect(await executor.feeRecipient()).to.equal(feeRecipient.address);
      expect(await executor.feePercentageBasisPoints()).to.equal(100);
    });
  });

  describe("Trade Execution", function () {
    it("Should allow owner to execute a trade", async function () {
      const amountIn = ethers.parseUnits("100", 18);
      const minAmountOut = ethers.parseUnits("95", 18);
      const path = [mockTokenIn.target, mockTokenOut.target];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

      // For this test, we need to ensure the executor contract has enough tokenIn
      // Mint some mockTokenIn to the executor contract
      await mockTokenIn.mint(executor.target, amountIn);

      await expect(executor.executeTrade(
        mockTokenIn.target,
        mockTokenOut.target,
        amountIn,
        minAmountOut,
        path,
        deadline
      )).to.emit(executor, "TradeExecuted")
        .withArgs(owner.address, mockTokenIn.target, mockTokenOut.target, amountIn, minAmountOut + (amountIn / 100)); // Mocked actualAmountOut

      // Check if fees were emitted (mocked)
      await expect(executor.executeTrade(
        mockTokenIn.target,
        mockTokenOut.target,
        amountIn,
        minAmountOut,
        path,
        deadline
      )).to.emit(executor, "FeesCollected");
    });

    it("Should not allow non-owner to execute a trade", async function () {
      const amountIn = ethers.parseUnits("100", 18);
      const minAmountOut = ethers.parseUnits("95", 18);
      const path = [mockTokenIn.target, mockTokenOut.target];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      await expect(
        executor.connect(addr1).executeTrade(
          mockTokenIn.target,
          mockTokenOut.target,
          amountIn,
          minAmountOut,
          path,
          deadline
        )
      ).to.be.revertedWithCustomError(executor, "OwnableUnauthorizedAccount");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to set new fee recipient", async function () {
      await executor.setFeeRecipient(addr1.address);
      expect(await executor.feeRecipient()).to.equal(addr1.address);
    });

    it("Should not allow non-owner to set new fee recipient", async function () {
      await expect(
        executor.connect(addr1).setFeeRecipient(addr1.address)
      ).to.be.revertedWithCustomError(executor, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to set new fee percentage", async function () {
      await executor.setFeePercentage(200); // 2%
      expect(await executor.feePercentageBasisPoints()).to.equal(200);
    });

    it("Should not allow non-owner to set new fee percentage", async function () {
      await expect(
        executor.connect(addr1).setFeePercentage(200)
      ).to.be.revertedWithCustomError(executor, "OwnableUnauthorizedAccount");
    });
  });
});
