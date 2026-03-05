import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { withdrawFromPool } from '../utils/poolContract';
import { AppError } from '../middleware/errorHandler';

// Withdraw funds from pool
export const withdrawPoolFunds = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { address, amount, remarks } = req.body;
    const adminId = req.user?.userId;

    if (!address || !amount) {
      throw new AppError('Address and amount are required', 400);
    }

    if (!adminId) {
      throw new AppError('Unauthorized', 401);
    }

    // Validate address format (basic validation)
    if (!address.startsWith('0x') || address.length !== 42) {
      throw new AppError('Invalid Ethereum address', 400);
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new AppError('Invalid amount', 400);
    }

    // Create pending transaction record
    const transaction = await prisma.adminPoolTransaction.create({
      data: {
        type: 'WITHDRAW',
        amount: amountNum,
        address,
        adminId,
        adminRemarks: remarks || null,
        status: 'PENDING',
      },
    });

    try {
      // Call smart contract to withdraw
      const { txHash, blockNumber } = await withdrawFromPool(address, amount);

      // Update transaction with success
      await prisma.adminPoolTransaction.update({
        where: { id: transaction.id },
        data: {
          txHash,
          blockNumber,
          status: 'COMPLETED',
        },
      });

      successResponse(
        res,
        {
          transactionId: transaction.id,
          txHash,
          blockNumber,
        },
        'Withdrawal successful'
      );
    } catch (error: any) {
      // Update transaction with failure
      await prisma.adminPoolTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          adminRemarks: `${remarks || ''} | Error: ${error.message}`.trim(),
        },
      });

      throw new AppError(`Withdrawal failed: ${error.message}`, 500);
    }
  } catch (error) {
    next(error);
  }
};

// Record admin deposit (when admin adds funds to pool)
export const recordPoolDeposit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, txHash, remarks } = req.body;
    const adminId = req.user?.userId;

    if (!amount || !txHash) {
      throw new AppError('Amount and transaction hash are required', 400);
    }

    if (!adminId) {
      throw new AppError('Unauthorized', 401);
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new AppError('Invalid amount', 400);
    }

    // Create deposit record
    const transaction = await prisma.adminPoolTransaction.create({
      data: {
        type: 'DEPOSIT',
        amount: amountNum,
        txHash,
        adminId,
        adminRemarks: remarks || null,
        status: 'COMPLETED',
      },
    });

    successResponse(
      res,
      {
        transactionId: transaction.id,
        txHash,
      },
      'Deposit recorded successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get admin pool transactions with filters
export const getPoolTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.adminPoolTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.adminPoolTransaction.count({ where }),
    ]);

    // Get totals
    const withdrawalsTotal = await prisma.adminPoolTransaction.aggregate({
      where: {
        type: 'WITHDRAW',
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const depositsTotal = await prisma.adminPoolTransaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    successResponse(
      res,
      {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        summary: {
          totalWithdrawals: Number(withdrawalsTotal._sum?.amount || 0),
          totalDeposits: Number(depositsTotal._sum?.amount || 0),
        },
      },
      'Pool transactions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};
