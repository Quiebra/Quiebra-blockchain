// blockchain/contracts/MemecoinToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MemecoinToken
 * @dev Simple ERC-20 token for the Memecoin Launchpad.
 * This contract can be extended with bonding curve mechanics later.
 */
contract MemecoinToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, uint256 initialSupply)
        ERC20(name, symbol)
        Ownable(msg.sender) // The deployer is the owner
    {
        _mint(msg.sender, initialSupply); // Mint initial supply to the deployer
    }

    // Function to allow owner to mint more tokens (for testing/initial distribution)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Function to allow owner to burn tokens
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }
}