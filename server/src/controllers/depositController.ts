import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const createDepositValidation = [
  body('amount').isNumeric().custom((value) => value > 0),
  body('currency').isIn(['INR', 'USDT']),
  body('method').isIn(['UPI', 'NEFT', 'IMPS', 'MANUAL', 'GATEWAY', 'MORALIS', 'BLOCKCHAIN']),
  body('paymentMethod').optional().isIn(['BANK', 'UPI']),
  body('txId').optional().trim(),
  body('bankAccountId').optional().isUUID().withMessage('Invalid bank account ID'),
  body('upiAccountId').optional().isUUID().withMessage('Invalid UPI account ID'),
  body('network').optional().trim(),
];

export const createDeposit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, currency, method, txId, paymentMethod, bankAccountId, upiAccountId, depositId, network } = req.body;
    // Store just the filename, not the full path
    const proofUrl = req.file?.filename || null;

    // Check if this is a retry (updating rejected deposit)
    let existingDeposit = null;
    if (depositId) {
      existingDeposit = await prisma.deposit.findFirst({
        where: {
          id: depositId,
          userId: req.user.id,
          status: 'REJECTED',
        },
      });

      if (!existingDeposit) {
        throw new AppError('Deposit not found or cannot be retried', 404);
      }

      if (existingDeposit.rejectionCount >= 2) {
        throw new AppError('Maximum retry limit reached. This deposit cannot be resubmitted.', 400);
      }
    }

    const depositAmount = Number(amount);

    // For INR deposits, require either bank account or UPI account
    if (currency === 'INR' && method === 'MANUAL') {
      if (!paymentMethod || !['BANK', 'UPI'].includes(paymentMethod)) {
        throw new AppError('Payment method (BANK or UPI) is required for INR deposits', 400);
      }

      if (paymentMethod === 'BANK') {
        if (!bankAccountId) {
          throw new AppError('Bank account is required for bank transfer deposits', 400);
        }

        // Verify bank account exists and is active
        const bankAccount = await prisma.bankAccount.findUnique({
          where: { id: bankAccountId },
        });

        if (!bankAccount) {
          throw new AppError('Bank account not found', 404);
        }

        if (!bankAccount.isActive) {
          throw new AppError('Selected bank account is not active', 400);
        }
      } else if (paymentMethod === 'UPI') {
        if (!upiAccountId) {
          throw new AppError('UPI account is required for UPI deposits', 400);
        }

        // Verify UPI account exists and is active
        const upiAccount = await prisma.upiAccount.findUnique({
          where: { id: upiAccountId },
        });

        if (!upiAccount) {
          throw new AppError('UPI account not found', 404);
        }

        if (!upiAccount.isActive) {
          throw new AppError('Selected UPI account is not active', 400);
        }

        // For UPI, require either txId or proof
        if (!txId && !proofUrl) {
          throw new AppError('Transaction ID or payment proof is required for UPI deposits', 400);
        }
      }

      // Get deposit threshold setting
      const thresholdSetting = await prisma.setting.findUnique({
        where: { key: 'deposit_autoCreditThreshold' },
      });

      const autoCreditThreshold = thresholdSetting
        ? (typeof thresholdSetting.value === 'string'
            ? JSON.parse(thresholdSetting.value)
            : thresholdSetting.value)
        : 0;

      // Check if amount is below threshold for auto-credit
      const shouldAutoCredit = depositAmount < Number(autoCreditThreshold);

      if (shouldAutoCredit) {
        // Get platform fee settings
        const depositFeeSetting = await prisma.setting.findUnique({
          where: { key: 'platform_depositFeePercent' },
        });

        const depositFeePercent = depositFeeSetting
          ? (typeof depositFeeSetting.value === 'string'
              ? JSON.parse(depositFeeSetting.value)
              : depositFeeSetting.value)
          : 0;

        // Calculate platform fee - deduct from deposit amount
        const platformFee = (depositAmount * Number(depositFeePercent)) / 100;
        const amountAfterFee = depositAmount - platformFee;

        // Auto-credit: Create deposit with APPROVED status and credit wallet immediately
        const deposit = await prisma.$transaction(async (tx: any) => {
          // Create deposit with APPROVED status
          const dep = await tx.deposit.create({
            data: {
              userId: req.user.id,
              amount: depositAmount.toFixed(18),
              currency,
              method,
              paymentMethod,
              bankAccountId: paymentMethod === 'BANK' ? bankAccountId : null,
              upiAccountId: paymentMethod === 'UPI' ? upiAccountId : null,
              txId: txId || null,
              proofUrl: proofUrl || null,
              network: network ? network.toUpperCase() : null,
              status: 'APPROVED',
              platformFee: platformFee.toFixed(18),
              approvedBy: 'SYSTEM',
              approvedAt: new Date(),
            },
          });

          // Credit user wallet with amount after fee
          const wallet = await tx.wallet.findUnique({
            where: {
              userId_type: {
                userId: req.user.id,
                type: 'INR',
              },
            },
          });

          if (wallet) {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: (Number(wallet.balance) + amountAfterFee).toFixed(18),
              },
            });
          }

          // Create completed transaction
          await tx.transaction.create({
            data: {
              userId: req.user.id,
              walletId: wallet?.id,
              type: 'DEPOSIT',
              amount: amountAfterFee.toFixed(18),
              currency,
              status: 'COMPLETED',
              txId: dep.id,
              description: `Deposit via ${method} (Auto-credited)`,
            },
          });

          return dep;
        });

        successResponse(res, deposit, 'Deposit auto-credited successfully', 201);
        return;
      } else {
        // Manual approval required: Require txId and proofUrl
        if (!txId || !proofUrl) {
          throw new AppError('Transaction ID and payment screenshot are required for deposits above threshold', 400);
        }
      }
    }

    // Create or update deposit with PENDING status (for manual approval or non-INR deposits)
    let deposit;
    if (existingDeposit) {
      // Update existing rejected deposit for retry
      deposit = await prisma.deposit.update({
        where: { id: existingDeposit.id },
        data: {
          amount: depositAmount.toFixed(18),
          paymentMethod: paymentMethod || null,
          bankAccountId: paymentMethod === 'BANK' ? (bankAccountId || null) : null,
          upiAccountId: paymentMethod === 'UPI' ? (upiAccountId || null) : null,
          txId: txId || null,
          proofUrl: proofUrl || null,
          status: 'PENDING',
          approvedBy: null,
          approvedAt: null,
        },
      });
    } else {
      // Create new deposit
      deposit = await prisma.deposit.create({
        data: {
          userId: req.user.id,
          amount: depositAmount.toFixed(18),
          currency,
          method,
          paymentMethod: paymentMethod || null,
          bankAccountId: paymentMethod === 'BANK' ? (bankAccountId || null) : null,
          upiAccountId: paymentMethod === 'UPI' ? (upiAccountId || null) : null,
          txId: txId || null,
          proofUrl: proofUrl || null,
          network: network ? network.toUpperCase() : null,
          status: 'PENDING',
        },
      });
    }

    // Create pending transaction (only for new deposits, not retries)
    if (!existingDeposit) {
      await prisma.transaction.create({
        data: {
          userId: req.user.id,
          type: 'DEPOSIT',
          amount: depositAmount.toFixed(18),
          currency,
          status: 'PENDING',
          txId: deposit.id,
          description: `Deposit via ${method}`,
        },
      });
    } else {
      // Update existing transaction for retry
      await prisma.transaction.updateMany({
        where: {
          userId: req.user.id,
          type: 'DEPOSIT',
          txId: deposit.id,
          status: 'REJECTED',
        },
        data: {
          status: 'PENDING',
          amount: depositAmount.toFixed(18),
        },
      });
    }

    const message = existingDeposit 
      ? 'Deposit resubmitted successfully. Waiting for admin approval.'
      : 'Deposit request created successfully';
    successResponse(res, deposit, message, existingDeposit ? 200 : 201);
  } catch (error) {
    next(error);
  }
};

export const getDeposits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user.id };
    if (status) where.status = status;

    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.deposit.count({ where }),
    ]);

    paginatedResponse(
      res,
      deposits,
      Number(page),
      Number(limit),
      total,
      'Deposits retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getDepositById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deposit = await prisma.deposit.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!deposit) {
      throw new AppError('Deposit not found', 404);
    }

    successResponse(res, deposit, 'Deposit retrieved successfully');
  } catch (error) {
    next(error);
  }
};
