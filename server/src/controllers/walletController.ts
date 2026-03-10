import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { monitorUserDeposits, processTransferByTxHash } from '../utils/blockchainMonitor';
import { getPoolBalance } from '../utils/poolContract';

export const getDepositWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        depositWalletAddress: true,
        depositWalletCreatedAt: true,
      },
    });

    if (!user || !user.depositWalletAddress) {
      throw new AppError('Deposit wallet not found', 404);
    }

    successResponse(res, {
      address: user.depositWalletAddress,
      createdAt: user.depositWalletCreatedAt,
    }, 'Deposit wallet retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getDepositTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      prisma.depositWalletTransaction.findMany({
        where: { userId: req.user.id },
        skip,
        take: Number(limit),
        orderBy: { blockTimestamp: 'desc' },
      }),
      prisma.depositWalletTransaction.count({ where: { userId: req.user.id } }),
    ]);

    // Convert BigInt to string for JSON serialization
    const serializedTransactions = transactions.map(tx => ({
      ...tx,
      blockNumber: tx.blockNumber.toString(),
      amount: tx.amount.toString(),
    }));

    paginatedResponse(
      res,
      serializedTransactions,
      Number(page),
      Number(limit),
      total,
      'Deposit transactions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getWallets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.user.id },
      orderBy: { type: 'asc' },
    });

    successResponse(res, wallets, 'Wallets retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getWalletByType = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_type: {
          userId: req.user.id,
          type: type as any,
        },
      },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    successResponse(res, wallet, 'Wallet retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user.id };
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    paginatedResponse(
      res,
      transactions,
      Number(page),
      Number(limit),
      total,
      'Transactions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    successResponse(res, transaction, 'Transaction retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const checkDeposits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        depositWalletAddress: true,
      },
    });

    if (!user || !user.depositWalletAddress) {
      throw new AppError('Deposit wallet not found', 404);
    }

    const txHash = req.body?.txHash as string | undefined;
    const network = (req.body?.network as string | undefined)?.toLowerCase() || 'sepolia';

    let processedCount = 0;

    // If client sent tx hash (e.g. right after confirmation), confirm via RPC first (no Etherscan delay)
    if (txHash && /^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      processedCount = await processTransferByTxHash(
        txHash,
        req.user.id,
        user.depositWalletAddress,
        network
      );
    }

    // Then run explorer-based scan for any other transfers
    if (processedCount === 0) {
      processedCount = await monitorUserDeposits(req.user.id, user.depositWalletAddress);
    }

    successResponse(
      res,
      { processed: processedCount },
      processedCount > 0 
        ? `Successfully processed ${processedCount} new deposits` 
        : 'No new deposits found'
    );
  } catch (error) {
    next(error);
  }
};

export const getPoolBalances = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('📊 Fetching pool balances for user...');
    
    let poolBalance = '0';
    try {
      poolBalance = await getPoolBalance();
    } catch (balanceError: any) {
      console.error('Error fetching pool balance:', balanceError.message);
      // Continue with 0 balance instead of failing
    }
    
    const balances = {
      sepolia: {
        network: 'Sepolia Testnet',
        balance: poolBalance,
        currency: 'tUSDT',
      },
      // Future networks can be added here
      // ethereum: { network: 'Ethereum', balance: '0', currency: 'USDT' },
      // bsc: { network: 'BSC', balance: '0', currency: 'USDT' },
      // polygon: { network: 'Polygon', balance: '0', currency: 'USDT' },
    };

    successResponse(res, balances, 'Pool balances retrieved successfully');
  } catch (error) {
    console.error('getPoolBalances error:', error);
    next(error);
  }
};

export const createPendingDeposit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { txHash, amount, network = 'SEPOLIA' } = req.body;

    if (!txHash || !amount) {
      throw new AppError('Transaction hash and amount are required', 400);
    }

    // Check if pending transaction already exists
    const existing = await prisma.pendingDepositTransaction.findUnique({
      where: { txHash },
    });

    if (existing) {
      successResponse(res, existing, 'Pending transaction already exists');
      return;
    }

    // Check if transaction already confirmed
    const confirmed = await prisma.depositWalletTransaction.findUnique({
      where: { txHash },
    });

    if (confirmed) {
      throw new AppError('Transaction already confirmed', 400);
    }

    // Create pending transaction with 4 minute expiry
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    const pendingTx = await prisma.pendingDepositTransaction.create({
      data: {
        userId: req.user.id,
        txHash,
        amount: amount.toString(),
        network,
        expiresAt,
      },
    });

    successResponse(res, pendingTx, 'Pending transaction created successfully');
  } catch (error) {
    next(error);
  }
};

export const getPendingDeposits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get active pending transactions (not expired and still pending)
    const pendingTxs = await prisma.pendingDepositTransaction.findMany({
      where: {
        userId: req.user.id,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, pendingTxs, 'Pending deposits retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const cleanupExpiredPendingDeposits = async () => {
  try {
    const result = await prisma.pendingDepositTransaction.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lte: new Date(), // Expired
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    console.log(`🧹 Cleaned up ${result.count} expired pending deposits`);
    return result.count;
  } catch (error: any) {
    console.error('❌ Error cleaning up pending deposits:', error.message);
    return 0;
  }
};

export const redeemToUSDT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fromWalletType, amount } = req.body;
    const userId = req.user.id;

    console.log('=== REDEEM REQUEST ===');
    console.log('From Wallet Type:', fromWalletType);
    console.log('Amount:', amount);
    console.log('User ID:', userId);

    // Validate wallet type
    const validWalletTypes = ['ROI', 'SALARY', 'BREAKDOWN'];
    if (!validWalletTypes.includes(fromWalletType)) {
      throw new AppError('Invalid wallet type for redemption', 400);
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw new AppError('Invalid amount', 400);
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      console.log('Starting transaction...');
      
      // Get source wallet
      const sourceWallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId,
            type: fromWalletType,
          },
        },
      });

      console.log('Source wallet:', sourceWallet);

      if (!sourceWallet) {
        throw new AppError(`${fromWalletType} wallet not found`, 404);
      }

      const sourceBalance = sourceWallet.balance.toNumber();
      console.log('Source balance:', sourceBalance);
      
      if (sourceBalance < amount) {
        throw new AppError('Insufficient balance', 400);
      }

      // Get or create USDT wallet
      let usdtWallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId,
            type: 'USDT',
          },
        },
      });

      if (!usdtWallet) {
        usdtWallet = await tx.wallet.create({
          data: {
            userId,
            type: 'USDT',
            balance: '0',
            currency: 'USDT',
          },
        });
      }

      // Update source wallet
      const updatedSourceWallet = await tx.wallet.update({
        where: { id: sourceWallet.id },
        data: {
          balance: (sourceBalance - amount).toFixed(18),
        },
      });

      // Update USDT wallet
      const updatedUsdtWallet = await tx.wallet.update({
        where: { id: usdtWallet.id },
        data: {
          balance: (usdtWallet.balance.toNumber() + amount).toFixed(18),
        },
      });

      // Create transaction records
      const description = `Redeemed from ${fromWalletType} wallet to USDT wallet`;

      // Debit transaction for source wallet
      const debitTransaction = await tx.transaction.create({
        data: {
          userId,
          walletId: sourceWallet.id,
          type: 'REDEEM_DEBIT' as any,
          amount: amount.toString(),
          currency: 'USDT',
          status: 'COMPLETED',
          description,
        },
      });

      // Credit transaction for USDT wallet
      const creditTransaction = await tx.transaction.create({
        data: {
          userId,
          walletId: usdtWallet.id,
          type: 'REDEEM_CREDIT' as any,
          amount: amount.toString(),
          currency: 'USDT',
          status: 'COMPLETED',
          description,
        },
      });

      return {
        sourceWallet: updatedSourceWallet,
        usdtWallet: updatedUsdtWallet,
        debitTransaction,
        creditTransaction,
      };
    });

    successResponse(
      res,
      {
        fromWallet: {
          type: fromWalletType,
          newBalance: result.sourceWallet.balance.toString(),
        },
        toWallet: {
          type: 'USDT',
          newBalance: result.usdtWallet.balance.toString(),
        },
        amount,
      },
      `Successfully redeemed ${amount} USDT from ${fromWalletType} wallet`
    );
  } catch (error) {
    console.error('=== REDEEM ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    next(error);
  }
};
