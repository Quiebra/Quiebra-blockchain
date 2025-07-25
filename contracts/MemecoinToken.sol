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
    address public immutable treasury;
    uint256 public immutable basePrice; // in wei per token
    uint256 public immutable slope;     // in wei per token per token (linear)
    uint8 public immutable curveType;   // 0 = linear, 1 = exponential (future)

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event TokensSold(address indexed seller, uint256 amount, uint256 revenue);

    constructor(
        string memory name,
        string memory symbol,
        address _treasury,
        uint256 _basePrice,
        uint256 _slope,
        uint8 _curveType
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(_treasury != address(0), "Treasury cannot be zero");
        treasury = _treasury;
        basePrice = _basePrice;
        slope = _slope;
        curveType = _curveType;
    }

    // Linear bonding curve: price = basePrice + slope * totalSupply
    function getCurrentPrice(uint256 supply) public view returns (uint256) {
        if (curveType == 0) {
            return basePrice + slope * supply / 1e18;
        } else {
            revert("Curve type not supported");
        }
    }

    function buyTokens(uint256 amount) external payable {
        require(amount > 0, "Amount must be > 0");
        uint256 supply = totalSupply();
        uint256 cost = 0;
        for (uint256 i = 0; i < amount; i += 1e18) {
            cost += getCurrentPrice(supply + i);
        }
        require(msg.value >= cost, "Insufficient ETH sent");
        _mint(msg.sender, amount);
        (bool sent, ) = treasury.call{value: cost}("");
        require(sent, "Treasury transfer failed");
        if (msg.value > cost) {
            (bool refund, ) = msg.sender.call{value: msg.value - cost}("");
            require(refund, "Refund failed");
        }
        emit TokensPurchased(msg.sender, amount, cost);
    }

    function sellTokens(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Not enough tokens");
        uint256 supply = totalSupply();
        uint256 revenue = 0;
        for (uint256 i = 0; i < amount; i += 1e18) {
            revenue += getCurrentPrice(supply - i);
        }
        _burn(msg.sender, amount);
        (bool sent, ) = msg.sender.call{value: revenue}("");
        require(sent, "ETH transfer failed");
        emit TokensSold(msg.sender, amount, revenue);
    }

    receive() external payable {}
}