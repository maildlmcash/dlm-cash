import { ethers } from 'ethers';
import { prisma } from '../../lib/prisma';
import { decryptPrivateKey, getUsdtBalance } from '../../utils/evmWallet';

// Configuration from environment
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
const TUSDT_ADDRESS = '0xf37b0D267B05b16eA490134487fc4FAc2e3eD2a6'; // tUSDT on Sepolia
const POOL_ADDRESS = '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79'; // Pool contract
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY!;

// Minimum balance to sweep (in USDT)
const MIN_SWEEP_AMOUNT = 0.01; // Avoid sweeping dust amounts

/**
 * Sweep funds from all deposit wallets to pool contract
 */
export const sweepDepositWallets = async () => {
  console.log('\n💰 ========== STARTING FUND SWEEPER ==========');
  console.log('🔧 Config:');
  console.log('   RPC URL:', SEPOLIA_RPC_URL);
  console.log('   tUSDT Address:', TUSDT_ADDRESS);
  console.log('   Pool Address:', POOL_ADDRESS);
  console.log('   Min Sweep Amount:', MIN_SWEEP_AMOUNT, 'USDT');

  try {
    console.log('🌐 Connecting to Sepolia RPC...');
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    console.log('✅ Connected! Admin wallet:', adminWallet.address);

    // Get all users with deposit wallets
    console.log('🔍 Querying database for users with deposit wallets...');
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
      console.log('⚠️ No deposit wallets found in database');
      console.log('💡 Users need to register and get deposit addresses first\n');
      return;
    }

    console.log(`📊 Found ${users.length} deposit wallets. Checking balances...`);

    let sweptCount = 0;
    let totalSwept = 0;

    for (const user of users) {
      try {
        const walletAddress = user.depositWalletAddress!;
        console.log(`\n� Checking user: ${user.email}`);
        console.log(`   Wallet: ${walletAddress}`);

        // Check USDT balance
        console.log(`   📊 Fetching tUSDT balance...`);
        const balance = await getUsdtBalance(walletAddress, TUSDT_ADDRESS, provider);
        const balanceNum = parseFloat(balance);
        console.log(`   💰 Balance: ${balance} tUSDT`);

        if (balanceNum < MIN_SWEEP_AMOUNT) {
          console.log(`   ⏭️ Skipping - balance below minimum (${MIN_SWEEP_AMOUNT} USDT)`);
          continue; // Skip if balance too low
        }

        console.log(`   ✨ SWEEPABLE BALANCE FOUND: ${balanceNum} tUSDT`);

        // Decrypt private key
        console.log(`   🔐 Decrypting private key...`);
        const privateKey = decryptPrivateKey(user.depositWalletPrivateKey!);
        const depositWallet = new ethers.Wallet(privateKey, provider);
        console.log(`   ✅ Private key decrypted`);

        // Check if wallet has enough ETH for gas
        console.log(`   ⛽ Checking ETH balance for gas...`);
        const ethBalance = await provider.getBalance(walletAddress);
        const ethBalanceFormatted = ethers.formatEther(ethBalance);
        console.log(`   💎 ETH Balance: ${ethBalanceFormatted} ETH`);
        const gasEstimate = ethers.parseEther('0.001'); // ~0.001 ETH should be enough

        // If not enough gas, send ETH from admin wallet
        if (ethBalance < gasEstimate) {
          console.log(`   🚨 Insufficient gas! Sending 0.001 ETH from admin wallet...`);
          const gasTx = await adminWallet.sendTransaction({
            to: walletAddress,
            value: gasEstimate,
          });
          console.log(`   ⏳ Waiting for gas transaction...`);
          await gasTx.wait();
          console.log(`   ✅ Gas sent: ${gasTx.hash}`);
        } else {
          console.log(`   ✅ Sufficient gas available`);
        }

        // Transfer USDT to pool contract
        const erc20Abi = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function balanceOf(address owner) view returns (uint256)',
        ];

        const tokenContract = new ethers.Contract(TUSDT_ADDRESS, erc20Abi, depositWallet);
        const amountInWei = ethers.parseUnits(balance, 6); // tUSDT has 6 decimals

        console.log(`   🔄 Initiating transfer of ${balance} tUSDT to pool...`);
        console.log(`      From: ${walletAddress}`);
        console.log(`      To: ${POOL_ADDRESS}`);
        console.log(`      Amount: ${amountInWei.toString()} (raw)`);
        const gasLimit = Number(process.env.ERC20_TRANSFER_GAS_LIMIT) || 100_000;
        const tx = await tokenContract.transfer(POOL_ADDRESS, amountInWei, {
          gasLimit,
        });
        console.log(`   📝 Transaction sent: ${tx.hash}`);
        console.log(`   ⏳ Waiting for confirmation...`);
        const receipt = await tx.wait();
        console.log(`   ✅ Confirmed in block: ${receipt.blockNumber}`);

        console.log(`   🎉 SWEPT ${balance} tUSDT | TX: ${tx.hash}`);

        sweptCount++;
        totalSwept += balanceNum;

        // Optional: Log sweep transaction in database
        await prisma.depositWalletTransaction.create({
          data: {
            userId: user.id,
            txHash: tx.hash,
            fromAddress: walletAddress,
            toAddress: POOL_ADDRESS,
            amount: balance,
            tokenAddress: TUSDT_ADDRESS,
            network: 'SEPOLIA',
            blockNumber: BigInt(receipt.blockNumber),
            blockTimestamp: new Date(),
            status: 'SWEPT',
            credited: true, // Already moved to pool
          },
        });

      } catch (error: any) {
        console.error(`❌ Error sweeping wallet ${user.depositWalletAddress}:`, error.message);
      }
    }

    console.log('\n📊 ========== SWEEP SUMMARY ==========');
    if (sweptCount > 0) {
      console.log(`✅ Successfully swept ${sweptCount} wallet(s)`);
      console.log(`💰 Total amount: ${totalSwept.toFixed(6)} tUSDT`);
      console.log(`🏦 Pool contract: ${POOL_ADDRESS}`);
    } else {
      console.log('ℹ️ No funds to sweep (all balances below minimum)');
    }
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ ========== FUND SWEEPER ERROR ==========');
    console.error('Error details:', error);
    console.error('=========================================\n');
    throw error;
  }
};
