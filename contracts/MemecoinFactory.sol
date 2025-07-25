// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MemecoinToken.sol";

contract MemecoinFactory {
    event TokenCreated(address indexed creator, address token, string name, string symbol);

    address public immutable treasury;
    uint256 public immutable basePrice;
    uint256 public immutable slope;
    uint8 public immutable curveType;

    address[] public allTokens;

    constructor(address _treasury, uint256 _basePrice, uint256 _slope, uint8 _curveType) {
        require(_treasury != address(0), "Treasury cannot be zero");
        treasury = _treasury;
        basePrice = _basePrice;
        slope = _slope;
        curveType = _curveType;
    }

    function createMemecoin(string memory name, string memory symbol) external returns (address) {
        MemecoinToken token = new MemecoinToken(
            name,
            symbol,
            treasury,
            basePrice,
            slope,
            curveType
        );
        token.transferOwnership(msg.sender);
        allTokens.push(address(token));
        emit TokenCreated(msg.sender, address(token), name, symbol);
        return address(token);
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
} 