// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/* ========== ERC20 INTERFACE ========== */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/* ========== USDT POOL CONTRACT ========== */
contract USDTPool {
    address public owner;
    address public admin;
    address public immutable USDT;

    /* ========== EVENTS ========== */
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event USDTWithdrawn(address indexed to, uint256 amount);

    /* ========== MODIFIERS ========== */
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    /* ========== CONSTRUCTOR ========== */
    constructor(address _usdt, address _admin) {
        require(_usdt != address(0), "Invalid USDT");
        require(_admin != address(0), "Invalid admin");

        owner = msg.sender;
        admin = _admin;
        USDT = _usdt;
    }

    /* ========== ADMIN MANAGEMENT ========== */
    function setAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "Zero address");
        emit AdminUpdated(admin, newAdmin);
        admin = newAdmin;
    }

    /* ========== POOL BALANCE ========== */
    function poolBalance() external view returns (uint256) {
        return IERC20(USDT).balanceOf(address(this));
    }

    /* ========== WITHDRAWALS ========== */

    // Withdraw USDT to admin wallet
    function withdrawToAdmin(uint256 amount) external onlyAdmin {
        _withdraw(admin, amount);
    }

    // Withdraw USDT to any address (user payout)
    function withdrawTo(address to, uint256 amount) external onlyAdmin {
        require(to != address(0), "Zero address");
        _withdraw(to, amount);
    }

    /* ========== INTERNAL LOGIC ========== */
    function _withdraw(address to, uint256 amount) internal {
        require(amount > 0, "Zero amount");

        bool success = IERC20(USDT).transfer(to, amount);
        require(success, "USDT transfer failed");

        emit USDTWithdrawn(to, amount);
    }

    
}