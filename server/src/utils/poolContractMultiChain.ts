import { ethers } from 'ethers';
import { prisma } from '../lib/prisma';

// Default network configurations (same as controller)
const DEFAULT_NETWORKS = [
  {
    network: 'SEPOLIA',
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    tokenAddress: '0x379D44df8fd761B888693764EE83e38Fe2fAD988',
    poolAddress: '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79',
    tokenDecimals: 18,
    isActive: true,
    withdrawEnabled: true,
    depositEnabled: true,
  },
  {
    network: 'ETHEREUM',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    poolAddress: '0x0000000000000000000000000000000000000000',
    tokenDecimals: 6,
    isActive: false,
    withdrawEnabled: false,
    depositEnabled: false,
  },
  {
    network: 'BSC',
    name: 'Binance Smart Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    tokenAddress: '0x55d398326f99059fF775485246999027B3197955',
    poolAddress: '0x0000000000000000000000000000000000000000',
    tokenDecimals: 18,
    isActive: false,
    withdrawEnabled: false,
    depositEnabled: false,
  },
];

// Pool contract ABI for withdrawals
const POOL_ABI = [
  'function withdrawTo(address token, address to, uint256 amount) returns (bool)',
  'function getBalance(address token) view returns (uint256)',
];

/**
 * Get network config with merged defaults and DB status
 */
async function getNetworkConfig(networkKey: string) {
  const defaultNet = DEFAULT_NETWORKS.find(n => n.network === networkKey.toUpperCase());
  
  if (!defaultNet) {
    throw new Error(`Network ${networkKey} not found in configuration`);
  }

  // Get status overrides from database
  const dbNet = await prisma.networkConfig.findUnique({
    where: { network: networkKey.toUpperCase() },
  });

  // Merge defaults with DB status
  if (dbNet) {
    return {
      ...defaultNet,
      isActive: dbNet.isActive,
      withdrawEnabled: dbNet.withdrawEnabled,
      depositEnabled: dbNet.depositEnabled,
      explorerApiKey: dbNet.explorerApiKey || undefined,
    };
  }

  return defaultNet;
}

/**
 * Withdraw USDT from pool contract on specified network
 */
export async function withdrawFromPool(
  toAddress: string,
  amount: string,
  networkKey: string = 'SEPOLIA'
): Promise<{ txHash: string; network: string }> {
  console.log(`\n🔄 Initiating pool withdrawal on ${networkKey}...`);
  console.log(`   To: ${toAddress}`);
  console.log(`   Amount: ${amount} USDT`);

  try {
    // Get network configuration (merged defaults + DB status)
    const networkConfig = await getNetworkConfig(networkKey);

    if (!networkConfig.isActive) {
      throw new Error(`Network ${networkKey} is not active`);
    }

    if (!networkConfig.withdrawEnabled) {
      throw new Error(`Withdrawals are not enabled on ${networkKey}`);
    }

    console.log(`✅ Network Config: ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);
    console.log(`   RPC: ${networkConfig.rpcUrl}`);
    console.log(`   Token: ${networkConfig.tokenAddress}`);
    console.log(`   Pool: ${networkConfig.poolAddress}`);

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;

    if (!adminPrivateKey) {
      throw new Error('ADMIN_PRIVATE_KEY not configured');
    }

    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    console.log(`🔑 Admin wallet: ${adminWallet.address}`);

    // Convert amount to wei/smallest unit
    const amountInWei = ethers.parseUnits(amount, networkConfig.tokenDecimals);
    console.log(`💰 Amount in wei: ${amountInWei.toString()}`);

    // Create pool contract instance
    const poolContract = new ethers.Contract(
      networkConfig.poolAddress,
      POOL_ABI,
      adminWallet
    );

    // Check pool balance
    console.log(`📊 Checking pool balance...`);
    const poolBalance = await poolContract.getBalance(networkConfig.tokenAddress);
    const poolBalanceFormatted = ethers.formatUnits(poolBalance, networkConfig.tokenDecimals);
    console.log(`💎 Pool Balance: ${poolBalanceFormatted} USDT`);

    if (poolBalance < amountInWei) {
      throw new Error(`Insufficient pool balance. Available: ${poolBalanceFormatted} USDT`);
    }

    // Execute withdrawal from pool
    console.log(`🔄 Executing pool withdrawal...`);
    const tx = await poolContract.withdrawTo(
      networkConfig.tokenAddress,
      toAddress,
      amountInWei
    );

    console.log(`📝 Transaction sent: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);

    const receipt = await tx.wait();
    console.log(`✅ Confirmed in block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

    console.log(`\n🎉 Withdrawal successful!`);
    console.log(`   TX Hash: ${tx.hash}`);
    console.log(`   Network: ${networkConfig.name}`);
    console.log(`   Explorer: ${networkConfig.explorerUrl}/tx/${tx.hash}`);

    return {
      txHash: tx.hash,
      network: networkKey.toUpperCase(),
    };
  } catch (error: any) {
    console.error(`\n❌ Pool withdrawal failed on ${networkKey}:`);
    console.error(`   Error: ${error.message}`);
    if (error.transaction) {
      console.error(`   Transaction data:`, error.transaction);
    }
    throw new Error(`Pool withdrawal failed: ${error.message}`);
  }
}

/**
 * Get pool balance for a specific network
 */
export async function getPoolBalance(networkKey: string = 'SEPOLIA'): Promise<string> {
  const networkConfig = await getNetworkConfig(networkKey);

  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  const poolContract = new ethers.Contract(
    networkConfig.poolAddress,
    POOL_ABI,
    provider
  );

  const balance = await poolContract.getBalance(networkConfig.tokenAddress);
  return ethers.formatUnits(balance, networkConfig.tokenDecimals);
}

/**
 * Get pool balances for all active networks
 */
export async function getAllPoolBalances(): Promise<{ network: string; name: string; balance: string }[]> {
  // Get DB status overrides
  const dbNetworks = await prisma.networkConfig.findMany();
  const dbNetworkMap = new Map(dbNetworks.map(n => [n.network, n]));

  // Get active networks (merge defaults with DB)
  const activeNetworks = DEFAULT_NETWORKS
    .map(defaultNet => {
      const dbNet = dbNetworkMap.get(defaultNet.network);
      if (dbNet) {
        return {
          ...defaultNet,
          isActive: dbNet.isActive,
          withdrawEnabled: dbNet.withdrawEnabled,
          depositEnabled: dbNet.depositEnabled,
        };
      }
      return defaultNet;
    })
    .filter(net => net.isActive);

  const balances = await Promise.all(
    activeNetworks.map(async (network) => {
      try {
        const balance = await getPoolBalance(network.network);
        return {
          network: network.network,
          name: network.name,
          balance,
        };
      } catch (error) {
        console.error(`Error fetching balance for ${network.name}:`, error);
        return {
          network: network.network,
          name: network.name,
          balance: '0',
        };
      }
    })
  );

  return balances;
}
