// blockchain/test/MemecoinToken.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MemecoinToken", function () {
  let MemecoinToken;
  let memecoin: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addrs: any;

  beforeEach(async function () {
    MemecoinToken = await ethers.getContractFactory("MemecoinToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    memecoin = await MemecoinToken.deploy("TestCoin", "TST", ethers.parseUnits("1000", 18));
    await memecoin.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await memecoin.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await memecoin.balanceOf(owner.address);
      expect(await memecoin.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have the correct name and symbol", async function () {
      expect(await memecoin.name()).to.equal("TestCoin");
      expect(await memecoin.symbol()).to.equal("TST");
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await memecoin.transfer(addr1.address, ethers.parseUnits("50", 18));
      expect(await memecoin.balanceOf(addr1.address)).to.equal(ethers.parseUnits("50", 18));

      // Transfer 50 tokens from addr1 to addr2
      await memecoin.connect(addr1).transfer(addr2.address, ethers.parseUnits("50", 18));
      expect(await memecoin.balanceOf(addr2.address)).to.equal(ethers.parseUnits("50", 18));
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await memecoin.balanceOf(owner.address);

      // Try to send 1001 tokens from owner (1000 initial supply)
      await expect(
        memecoin.connect(addr1).transfer(owner.address, ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(memecoin, "ERC20InsufficientBalance");

      // Owner balance shouldn't change
      expect(await memecoin.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting and Burning", function () {
    it("Should allow owner to mint tokens", async function () {
      const initialSupply = await memecoin.totalSupply();
      const mintAmount = ethers.parseUnits("200", 18);
      await memecoin.mint(owner.address, mintAmount);
      expect(await memecoin.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await memecoin.balanceOf(owner.address)).to.equal(initialSupply + mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("200", 18);
      await expect(
        memecoin.connect(addr1).mint(addr1.address, mintAmount)
      ).to.be.revertedWithCustomError(memecoin, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to burn tokens", async function () {
      const initialSupply = await memecoin.totalSupply();
      const burnAmount = ethers.parseUnits("100", 18);
      await memecoin.burn(burnAmount);
      expect(await memecoin.totalSupply()).to.equal(initialSupply - burnAmount);
      expect(await memecoin.balanceOf(owner.address)).to.equal(initialSupply - burnAmount);
    });
  });
});