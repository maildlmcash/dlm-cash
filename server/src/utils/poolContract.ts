import { ethers } from 'ethers';

// Configuration
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
const POOL_ADDRESS = process.env.POOL_CONTRACT_ADDRESS || '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY!;

// Pool Contract ABI
const POOL_ABI = [
  'function withdrawTo(address to, uint256 amount) external',
  'function withdrawToAdmin(uint256 amount) external',
  'function poolBalance() external view returns (uint256)',
  'function admin() external view returns (address)',
  'function USDT() external view returns (address)',
];

/**
 * Get pool balance on Sepolia
 */
export const getPoolBalance = async (): Promise<string> => {
  try {
    console.log('📊 Fetching pool balance...');
    console.log('RPC URL:', SEPOLIA_RPC_URL);
    console.log('Pool Address:', POOL_ADDRESS);
    
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const poolContract = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);
    
    console.log('📞 Calling poolBalance()...');
    const balance = await poolContract.poolBalance();
    const formattedBalance = ethers.formatUnits(balance, 6); // tUSDT has 6 decimals
    
    console.log(`💰 Pool balance: ${formattedBalance} tUSDT`);
    return formattedBalance;
  } catch (error: any) {
    console.error('❌ Error fetching pool balance:', error.message);
    console.error('Error details:', error);
    // Return 0 instead of throwing to prevent 500 errors
    return '0';
  }
};

/**
 * Withdraw USDT from pool to user address
 */
export const withdrawFromPool = async (
  toAddress: string,
  amount: string
): Promise<{ txHash: string; blockNumber: number }> => {
  try {
    console.log('🔄 Initiating pool withdrawal...');
    console.log('   To:', toAddress);
    console.log('   Amount:', amount, 'tUSDT');
    console.log('   RPC URL:', SEPOLIA_RPC_URL);
    console.log('   Pool Address:', POOL_ADDRESS);

    if (!ADMIN_PRIVATE_KEY) {
      throw new Error('Admin private key not configured');
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    console.log('   Admin wallet:', adminWallet.address);
    
    const poolContract = new ethers.Contract(POOL_ADDRESS, POOL_ABI, adminWallet);

    // Convert amount to token decimals (6 for tUSDT)
    const amountInWei = ethers.parseUnits(amount, 6);
    console.log('   Amount (raw):', amountInWei.toString());

    // Check pool balance
    console.log('📊 Checking pool balance...');
    const poolBalance = await poolContract.poolBalance();
    console.log('   Pool has:', ethers.formatUnits(poolBalance, 6), 'tUSDT');
    
    if (poolBalance < amountInWei) {
      throw new Error(`Insufficient pool balance. Pool has ${ethers.formatUnits(poolBalance, 6)} tUSDT, requested ${amount} tUSDT`);
    }

    // Call withdrawTo function
    console.log('📝 Sending transaction...');
    const tx = await poolContract.withdrawTo(toAddress, amountInWei);
    console.log('⏳ Waiting for confirmation... TX:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Withdrawal confirmed in block:', receipt.blockNumber);

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error: any) {
    console.error('❌ Pool withdrawal failed:', error.message);
    console.error('Error details:', error);
    throw new Error(`Withdrawal failed: ${error.message}`);
  }
};

/**
 * Get pool contract info
 */
export const getPoolInfo = async (): Promise<{
  address: string;
  admin: string;
  usdtAddress: string;
  balance: string;
}> => {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const poolContract = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

    const [admin, usdtAddress, balance] = await Promise.all([
      poolContract.admin(),
      poolContract.USDT(),
      poolContract.poolBalance(),
    ]);

    return {
      address: POOL_ADDRESS,
      admin,
      usdtAddress,
      balance: ethers.formatUnits(balance, 6),
    };
  } catch (error: any) {
    console.error('❌ Error fetching pool info:', error.message);
    throw error;
  }
};
