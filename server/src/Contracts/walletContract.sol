// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract USDTPaymentGateway {
    address public owner;
    address public usdtTokenAddress;
    
    // Payment tracking
    mapping(bytes32 => Payment) public payments;
    mapping(address => bytes32[]) public userPayments;
    
    struct Payment {
        address payer;
        uint256 amount;
        uint256 timestamp;
        string orderId;
        PaymentStatus status;
    }
    
    enum PaymentStatus {
        Pending,
        Completed,
        Refunded
    }
    
    // Events for backend listening
    event PaymentReceived(
        bytes32 indexed paymentId,
        address indexed payer,
        uint256 amount,
        string orderId,
        uint256 timestamp
    );
    
    event PaymentConfirmed(
        bytes32 indexed paymentId,
        address indexed payer,
        uint256 amount
    );
    
    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed payer,
        uint256 amount
    );
    
    event Withdrawal(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor(address _usdtTokenAddress) {
        owner = msg.sender;
        usdtTokenAddress = _usdtTokenAddress;
    }
    
    /**
     * @dev Make a payment with USDT
     * @param amount Amount of USDT to pay (in smallest unit, e.g., 1000000 for 1 USDT with 6 decimals)
     * @param orderId Unique order identifier from your system
     */
    function makePayment(uint256 amount, string memory orderId) external returns (bytes32) {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(orderId).length > 0, "Order ID is required");
        
        // Generate unique payment ID
        bytes32 paymentId = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            orderId,
            block.timestamp,
            block.number
        ));
        
        require(payments[paymentId].payer == address(0), "Payment ID already exists");
        
        // Transfer USDT from user to contract
        IERC20 usdt = IERC20(usdtTokenAddress);
        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed"
        );
        
        // Store payment details
        payments[paymentId] = Payment({
            payer: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            orderId: orderId,
            status: PaymentStatus.Completed
        });
        
        userPayments[msg.sender].push(paymentId);
        
        // Emit event for backend notification
        emit PaymentReceived(
            paymentId,
            msg.sender,
            amount,
            orderId,
            block.timestamp
        );
        
        emit PaymentConfirmed(paymentId, msg.sender, amount);
        
        return paymentId;
    }
    
    /**
     * @dev Get payment details by payment ID
     */
    function getPayment(bytes32 paymentId) external view returns (
        address payer,
        uint256 amount,
        uint256 timestamp,
        string memory orderId,
        PaymentStatus status
    ) {
        Payment memory payment = payments[paymentId];
        require(payment.payer != address(0), "Payment not found");
        
        return (
            payment.payer,
            payment.amount,
            payment.timestamp,
            payment.orderId,
            payment.status
        );
    }
    
    /**
     * @dev Get all payment IDs for a user
     */
    function getUserPayments(address user) external view returns (bytes32[] memory) {
        return userPayments[user];
    }
    
    /**
     * @dev Refund a payment (only owner)
     */
    function refundPayment(bytes32 paymentId) external onlyOwner {
        Payment storage payment = payments[paymentId];
        require(payment.payer != address(0), "Payment not found");
        require(payment.status == PaymentStatus.Completed, "Payment not in completed status");
        
        payment.status = PaymentStatus.Refunded;
        
        IERC20 usdt = IERC20(usdtTokenAddress);
        require(
            usdt.transfer(payment.payer, payment.amount),
            "Refund transfer failed"
        );
        
        emit PaymentRefunded(paymentId, payment.payer, payment.amount);
    }
    
    /**
     * @dev Withdraw collected USDT (only owner)
     */
    function withdraw(uint256 amount) external onlyOwner {
        IERC20 usdt = IERC20(usdtTokenAddress);
        uint256 balance = usdt.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        
        require(usdt.transfer(owner, amount), "Withdrawal failed");
        
        emit Withdrawal(owner, amount, block.timestamp);
    }
    
    /**
     * @dev Get contract USDT balance
     */
    function getContractBalance() external view returns (uint256) {
        IERC20 usdt = IERC20(usdtTokenAddress);
        return usdt.balanceOf(address(this));
    }
    
    /**
     * @dev Update USDT token address (only owner)
     */
    function updateUSDTAddress(address _newUsdtAddress) external onlyOwner {
        require(_newUsdtAddress != address(0), "Invalid address");
        usdtTokenAddress = _newUsdtAddress;
    }
    
    /**
     * @dev Transfer ownership (only owner)
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}