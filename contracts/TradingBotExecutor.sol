// blockchain/contracts/TradingBotExecutor.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

/**
 * @title TradingBotExecutor
 * @dev Placeholder contract for executing trades and collecting fees.
 * This contract would be called by the backend based on AI signals.
 * It needs to interact with DEXes (e.g., via router contracts).
 */
contract TradingBotExecutor is Ownable {
    using SafeERC20 for IERC20;
    address public feeRecipient; // Address to send collected fees
    uint256 public feePercentageBasisPoints; // 1-2% PnL, e.g., 100 for 1%
    address public router;
    mapping(address => bool) public supportedTokens;

    event TradeExecuted(address indexed trader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event FeesCollected(address indexed trader, uint256 amount);
    event RouterSet(address indexed newRouter);
    event TokenSupported(address indexed token, bool supported);

    constructor(address _feeRecipient, uint256 _feePercentageBasisPoints, address _router) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Fee recipient cannot be zero address");
        require(_feePercentageBasisPoints <= 10000, "Fee percentage cannot exceed 100%"); // 10000 basis points = 100%
        require(_router != address(0), "Router cannot be zero address");
        feeRecipient = _feeRecipient;
        feePercentageBasisPoints = _feePercentageBasisPoints;
        router = _router;
    }

    /**
     * @dev Executes a trade based on signals from the off-chain bot.
     * This is a simplified placeholder. Real implementation would involve
     * interacting with a DEX router (e.g., Uniswap V2/V3 compatible).
     * @param tokenIn Address of the token to sell.
     * @param tokenOut Address of the token to buy.
     * @param amountIn Amount of tokenIn to sell.
     * @param minAmountOut Minimum amount of tokenOut expected.
     * @param path Array of token addresses for the trade path (e.g., [tokenIn, WETH, tokenOut]).
     * @param deadline Timestamp by which the trade must be executed.
     */
    function executeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] calldata path,
        uint256 deadline
    ) public onlyOwner { // Only owner (backend) can call this for now
        require(router != address(0), "Router not set");
        require(supportedTokens[tokenIn] && supportedTokens[tokenOut], "Token not supported");
        IERC20 token = IERC20(tokenIn);
        token.forceApprove(router, 0);
        token.forceApprove(router, amountIn);
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        IUniswapV2Router(router).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            address(this),
            deadline
        );
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        uint256 actualAmountOut = balanceAfter - balanceBefore;
        uint256 fees = (actualAmountOut * feePercentageBasisPoints) / 10000;
        if (fees > 0) {
            IERC20(tokenOut).safeTransfer(feeRecipient, fees);
            emit FeesCollected(msg.sender, fees);
        }
        emit TradeExecuted(msg.sender, tokenIn, tokenOut, amountIn, actualAmountOut);
    }

    // Function to update fee recipient (only by owner)
    function setFeeRecipient(address _newFeeRecipient) public onlyOwner {
        require(_newFeeRecipient != address(0), "New fee recipient cannot be zero address");
        feeRecipient = _newFeeRecipient;
    }

    // Function to update fee percentage (only by owner)
    function setFeePercentage(uint256 _newFeePercentageBasisPoints) public onlyOwner {
        require(_newFeePercentageBasisPoints <= 10000, "Fee percentage cannot exceed 100%");
        feePercentageBasisPoints = _newFeePercentageBasisPoints;
    }

    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "Router cannot be zero address");
        router = _router;
        emit RouterSet(_router);
    }

    function setSupportedToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenSupported(token, supported);
    }
}