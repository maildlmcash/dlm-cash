import { ethers } from 'ethers';
import { prisma } from '../lib/prisma';
import axios from 'axios';

// Network configurations
interface NetworkConfig {
  name: string;
  rpcUrl: string;
  explorerApiUrl: string;
  explorerApiKey?: string;
  tokenAddress: string;
  tokenDecimals: number;
  chainId: number;
  apiVersion?: 'v1' | 'v2'; // V1 for Sepolia, V2 for Ethereum mainnet
}

const NETWORKS: Record<string, NetworkConfig> = {
  sepolia: {
    name: 'Sepolia',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
    explorerApiUrl: 'https://api.etherscan.io/v2/api',
    explorerApiKey: process.env.ETHERSCAN_API_KEY || '', // Sepolia works without key
    tokenAddress: '0x379D44df8fd761B888693764EE83e38Fe2fAD988',
    tokenDecimals: 18,
    chainId: 11155111,
    apiVersion: 'v2', // Sepolia uses V2
  },
  ethereum: {
    name: 'Ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://ethereum-rpc.publicnode.com',
    explorerApiUrl: 'https://api.etherscan.io/v2/api', // Updated to V2
    explorerApiKey: process.env.ETHERSCAN_API_KEY,
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    tokenDecimals: 6,
    chainId: 1,
    apiVersion: 'v2', // Ethereum uses V2
  },
  bsc: {
    name: 'BSC',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-rpc.publicnode.com',
    explorerApiUrl: 'https://api.bscscan.com/api',
    explorerApiKey: process.env.BSCSCAN_API_KEY,
    tokenAddress: '0x55d398326f99059fF775485246999027B3197955',
    tokenDecimals: 18,
    chainId: 56,
    apiVersion: 'v1', // BSC uses V1
  },
  polygon: {
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-bor-rpc.publicnode.com',
    explorerApiUrl: 'https://api.polygonscan.com/api',
    explorerApiKey: process.env.POLYGONSCAN_API_KEY,
    tokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    tokenDecimals: 6,
    chainId: 137,
    apiVersion: 'v1', // Polygon uses V1
  },
};

interface TransferEvent {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  tokenSymbol: string;
}

/**
 * Fetch ERC20 token transfer events for a specific address using block explorer API
 */
async function fetchTokenTransfersFromExplorer(
  walletAddress: string,
  networkKey: string,
  startBlock: number = 0
): Promise<TransferEvent[]> {
  const network = NETWORKS[networkKey];
  const apiVersion = network.apiVersion || 'v1';

  try {
    const params: any = {
      module: 'account',
      action: 'tokentx',
      address: walletAddress,
      contractaddress: network.tokenAddress,
      startblock: startBlock,
      endblock: 99999999,
      sort: 'asc',
    };

    // Add chainid for V2 API (Ethereum mainnet and Sepolia)
    if (apiVersion === 'v2') {
      params.chainid = network.chainId;
    }
    
    // Only add API key if available
    if (network.explorerApiKey) {
      params.apikey = network.explorerApiKey;
    }

    // Reduced logging for development - only log on errors
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      console.log(`\n🔗 Etherscan API Call for ${network.name} (${apiVersion.toUpperCase()}):`);
      console.log(`   URL: ${network.explorerApiUrl}`);
      console.log(`   Chain ID: ${network.chainId}`);
      console.log(`   Wallet: ${walletAddress}`);
      console.log(`   Token Contract: ${network.tokenAddress}`);
      console.log(`   API Version: ${apiVersion.toUpperCase()}`);
      if (network.explorerApiKey) {
        console.log(`   API Key: ${network.explorerApiKey?.substring(0, 10)}...`);
      }
    }

    const response = await axios.get(network.explorerApiUrl, {
      params,
      timeout: 15000
    });

    if (!isDev) {
      console.log(`📊 API Response Status: ${response.data.status}`);
      console.log(`📊 API Response Message: ${response.data.message}`);
    }
    
    // Handle both V1 (array) and V2 (object with transactions) response formats
    let transactions: any[] = [];
    
    if (apiVersion === 'v2' && response.data.result && response.data.result.transactions) {
      // V2 format: result.transactions is the array
      transactions = response.data.result.transactions;
      if (!isDev) console.log(`📊 V2 API - Transactions found: ${transactions.length}`);
    } else if (Array.isArray(response.data.result)) {
      // V1 format: result is directly an array
      transactions = response.data.result;
      if (!isDev) console.log(`📊 V1 API - Transactions found: ${transactions.length}`);
    } else if (response.data.result && typeof response.data.result === 'object') {
      // Check if result is an object with other possible array fields
      if (!isDev) console.log(`📊 Result structure:`, Object.keys(response.data.result));
    }

    if (!isDev && transactions.length > 0) {
      console.log(`📊 Total transactions found: ${transactions.length}`);
    }

    if (transactions.length > 0) {
      // Log all transactions first (only in production or when needed)
      if (!isDev) {
        console.log(`\n🔍 All token transactions:`);
        transactions.forEach((tx: any, i: number) => {
          console.log(`   ${i + 1}. Hash: ${tx.hash}`);
          console.log(`      From: ${tx.from}`);
          console.log(`      To: ${tx.to}`);
          console.log(`      Value: ${ethers.formatUnits(tx.value, Number(tx.tokenDecimal))} ${tx.tokenSymbol}`);
          console.log(`      Token: ${tx.contractAddress}`);
        });
      }

      // Filter only incoming transfers (where 'to' address is the wallet)
      const incomingTransfers = transactions.filter(
        (tx: any) => tx.to.toLowerCase() === walletAddress.toLowerCase()
      );

      // Only log if there are actual incoming transfers
      if (incomingTransfers.length > 0 || !isDev) {
        console.log(`\n📥 Found ${incomingTransfers.length} incoming transfers for ${walletAddress.slice(0, 10)}...`);
      }

      return incomingTransfers.map((tx: any) => ({
        txHash: tx.hash,
        from: tx.from,
        to: tx.to,
        amount: ethers.formatUnits(tx.value, Number(tx.tokenDecimal)),
        blockNumber: tx.blockNumber,
        blockTimestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        tokenSymbol: tx.tokenSymbol || 'USDT',
      }));
    }

    return [];
  } catch (error: any) {
    console.error(`❌ Error fetching ${network.name} transactions:`, error.message);
    if (error.response) {
      console.error(`   Response data:`, error.response.data);
    }
    return [];
  }
}

/**
 * Process and credit incoming token transfers
 */
async function processTransfer(
  transfer: TransferEvent,
  userId: string
): Promise<boolean> {
  try {
    // Check if transaction already exists
    const existing = await prisma.depositWalletTransaction.findUnique({
      where: { txHash: transfer.txHash },
    });

    if (existing) {
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev) console.log(`📋 Transaction ${transfer.txHash.slice(0, 10)}... already in DB (status: ${existing.status}, credited: ${existing.credited})`);

      // Remove pending transaction if exists
      await prisma.pendingDepositTransaction.updateMany({
        where: { txHash: transfer.txHash, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      });

      // If exists and not credited, only credit if status is CONFIRMED (not PENDING)
      if (!existing.credited) {
        if (existing.status === 'PENDING') {
          if (!isDev) console.log(`⏳ Transaction is PENDING admin approval - skipping auto-credit`);
          return false; // Skip - waiting for admin approval
        }

        // Status is CONFIRMED but not yet credited - credit it now
        console.log(`💳 Attempting to credit existing CONFIRMED transaction...`);
        await creditUserBalance(existing.id, userId, parseFloat(transfer.amount));
        return true; // Successfully credited
      }

      // Already credited - verify wallet balance is correct
      const wallet = await prisma.wallet.findFirst({
        where: { userId, type: 'USDT' },
      });

      if (wallet && !isDev) {
        console.log(`💰 Current USDT wallet balance: ${wallet.balance}`);
      }

      return false; // Already processed
    }

    // Create new transaction record
    const amount = parseFloat(transfer.amount);
    const AUTO_CREDIT_THRESHOLD = 100; // USDT threshold for automatic crediting
    
    // Determine if amount is above threshold requiring manual approval
    const requiresApproval = amount >= AUTO_CREDIT_THRESHOLD;
    
    const depositTx = await prisma.depositWalletTransaction.create({
      data: {
        userId,
        txHash: transfer.txHash,
        fromAddress: transfer.from,
        toAddress: transfer.to,
        amount: transfer.amount,
        tokenSymbol: transfer.tokenSymbol,
        blockNumber: BigInt(transfer.blockNumber),
        blockTimestamp: new Date(transfer.blockTimestamp),
        status: requiresApproval ? 'PENDING' : 'CONFIRMED',
        credited: false,
      },
    });

    // Remove/update pending transaction if exists
    await prisma.pendingDepositTransaction.updateMany({
      where: { txHash: transfer.txHash, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });

    // Only auto-credit if below threshold
    if (!requiresApproval) {
      await creditUserBalance(depositTx.id, userId, amount);
      console.log(`✅ Auto-credited ${transfer.amount} ${transfer.tokenSymbol} to user ${userId} (Tx: ${transfer.txHash.slice(0, 10)}...)`);
    } else {
      console.log(`⏳ Deposit of ${transfer.amount} ${transfer.tokenSymbol} requires admin approval (Tx: ${transfer.txHash.slice(0, 10)}...)`);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Error processing transfer ${transfer.txHash}:`, error.message);
    return false;
  }
}

/**
 * Credit user's USDT wallet balance (after deducting platform fee)
 */
export async function creditUserBalance(
  depositTxId: string,
  userId: string,
  amount: number
): Promise<void> {
  console.log(`💳 Processing ${amount} USDT deposit for user ${userId}...`);
  
  await prisma.$transaction(async (tx) => {
    // Get the deposit wallet transaction to retrieve the txHash
    const depositWalletTx = await tx.depositWalletTransaction.findUnique({
      where: { id: depositTxId },
    });

    if (!depositWalletTx) {
      throw new Error('Deposit wallet transaction not found');
    }

    // Fetch platform fee settings
    const depositFeeSetting = await tx.setting.findUnique({
      where: { key: 'platform_depositFeePercent' },
    });
    const depositFeePercent = depositFeeSetting ? parseFloat(JSON.parse(depositFeeSetting.value as string)) : 0;
    
    // Calculate platform fee and amount after fee
    const platformFee = (amount * depositFeePercent) / 100;
    const amountAfterFee = amount - platformFee;
    
    console.log(`💰 Amount: ${amount} USDT`);
    console.log(`💵 Platform Fee (${depositFeePercent}%): ${platformFee.toFixed(6)} USDT`);
    console.log(`✨ Amount to Credit: ${amountAfterFee.toFixed(6)} USDT`);

    // Get or create USDT wallet
    let wallet = await tx.wallet.findFirst({
      where: { userId, type: 'USDT' },
    });

    if (!wallet) {
      console.log(`📝 Creating new USDT wallet for user ${userId}`);
      wallet = await tx.wallet.create({
        data: {
          userId,
          type: 'USDT',
          balance: '0',
          pending: '0',
          currency: 'USDT',
        },
      });
    }

    const currentBalance = parseFloat(wallet.balance.toString());
    const newBalance = currentBalance + amountAfterFee;
    console.log(`💼 Updating balance: ${currentBalance.toFixed(6)} -> ${newBalance.toFixed(6)}`);

    // Update wallet balance (credit amount after fee)
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance.toFixed(18),
      },
    });

    // Create transaction record with blockchain txHash
    await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: parseFloat(amountAfterFee.toFixed(18)),
        currency: 'USDT',
        status: 'COMPLETED',
        txId: depositWalletTx.txHash,
        description: `Blockchain deposit credited (fee: ${platformFee.toFixed(6)} USDT)`,
      },
    });

    // Mark deposit wallet transaction as credited and store platform fee
    await tx.depositWalletTransaction.update({
      where: { id: depositTxId },
      data: {
        credited: true,
        creditedAt: new Date(),
        platformFee: platformFee.toFixed(18),
      },
    });
    
    console.log(`✅ Credited ${amountAfterFee.toFixed(6)} USDT to wallet (Platform Fee: ${platformFee.toFixed(6)} USDT)`);
  });
}

/**
 * Monitor deposits for a specific user across all active networks
 */
export async function monitorUserDeposits(userId: string, walletAddress: string): Promise<number> {
  let totalProcessed = 0;
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) console.log(`🔍 Checking deposits for user ${userId} at ${walletAddress.slice(0, 10)}...`);

  // Get active networks from database
  const dbNetworks = await prisma.networkConfig.findMany({
    where: {
      isActive: true,
      depositEnabled: true,
    },
  });

  // Get network keys to check (use DB if available, otherwise default to Sepolia)
  const networkKeys = dbNetworks.length > 0
    ? dbNetworks.map(n => n.network.toLowerCase())
    : ['sepolia']; // Default to Sepolia if no DB config

  if (!isDev) console.log(`🌐 Monitoring ${networkKeys.length} networks: ${networkKeys.join(', ')}`);

  // Check each active network
  for (const networkKey of networkKeys) {
    if (!NETWORKS[networkKey]) {
      if (!isDev) console.log(`⚠️ Network ${networkKey} not found in configuration, skipping...`);
      continue;
    }

    try {
      const transfers = await fetchTokenTransfersFromExplorer(walletAddress, networkKey, 0);

      if (transfers.length > 0) {
        console.log(`📊 ${NETWORKS[networkKey].name}: ${transfers.length} incoming transfers found`);

        // Calculate total amount received on this network
        let totalReceived = 0;
        for (const transfer of transfers) {
          totalReceived += parseFloat(transfer.amount);
          console.log(`\n🔄 [${NETWORKS[networkKey].name}] Processing: ${transfer.txHash.slice(0, 10)}... Amount: ${transfer.amount}`);
          const processed = await processTransfer(transfer, userId);
          if (processed) {
            totalProcessed++;
            console.log(`✅ Successfully processed and credited`);
          } else {
            if (!isDev) console.log(`⏭️ Skipped (already processed)`);
          }
        }

        console.log(`💰 Total received on ${NETWORKS[networkKey].name}: ${totalReceived.toFixed(4)} USDT`);
      }
    } catch (error: any) {
      console.error(`❌ Error monitoring ${NETWORKS[networkKey].name}:`, error.message);
      // Continue to next network instead of failing completely
    }
  }

  if (totalProcessed > 0) {
    console.log(`✅ Processed ${totalProcessed} new deposits across all networks`);
  }

  return totalProcessed;
}

/**
 * Monitor deposits for all users with deposit wallets
 */
export async function monitorAllDeposits(): Promise<void> {
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) console.log('🔄 Starting blockchain deposit monitoring...');

  try {
    // Get all users with deposit wallets
    const users = await prisma.user.findMany({
      where: {
        depositWalletAddress: { not: null },
      },
      select: {
        id: true,
        depositWalletAddress: true,
      },
    });

    if (!isDev) console.log(`📊 Monitoring ${users.length} deposit wallets...`);

    let totalProcessed = 0;
    for (const user of users) {
      if (user.depositWalletAddress) {
        const processed = await monitorUserDeposits(user.id, user.depositWalletAddress);
        totalProcessed += processed;
      }
    }

    // Only log if deposits were processed or in production
    if (totalProcessed > 0 || !isDev) {
      console.log(`✅ Blockchain monitoring completed. Processed ${totalProcessed} new deposits.`);
    }
  } catch (error: any) {
    console.error('❌ Error in blockchain monitoring:', error.message);
    throw error;
  }
}

/**
 * Get transaction details from blockchain explorer
 */
export async function getTransactionDetails(
  txHash: string,
  networkKey: string
): Promise<any> {
  const network = NETWORKS[networkKey];
  
  try {
    const params = {
      module: 'proxy',
      action: 'eth_getTransactionByHash',
      txhash: txHash,
      apikey: network.explorerApiKey || '',
    };

    const response = await axios.get(network.explorerApiUrl, { 
      params,
      timeout: 10000 
    });

    return response.data.result;
  } catch (error: any) {
    console.error(`❌ Error fetching transaction details:`, error.message);
    return null;
  }
}
