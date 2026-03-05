import { ethers } from 'ethers';
import { prisma } from '../../lib/prisma';
import { decryptPrivateKey, getUsdtBalance } from '../../utils/evmWallet';

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

// Minimum balance to sweep (in USDT)
const MIN_SWEEP_AMOUNT = 0.01;

/**
 * Get all active networks with merged defaults and DB status
 */
async function getActiveNetworks() {
  // Get DB status overrides
  const dbNetworks = await prisma.networkConfig.findMany();
  const dbNetworkMap = new Map(dbNetworks.map(n => [n.network, n]));

  // Get active networks (merge defaults with DB)
  return DEFAULT_NETWORKS
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
}

/**
 * Sweep funds from all deposit wallets to pool contract across all active networks
 */
export const sweepDepositWalletsMultiChain = async () => {
  console.log('\n💰 ========== STARTING MULTI-CHAIN FUND SWEEPER ==========');

  try {
    // Get all active networks
    const activeNetworks = await getActiveNetworks();

    if (activeNetworks.length === 0) {
      console.log('⚠️ No active networks found');
      return;
    }

    console.log(`📊 Found ${activeNetworks.length} active network(s):`);
    activeNetworks.forEach((network, idx) => {
      console.log(`   ${idx + 1}. ${network.name} (${network.network})`);
    });

    // Get all users with deposit wallets
    const users = await prisma.user.findMany({
      where: {
        depositWalletAddress: { not: null },
        depositWalletPrivateKey: { not: null },
      },
      select: {
        id: true,
        email: true,
        depositWalletAddress: true,
        depositWalletPrivateKey: true,
      },
    });

    if (users.length === 0) {
      console.log('⚠️ No deposit wallets found');
      return;
    }

    console.log(`📊 Found ${users.length} deposit wallet(s)\n`);

    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('ADMIN_PRIVATE_KEY not configured');
    }

    let totalSweptCount = 0;
    let totalSweptAmount = 0;
    const sweptByNetwork: { [key: string]: { count: number; amount: number } } = {};

    // Sweep each network
    for (const network of activeNetworks) {
      console.log(`\n🌐 ========== ${network.name.toUpperCase()} ==========`);
      console.log(`   Chain ID: ${network.chainId}`);
      console.log(`   Token: ${network.tokenAddress}`);
      console.log(`   Pool: ${network.poolAddress}`);
      console.log(`   Min Sweep: ${MIN_SWEEP_AMOUNT} USDT\n`);

      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

      let networkSweptCount = 0;
      let networkSweptAmount = 0;

      // Check each user wallet on this network
      for (const user of users) {
        try {
          const walletAddress = user.depositWalletAddress!;
          
          // Check USDT balance
          const balance = await getUsdtBalance(walletAddress, network.tokenAddress, provider);
          const balanceNum = parseFloat(balance);

          if (balanceNum < MIN_SWEEP_AMOUNT) {
            continue; // Skip if balance too low
          }

          console.log(`💰 ${user.email}: ${balance} USDT`);

          // Decrypt private key
          const privateKey = decryptPrivateKey(user.depositWalletPrivateKey!);
          const depositWallet = new ethers.Wallet(privateKey, provider);

          // Check ETH/native token for gas
          const nativeBalance = await provider.getBalance(walletAddress);
          const gasEstimate = ethers.parseEther('0.001');

          // Send gas if needed and wait for confirmation
          if (nativeBalance < gasEstimate) {
            console.log(`   ⛽ Sending gas...`);
            try {
              const gasTx = await adminWallet.sendTransaction({
                to: walletAddress,
                value: gasEstimate,
              });
              console.log(`   ⏳ Waiting for gas transaction confirmation...`);
              await gasTx.wait();
              console.log(`   ✅ Gas sent and confirmed`);
              
              // Wait 3 seconds for balance to update
              await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (gasError: any) {
              console.error(`   ❌ Gas transaction failed: ${gasError.message}`);
              continue; // Skip this wallet
            }
          }

          // Transfer tokens to pool
          const erc20Abi = [
            'function transfer(address to, uint256 amount) returns (bool)',
          ];

          const tokenContract = new ethers.Contract(
            network.tokenAddress,
            erc20Abi,
            depositWallet
          );

          const amountInWei = ethers.parseUnits(balance, network.tokenDecimals);
          
          console.log(`   🔄 Sweeping to pool...`);
          try {
            const tx = await tokenContract.transfer(network.poolAddress, amountInWei);
            console.log(`   ⏳ Waiting for sweep transaction confirmation...`);
            const receipt = await tx.wait();
              console.log(`   ✅ Swept! TX: ${tx.hash.slice(0, 20)}...`);

            // Log to database
            await prisma.depositWalletTransaction.create({
              data: {
                userId: user.id,
                txHash: tx.hash,
                fromAddress: walletAddress,
                toAddress: network.poolAddress,
                amount: balance,
                tokenAddress: network.tokenAddress,
                tokenSymbol: 'USDT',
                network: network.network,
                blockNumber: BigInt(receipt.blockNumber),
                blockTimestamp: new Date(),
                status: 'SWEPT',
                credited: true,
              },
            });
          } catch (sweepError: any) {
            console.error(`   ❌ Sweep transaction failed: ${sweepError.message}`);
            continue; // Skip this wallet
          }

          networkSweptCount++;
          networkSweptAmount += balanceNum;
          totalSweptCount++;
          totalSweptAmount += balanceNum;

        } catch (error: any) {
          console.error(`   ❌ Error for ${user.email}: ${error.message}`);
        }
      }

      sweptByNetwork[network.name] = {
        count: networkSweptCount,
        amount: networkSweptAmount,
      };

      console.log(`\n📊 ${network.name} Summary:`);
      console.log(`   Wallets Swept: ${networkSweptCount}`);
      console.log(`   Total Amount: ${networkSweptAmount.toFixed(6)} USDT`);
    }

    // Final summary
    console.log('\n\n📊 ========== SWEEP SUMMARY ==========');
    console.log(`✅ Total Wallets Swept: ${totalSweptCount}`);
    console.log(`💰 Total Amount: ${totalSweptAmount.toFixed(6)} USDT`);
    console.log(`\nBy Network:`);
    Object.entries(sweptByNetwork).forEach(([network, data]) => {
      console.log(`   ${network}: ${data.count} wallet(s), ${data.amount.toFixed(6)} USDT`);
    });
    console.log('=========================================\n');

  } catch (error) {
    console.error('\n❌ ========== FUND SWEEPER ERROR ==========');
    console.error('Error details:', error);
    console.error('=========================================\n');
    throw error;
  }
};
