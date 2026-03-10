import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { withdrawFromPool } from '../utils/poolContractMultiChain';

export const createWithdrawalValidation = [
  body('amount').isNumeric().custom((value) => value > 0),
  body('currency').isIn(['INR', 'USDT']),
  body('method').isIn(['UPI', 'BANK', 'TRC20', 'ERC20', 'MANUAL']),
  body('destination').optional().trim(),
  body('walletType').optional().isIn(['INR', 'USDT', 'ROI', 'SALARY', 'BREAKDOWN']),
  body('withdrawalAddress').optional().trim().custom((value, { req }) => {
    if (req.body.currency === 'USDT' && value) {
      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
        throw new Error('Invalid Ethereum address format');
      }
    }
    return true;
  }),
  body('network').optional().trim(),
];

export const createWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, currency, method, destination, walletType: requestedWalletType, bankDetails, withdrawalAddress, network } = req.body;

    // Determine wallet type - if walletType is provided, use it; otherwise use currency
    let walletType: string;
    if (requestedWalletType) {
      walletType = requestedWalletType;
    } else {
      walletType = currency === 'INR' ? 'INR' : 'USDT';
    }

    // For ROI, SALARY, and BREAKDOWN wallets, currency should be INR
    if (['ROI', 'SALARY', 'BREAKDOWN'].includes(walletType)) {
      if (currency !== 'INR') {
        throw new AppError(`${walletType} wallet withdrawals must be in INR`, 400);
      }
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_type: {
          userId: req.user.id,
          type: walletType as any,
        },
      },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    if (wallet.locked) {
      throw new AppError('Wallet is locked', 403);
    }

    // For USDT withdrawals, validate network early
    if (currency === 'USDT') {
      if (!withdrawalAddress) {
        throw new AppError('Withdrawal address is required for USDT withdrawals', 400);
      }

      // Validate network parameter
      if (!network) {
        throw new AppError('Network selection is required for USDT withdrawals', 400);
      }

      // Verify network is enabled for withdrawals
      const networkConfig = await prisma.networkConfig.findUnique({
        where: { network: network.toUpperCase() },
      });
      
      if (!networkConfig || !networkConfig.isActive || !networkConfig.withdrawEnabled) {
        throw new AppError('Selected network is not available for withdrawals', 400);
      }
    }

    // Check KYC status - withdrawals require approved KYC
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { kycStatus: true },
    });

    if (user?.kycStatus !== 'APPROVED') {
      throw new AppError('KYC verification is required to make withdrawals. Please complete your KYC first.', 403);
    }

    const requestedAmount = Number(amount);
    const walletBalance = Number(wallet.balance);
    if (walletBalance < requestedAmount) {
      throw new AppError('Insufficient balance', 400);
    }

    // Get platform fee settings
    const withdrawalFeeSetting = await prisma.setting.findUnique({
      where: { key: 'platform_withdrawalFeePercent' },
    });

    const withdrawalFeePercent = withdrawalFeeSetting
      ? (typeof withdrawalFeeSetting.value === 'string'
          ? JSON.parse(withdrawalFeeSetting.value)
          : withdrawalFeeSetting.value)
      : 0;

    // Calculate platform fee - deduct from withdrawal amount
    const platformFee = (requestedAmount * Number(withdrawalFeePercent)) / 100;
    const amountAfterFee = requestedAmount - platformFee;

    // For BREAKDOWN wallet, check if timeline has passed
    if (walletType === 'BREAKDOWN') {
      // Get breakdown requests to check timeline
      const breakdownRequests = await prisma.refundRequest.findMany({
        where: {
          requestedBy: req.user.id,
          status: { in: ['PENDING', 'APPROVED'] },
        },
        include: {
          investment: true,
        },
      });

      // Get breakdown settings
      const refundTimelineSetting = await prisma.setting.findUnique({
        where: { key: 'breakdown_refundTimelineDays' },
      });

      const refundTimelineDays = refundTimelineSetting
        ? (typeof refundTimelineSetting.value === 'string'
            ? JSON.parse(refundTimelineSetting.value)
            : refundTimelineSetting.value)
        : 20;

      // Check if any breakdown request is still within timeline
      const now = new Date();
      for (const request of breakdownRequests) {
        const timelineEndDate = new Date(request.createdAt);
        timelineEndDate.setDate(timelineEndDate.getDate() + Number(refundTimelineDays));
        
        if (now < timelineEndDate) {
          throw new AppError(
            `Breakdown withdrawal is not available yet. Timeline ends on ${timelineEndDate.toLocaleDateString()}`,
            403
          );
        }
      }
    }

    // For USDT withdrawals, check threshold for auto-approval
    const USDT_AUTO_APPROVAL_THRESHOLD = 100;
    const isUsdtWithdrawal = currency === 'USDT';
    const requiresApproval = isUsdtWithdrawal && Number(amount) >= USDT_AUTO_APPROVAL_THRESHOLD;

    let txHash: string | null = null;
    let withdrawalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';

    // Auto-approve and process USDT withdrawals < 100 USDT
    if (isUsdtWithdrawal && !requiresApproval) {
      try {
        console.log(`🔄 Auto-processing USDT withdrawal of ${amountAfterFee} USDT on ${network} (after ${platformFee} fee)...`);
        const result = await withdrawFromPool(withdrawalAddress, amountAfterFee.toString(), network.toUpperCase());
        txHash = result.txHash;
        withdrawalStatus = 'APPROVED';
        console.log(`✅ USDT withdrawal auto-approved and processed on ${network}: ${txHash}`);
      } catch (error: any) {
        console.error('❌ USDT withdrawal failed:', error.message);
        throw new AppError(`Withdrawal failed: ${error.message}`, 500);
      }
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: req.user.id,
        amount,
        currency,
        method,
        walletType: walletType as any,
        destination: withdrawalAddress || destination,
        bankDetails: bankDetails ? JSON.stringify(bankDetails) : null,
        network: isUsdtWithdrawal ? network.toUpperCase() : null,
        status: withdrawalStatus,
        platformFee: platformFee.toFixed(18),
        txId: txHash,
        approvedAt: withdrawalStatus === 'APPROVED' ? new Date() : null,
      },
    });

    // Update wallet balance based on approval status
    if (withdrawalStatus === 'APPROVED') {
      // For auto-approved withdrawals, directly deduct from balance
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance.minus(requestedAmount).toFixed(18),
        },
      });

      // Create completed transaction
      await prisma.transaction.create({
        data: {
          userId: req.user.id,
          walletId: wallet.id,
          type: 'WITHDRAW',
          amount,
          currency,
          status: 'COMPLETED',
          txId: txHash || withdrawal.id,
          description: `USDT withdrawal to ${withdrawalAddress} (auto-approved)`,
        },
      });

      // Transaction ID / audit log: map blockchain txHash for reconciliation
      if (txHash) {
        await prisma.blockchainTransactionLog.create({
          data: {
            txHash,
            action: 'WITHDRAW_SEND',
            userId: req.user.id,
            amount: amountAfterFee.toFixed(18),
            currency: 'USDT',
            network: network?.toUpperCase() ?? undefined,
            relatedType: 'Withdrawal',
            relatedId: withdrawal.id,
          },
        });
      }
    } else {
      // For pending withdrawals, move to pending balance
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance.minus(requestedAmount).toFixed(18),
          pending: wallet.pending.plus(requestedAmount).toFixed(18),
        },
      });

      // Create pending transaction
      await prisma.transaction.create({
        data: {
          userId: req.user.id,
          walletId: wallet.id,
          type: 'WITHDRAW',
          amount,
          currency,
          status: 'PENDING',
          txId: withdrawal.id,
          description: `Withdrawal via ${method} (pending approval)`,
        },
      });
    }

    const message = withdrawalStatus === 'APPROVED'
      ? 'Withdrawal processed successfully'
      : requiresApproval
      ? 'Withdrawal request created. Amount >= 100 USDT requires admin approval.'
      : 'Withdrawal request created successfully';

    successResponse(res, withdrawal, message, 201);
  } catch (error) {
    next(error);
  }
};

export const getWithdrawals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user.id };
    if (status) where.status = status;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    paginatedResponse(
      res,
      withdrawals,
      Number(page),
      Number(limit),
      total,
      'Withdrawals retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getWithdrawalById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const withdrawal = await prisma.withdrawal.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404);
    }

    successResponse(res, withdrawal, 'Withdrawal retrieved successfully');
  } catch (error) {
    next(error);
  }
};
