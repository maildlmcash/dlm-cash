import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { monitorAllDeposits } from '../utils/blockchainMonitor';
import { calculateDailyROI } from '../schedulers/jobs/roiCalculation';
import { calculateMonthlySalary } from '../schedulers/jobs/salaryCalculation';

// Helper function to calculate the end date based on number of payouts
const calculateEndDateForPayouts = (
  startDate: Date,
  frequency: string,
  durationTimes: number,
  frequencyDay?: number | null,
  frequencyDays?: any
): Date => {
  const start = new Date(startDate);
  let payoutsFound = 0;
  let currentDate = new Date(start);
  
  // For safety, don't search more than 3 years into the future
  const maxDate = new Date(start);
  maxDate.setFullYear(maxDate.getFullYear() + 3);
  
  if (frequency === 'DAILY') {
    // Parse selected days
    let selectedDays: number[] = [];
    if (frequencyDays) {
      if (Array.isArray(frequencyDays)) {
        selectedDays = frequencyDays.filter((d): d is number => 
          typeof d === 'number' && d >= 1 && d <= 7
        );
      } else if (typeof frequencyDays === 'string') {
        try {
          const parsed = JSON.parse(frequencyDays);
          if (Array.isArray(parsed)) {
            selectedDays = parsed.filter((d): d is number => 
              typeof d === 'number' && d >= 1 && d <= 7
            );
          }
        } catch (e) {
          selectedDays = [];
        }
      }
    }
    
    if (selectedDays.length === 0) {
      // If no days selected, default to all days
      selectedDays = [1, 2, 3, 4, 5, 6, 7];
    }
    
    // Find the date when the Nth payout will occur
    while (payoutsFound < durationTimes && currentDate <= maxDate) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 format
      
      if (selectedDays.includes(dayNumber)) {
        payoutsFound++;
        if (payoutsFound === durationTimes) {
          return currentDate;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (frequency === 'WEEKLY') {
    // Find the date when the Nth weekly payout will occur
    const targetDay = frequencyDay || 1; // Default to Monday if not set
    
    // Find the first occurrence of the target day
    while (currentDate <= maxDate) {
      const dayOfWeek = currentDate.getDay();
      const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
      
      if (dayNumber === targetDay) {
        payoutsFound++;
        if (payoutsFound === durationTimes) {
          return currentDate;
        }
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  } else if (frequency === 'MONTHLY') {
    // For monthly, find the date when the Nth monthly payout will occur
    const startDay = start.getDate();
    
    for (let i = 0; i < durationTimes; i++) {
      if (i > 0) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Handle cases where day doesn't exist in month (e.g., 31st in February)
        if (currentDate.getDate() !== startDay) {
          currentDate.setDate(0); // Set to last day of previous month
        }
      }
    }
    
    return currentDate;
  }
  
  // Fallback: return a date far in the future
  return maxDate;
};

// Admin Dashboard Stats
export const getDashboardStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalInvestments,
      totalDeposits,
      totalWithdrawals,
      pendingKyc,
      pendingDeposits,
      pendingWithdrawals,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.investment.count(),
      prisma.deposit.aggregate({ _sum: { amount: true } }),
      prisma.withdrawal.aggregate({ _sum: { amount: true } }),
      prisma.kycDocument.groupBy({ by: ['userId'], where: { status: 'PENDING' } }).then((g) => g.length),
      prisma.deposit.count({ where: { status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      investments: {
        total: totalInvestments,
      },
      deposits: {
        total: totalDeposits._sum.amount || '0',
        pending: pendingDeposits,
      },
      withdrawals: {
        total: totalWithdrawals._sum.amount || '0',
        pending: pendingWithdrawals,
      },
      kyc: {
        pending: pendingKyc,
      },
    };

    successResponse(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// User Management
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status, role, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      role: { not: 'ADMIN' } // Exclude admin users
    };
    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          kycStatus: true,
          referralCode: true,
          totalReferralCount: true,
          paidReferralCount: true,
          freeReferralCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    paginatedResponse(
      res,
      users,
      Number(page),
      Number(limit),
      total,
      'Users retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getUserDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallets: true,
        investments: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        kycDocuments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { passwordHash, ...userWithoutPassword } = user;

    successResponse(res, userWithoutPassword, 'User details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    successResponse(res, user, 'User status updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    successResponse(res, user, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
};

// KYC Management - one entry per user (with all their pending documents)
export const getPendingKyc = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Get distinct user IDs that have at least one PENDING KYC document
    const grouped = await prisma.kycDocument.groupBy({
      by: ['userId'],
      where: { status: 'PENDING' },
    });
    const total = grouped.length;
    const skip = (pageNum - 1) * limitNum;
    const pageUserIds = grouped.slice(skip, skip + limitNum).map((g) => g.userId);

    if (pageUserIds.length === 0) {
      paginatedResponse(res, [], pageNum, limitNum, total, 'Pending KYC retrieved successfully');
      return;
    }

    const [users, documents] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: pageUserIds } },
        select: { id: true, name: true, email: true, phone: true },
      }),
      prisma.kycDocument.findMany({
        where: { userId: { in: pageUserIds }, status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const docsByUser = new Map<string, typeof documents>();
    for (const doc of documents) {
      if (!docsByUser.has(doc.userId)) docsByUser.set(doc.userId, []);
      docsByUser.get(doc.userId)!.push(doc);
    }

    const data = pageUserIds.map((userId) => {
      const user = userMap.get(userId)!;
      const docs = docsByUser.get(userId) || [];
      return { user, documents: docs };
    });

    paginatedResponse(
      res,
      data,
      pageNum,
      limitNum,
      total,
      'Pending KYC retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const approveKyc = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const kycDocument = await prisma.kycDocument.findUnique({
      where: { id },
    });

    if (!kycDocument) {
      throw new AppError('KYC document not found', 404);
    }

    await prisma.$transaction(async (tx: any) => {
      // Update KYC document
      await tx.kycDocument.update({
        where: { id },
        data: {
          status: 'APPROVED',
          remarks,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        },
      });

      // Update user KYC status
      await tx.user.update({
        where: { id: kycDocument.userId },
        data: { kycStatus: 'APPROVED' },
      });
    });

    successResponse(res, null, 'KYC approved successfully');
  } catch (error) {
    next(error);
  }
};

export const rejectKyc = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const kycDocument = await prisma.kycDocument.findUnique({
      where: { id },
    });

    if (!kycDocument) {
      throw new AppError('KYC document not found', 404);
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.kycDocument.update({
        where: { id },
        data: {
          status: 'REJECTED',
          remarks,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: kycDocument.userId },
        data: { kycStatus: 'REJECTED' },
      });
    });

    successResponse(res, null, 'KYC rejected successfully');
  } catch (error) {
    next(error);
  }
};

// Approve all pending KYC documents for a user (one action per person)
export const approveUserKyc = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { remarks } = req.body;

    const pendingDocs = await prisma.kycDocument.findMany({
      where: { userId, status: 'PENDING' },
    });

    if (pendingDocs.length === 0) {
      throw new AppError('No pending KYC documents found for this user', 404);
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.kycDocument.updateMany({
        where: { userId, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          remarks: remarks || null,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { kycStatus: 'APPROVED' },
      });
    });

    successResponse(res, null, 'KYC approved successfully');
  } catch (error) {
    next(error);
  }
};

// Reject all pending KYC documents for a user (one action per person)
export const rejectUserKyc = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { remarks } = req.body;

    if (!remarks?.trim()) {
      throw new AppError('Remarks are required for rejection', 400);
    }

    const pendingDocs = await prisma.kycDocument.findMany({
      where: { userId, status: 'PENDING' },
    });

    if (pendingDocs.length === 0) {
      throw new AppError('No pending KYC documents found for this user', 404);
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.kycDocument.updateMany({
        where: { userId, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          remarks,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { kycStatus: 'REJECTED' },
      });
    });

    successResponse(res, null, 'KYC rejected successfully');
  } catch (error) {
    next(error);
  }
};

// Deposit Management
export const getPendingDeposits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where: { status: 'PENDING' },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          bankAccount: {
            select: {
              id: true,
              accountName: true,
              accountNumber: true,
              bankName: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.deposit.count({ where: { status: 'PENDING' } }),
    ]);

    paginatedResponse(
      res,
      deposits,
      Number(page),
      Number(limit),
      total,
      'Pending deposits retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getAllDeposits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status, userId, currency } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (currency) where.currency = currency;

    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          bankAccount: {
            select: {
              id: true,
              accountName: true,
              accountNumber: true,
              bankName: true,
            },
          },
        },
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

export const approveDeposit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deposit = await prisma.deposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      throw new AppError('Deposit not found', 404);
    }

    if (deposit.status !== 'PENDING') {
      throw new AppError('Deposit already processed', 400);
    }

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
    const depositAmount = Number(deposit.amount);
    const platformFee = (depositAmount * Number(depositFeePercent)) / 100;
    const amountAfterFee = depositAmount - platformFee;

    await prisma.$transaction(async (tx: any) => {
      // Update deposit status and store platform fee
      await tx.deposit.update({
        where: { id },
        data: {
          status: 'APPROVED',
          platformFee: platformFee.toFixed(18),
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
      });

      // Determine wallet type
      const walletType = deposit.currency === 'INR' ? 'INR' : 'USDT';

      // Credit user wallet with amount after fee
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId: deposit.userId,
            type: walletType,
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

      // Update transaction status
      await tx.transaction.updateMany({
        where: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          txId: deposit.id,
          status: 'PENDING',
        },
        data: {
          status: 'COMPLETED',
        },
      });
    });

    successResponse(res, null, 'Deposit approved successfully');
  } catch (error) {
    next(error);
  }
};

export const rejectDeposit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deposit = await prisma.deposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      throw new AppError('Deposit not found', 404);
    }

    if (deposit.status !== 'PENDING') {
      throw new AppError('Deposit already processed', 400);
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.deposit.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionCount: { increment: 1 },
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
      });

      await tx.transaction.updateMany({
        where: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          txId: deposit.id,
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
        },
      });
    });

    successResponse(res, null, 'Deposit rejected successfully');
  } catch (error) {
    next(error);
  }
};

// Withdrawal Management
export const getAllWithdrawals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status, userId, currency } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (currency) where.currency = currency;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
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

export const getPendingWithdrawals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { status: 'PENDING' },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    ]);

    paginatedResponse(
      res,
      withdrawals,
      Number(page),
      Number(limit),
      total,
      'Pending withdrawals retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getWithdrawalStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalAmountAgg,
      approvedAmountAgg,
    ] = await Promise.all([
      prisma.withdrawal.count(),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { status: 'APPROVED' } }),
      prisma.withdrawal.count({ where: { status: 'REJECTED' } }),
      prisma.withdrawal.aggregate({
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
    ]);

    const totalAmount = Number(totalAmountAgg._sum.amount || 0);
    const approvedAmount = Number(approvedAmountAgg._sum.amount || 0);

    successResponse(
      res,
      {
        totalCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalAmount,
        approvedAmount,
      },
      'Withdrawal statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const approveWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { txId } = req.body;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
    });

    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404);
    }

    if (withdrawal.status !== 'PENDING') {
      throw new AppError('Withdrawal already processed', 400);
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
    const withdrawalAmount = Number(withdrawal.amount);
    const platformFee = (withdrawalAmount * Number(withdrawalFeePercent)) / 100;
    const amountAfterFee = withdrawalAmount - platformFee;

    let blockchainTxHash = txId;

    // If USDT withdrawal, process through smart contract
    if (withdrawal.currency === 'USDT' && withdrawal.destination) {
      try {
        console.log(`\ud83d\udcc4 Processing USDT withdrawal approval for ${amountAfterFee} USDT (after ${platformFee} fee)...`);
        const { withdrawFromPool } = await import('../utils/poolContract');
        const result = await withdrawFromPool(
          withdrawal.destination,
          amountAfterFee.toString()
        );
        blockchainTxHash = result.txHash;
        console.log(`\u2705 USDT withdrawal processed: ${blockchainTxHash}`);      } catch (error: any) {
        console.error('\u274c USDT withdrawal failed:', error.message);
        throw new AppError(`Withdrawal processing failed: ${error.message}`, 500);
      }
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          platformFee: platformFee.toFixed(18),
          txId: blockchainTxHash,
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
      });

      // Update wallet pending balance
      const walletType = withdrawal.walletType || (withdrawal.currency === 'INR' ? 'INR' : 'USDT');
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId: withdrawal.userId,
            type: walletType as any,
          },
        },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            pending: (Number(wallet.pending) - Number(withdrawal.amount)).toFixed(18),
          },
        });
      }

      await tx.transaction.updateMany({
        where: {
          userId: withdrawal.userId,
          type: 'WITHDRAW',
          txId: withdrawal.id,
          status: 'PENDING',
        },
        data: {
          status: 'COMPLETED',
          txId: blockchainTxHash,
        },
      });

      if (blockchainTxHash && withdrawal.currency === 'USDT') {
        await tx.blockchainTransactionLog.create({
          data: {
            txHash: blockchainTxHash,
            action: 'WITHDRAW_SEND',
            userId: withdrawal.userId,
            amount: amountAfterFee.toFixed(18),
            currency: 'USDT',
            network: withdrawal.network ?? undefined,
            relatedType: 'Withdrawal',
            relatedId: withdrawal.id,
          },
        });
      }
    });

    successResponse(res, null, 'Withdrawal approved successfully');
  } catch (error) {
    next(error);
  }
};

export const rejectWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
    });

    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404);
    }

    if (withdrawal.status !== 'PENDING') {
      throw new AppError('Withdrawal already processed', 400);
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
      });

      // Return amount to wallet
      const walletType = withdrawal.walletType || (withdrawal.currency === 'INR' ? 'INR' : 'USDT');
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId: withdrawal.userId,
            type: walletType as any,
          },
        },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: (Number(wallet.balance) + Number(withdrawal.amount)).toFixed(18),
            pending: (Number(wallet.pending) - Number(withdrawal.amount)).toFixed(18),
          },
        });
      }

      await tx.transaction.updateMany({
        where: {
          userId: withdrawal.userId,
          type: 'WITHDRAW',
          txId: withdrawal.id,
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
        },
      });
    });

    successResponse(res, null, 'Withdrawal rejected successfully');
  } catch (error) {
    next(error);
  }
};

// Refund Request Management
export const getAllRefundRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;

    const [refundRequests, total] = await Promise.all([
      prisma.refundRequest.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          investment: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              plan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.refundRequest.count({ where }),
    ]);

    paginatedResponse(
      res,
      refundRequests,
      Number(page),
      Number(limit),
      total,
      'Refund requests retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const approveRefundRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        investment: true,
      },
    });

    if (!refundRequest) {
      throw new AppError('Refund request not found', 404);
    }

    if (refundRequest.status !== 'PENDING') {
      throw new AppError('Refund request already processed', 400);
    }

    // Process the refund approval
    await prisma.$transaction(async (tx: any) => {
      // Get the breakdown amount
      const refundAmount = Number(refundRequest.amount);
      const userId = refundRequest.investment?.userId || refundRequest.requestedBy;

      // Get breakdown wallet
      const breakdownWallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId,
            type: 'BREAKDOWN',
          },
        },
      });

      if (!breakdownWallet) {
        throw new AppError('User breakdown wallet not found', 404);
      }

      // Credit to breakdown wallet (this is when refunded amount actually appears in breakdown wallet)
      await tx.wallet.update({
        where: { id: breakdownWallet.id },
        data: {
          balance: (Number(breakdownWallet.balance) + refundAmount).toFixed(18),
        },
      });

      // Create transaction record for breakdown wallet credit

      // Create transaction record for breakdown wallet credit
      const txId = `RF${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await tx.transaction.create({
        data: {
          userId,
          walletId: breakdownWallet.id,
          type: 'REFUND',
          amount: refundAmount.toFixed(18),
          currency: 'USDT',
          status: 'COMPLETED',
          txId,
          description: `Breakdown refund approved - credited to breakdown wallet (can be redeemed to USDT)`,
        },
      });

      // Delete pending ROI transactions (not processed since breakdown was approved)
      await tx.transaction.deleteMany({
        where: {
          userId,
          status: 'PENDING',
          description: {
            contains: `Investment #${refundRequest.investmentId}`,
          },
        },
      });

      // Update refund request status
      await tx.refundRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          processedBy: req.user.id,
          processedAt: new Date(),
        },
      });

      // Mark investment as closed
      await tx.investment.update({
        where: { id: refundRequest.investmentId },
        data: {
          status: 'CLOSED',
        },
      });
    });

    successResponse(res, null, 'Refund request approved successfully');
  } catch (error) {
    next(error);
  }
};

export const rejectRefundRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id },
    });

    if (!refundRequest) {
      throw new AppError('Refund request not found', 404);
    }

    if (refundRequest.status !== 'PENDING') {
      throw new AppError('Refund request already processed', 400);
    }

    let processedCount = 0;
    
    await prisma.$transaction(async (tx: any) => {
      // Get user ID and investment ID
      const refundWithInvestment = await tx.refundRequest.findUnique({
        where: { id },
        include: {
          investment: true,
        },
      });

      if (!refundWithInvestment) {
        throw new AppError('Refund request not found', 404);
      }

      const userId = refundWithInvestment.investment?.userId || refundWithInvestment.requestedBy;
      const investmentId = refundWithInvestment.investmentId;

      // Process all pending ROI transactions
      const pendingTransactions = await tx.transaction.findMany({
        where: {
          userId,
          status: 'PENDING',
          description: {
            contains: `Investment #${investmentId}`,
          },
        },
      });

      // Also find pending ROI_BOOST transactions for referrer (if user has a referrer)
      let pendingBoostTransactions: any[] = [];
      const userWithReferrer = await tx.user.findUnique({
        where: { id: userId },
        select: { referredById: true },
      });

      if (userWithReferrer?.referredById) {
        pendingBoostTransactions = await tx.transaction.findMany({
          where: {
            userId: userWithReferrer.referredById,
            type: 'ROI_BOOST',
            status: 'PENDING',
            description: {
              contains: `Investment #${investmentId}`,
            },
          },
        });
      }

      processedCount = pendingTransactions.length + pendingBoostTransactions.length;

      // Get user's ROI wallet
      const roiWallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId,
            type: 'ROI',
          },
        },
      });

      if (!roiWallet) {
        throw new AppError('ROI wallet not found', 404);
      }

      // Credit all pending ROI to wallet
      let totalPendingROI = 0;
      for (const transaction of pendingTransactions) {
        totalPendingROI += Number(transaction.amount);
        
        // Update transaction status to COMPLETED
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
          },
        });
      }

      // Update ROI wallet balance if there were pending transactions
      if (totalPendingROI > 0) {
        await tx.wallet.update({
          where: { id: roiWallet.id },
          data: {
            balance: (Number(roiWallet.balance) + totalPendingROI).toFixed(18),
          },
        });
      }

      // Credit all pending ROI_BOOST to referrer's wallet
      if (pendingBoostTransactions.length > 0 && userWithReferrer?.referredById) {
        const referrerRoiWallet = await tx.wallet.findUnique({
          where: {
            userId_type: {
              userId: userWithReferrer.referredById,
              type: 'ROI',
            },
          },
        });

        if (!referrerRoiWallet) {
          throw new AppError('Referrer ROI wallet not found', 404);
        }

        let totalPendingBoost = 0;
        for (const transaction of pendingBoostTransactions) {
          totalPendingBoost += Number(transaction.amount);
          
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
            },
          });
        }

        if (totalPendingBoost > 0) {
          await tx.wallet.update({
            where: { id: referrerRoiWallet.id },
            data: {
              balance: (Number(referrerRoiWallet.balance) + totalPendingBoost).toFixed(18),
            },
          });
        }
      }

      // Restore investment status to ACTIVE
      await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: 'ACTIVE',
        },
      });

      // Update refund request
      await tx.refundRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminRemarks,
          processedBy: req.user.id,
          processedAt: new Date(),
        },
      });

      // Note: No need to deduct from breakdown wallet since we never credited it
      // Breakdown wallet is only credited when admin approves the request
    });

    successResponse(res, null, `Refund request rejected successfully. ${processedCount} pending ROI transactions have been processed.`);
  } catch (error) {
    next(error);
  }
};

// Get referral tree for a specific user (admin)
export const getUserReferralTree = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // User ID for whom to fetch the tree
    const { level = 2 } = req.query;

    const maxLevel = Math.min(Number(level), 2); // Max 2 levels

    async function getReferrals(userId: string, currentLevel: number, maxLevel: number): Promise<any[]> {
      if (currentLevel > maxLevel) {
        return [];
      }

      const directReferrals = await prisma.user.findMany({
        where: { referredById: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          referralCode: true,
          kycStatus: true,
          createdAt: true,
          totalReferralCount: true,
          paidReferralCount: true,
          freeReferralCount: true,
        },
      });

      const referralsWithChildren = await Promise.all(
        directReferrals.map(async (referral) => {
          // Check if user is paid (has investments)
          const hasInvestments = await prisma.investment.count({
            where: {
              userId: referral.id,
              status: { in: ['ACTIVE', 'COMPLETED'] },
            },
          });

          const children = await getReferrals(referral.id, currentLevel + 1, maxLevel);

          return {
            ...referral,
            level: currentLevel,
            isPaid: hasInvestments > 0,
            children,
          };
        })
      );

      return referralsWithChildren;
    }

    const tree = await getReferrals(id, 1, maxLevel);

    successResponse(res, { tree, level: maxLevel }, 'Referral tree retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get pending investment requests
export const getPendingInvestments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where: { status: 'PENDING' },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              amount: true,
            },
          },
          authKey: {
            select: {
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.investment.count({ where: { status: 'PENDING' } }),
    ]);

    paginatedResponse(
      res,
      investments,
      Number(page),
      Number(limit),
      total,
      'Pending investments retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Approve investment request
export const approveInvestment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: {
        plan: true,
        user: true,
        authKey: true,
      },
    });

    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    if (investment.status !== 'PENDING') {
      throw new AppError('Investment is not pending approval', 400);
    }

    if (!investment.plan) {
      throw new AppError('Plan not found for this investment', 404);
    }

    // Calculate dates
    const startDate = new Date();
    // Calculate end date based on when the last payout will occur
    const endDate = calculateEndDateForPayouts(
      startDate,
      investment.plan.frequency,
      investment.plan.durationTimes,
      investment.plan.frequencyDay,
      investment.plan.frequencyDays
    );

    const investmentAmount = Number(investment.amount);
    const breakdownAmt = Number(investment.breakdownAmt || 0);

    await prisma.$transaction(async (tx: any) => {
      // Update investment status and dates
      await tx.investment.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          startDate,
          endDate,
          adminRemarks,
        },
      });

      // For ADMIN_REQUEST and AUTH_KEY, handle payment
      if (investment.purchaseMethod === 'ADMIN_REQUEST' || investment.purchaseMethod === 'AUTH_KEY') {
        // Credit to breakdown wallet
        const breakdownWallet = await tx.wallet.findUnique({
          where: {
            userId_type: {
              userId: investment.userId,
              type: 'BREAKDOWN',
            },
          },
        });

        if (breakdownWallet) {
          await tx.wallet.update({
            where: { id: breakdownWallet.id },
            data: {
              balance: (Number(breakdownWallet.balance) + breakdownAmt).toFixed(18),
            },
          });
        }

        // Update transaction status
        if (investment.plan) {
          await tx.transaction.updateMany({
            where: {
              userId: investment.userId,
              type: 'PLAN_PURCHASE',
              status: 'PENDING',
              description: { contains: investment.plan.name },
            },
            data: {
              status: 'COMPLETED',
            },
          });
        }

        // Process referral income
        await processReferralIncomeForAdmin(tx, investment.userId, investment.plan, investmentAmount);
      }
    });

    successResponse(res, null, 'Investment approved successfully');
  } catch (error) {
    next(error);
  }
};

// Reject investment request
export const rejectInvestment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: {
        authKey: {
          select: {
            code: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    if (investment.status !== 'PENDING') {
      throw new AppError('Investment is not pending approval', 400);
    }

    await prisma.$transaction(async (tx: any) => {
      // Update investment status
      await tx.investment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminRemarks,
        },
      });

      // If Authentication Key was used, reactivate it
      if (investment.authKeyId && investment.authKey) {
        await tx.authKey.update({
          where: { id: investment.authKeyId },
          data: {
            status: 'ACTIVE',
            usedBy: null,
            usedAt: null,
          },
        });
      }

      // Update transaction status
      const planName = investment.plan?.name || '';
      if (planName) {
        await tx.transaction.updateMany({
          where: {
            userId: investment.userId,
            type: 'PLAN_PURCHASE',
            status: 'PENDING',
            description: { contains: planName },
          },
          data: {
            status: 'REJECTED',
          },
        });
      }
    });

    successResponse(res, null, 'Investment rejected successfully');
  } catch (error) {
    next(error);
  }
};

// Helper function for referral income (admin approval)
async function processReferralIncomeForAdmin(tx: any, userId: string, plan: any, amount: number) {
  // Check if this is the user's first investment
  const existingInvestments = await tx.investment.count({
    where: {
      userId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
    },
  });
  const isFirstInvestment = existingInvestments === 0;

  const currentUser = await tx.user.findUnique({
    where: { id: userId },
    select: { referredById: true },
  });

  // Only process direct referrer
  if (currentUser?.referredById) {
    const referrerId = currentUser.referredById;
    
    // Check if referrer is a paid user
    const referrerInvestmentsCount = await tx.investment.count({
      where: {
        userId: referrerId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    });
    const isReferrerPaid = referrerInvestmentsCount > 0;
    
    // Get direct referral income from plan
    const directReferralIncome = isReferrerPaid 
      ? Number(plan.paidDirectReferralIncome || 0)
      : Number(plan.freeDirectReferralIncome || 0);
    
    // Credit direct referral income if applicable
    if (directReferralIncome > 0) {
      const roiWallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId: referrerId,
            type: 'ROI',
          },
        },
      });

      if (roiWallet) {
        // Get referral (buyer) name for description
        const referralUser = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        
        const referralName = referralUser?.name || referralUser?.email || 'User';
        
        await tx.wallet.update({
          where: { id: roiWallet.id },
          data: {
            balance: (Number(roiWallet.balance) + directReferralIncome).toFixed(18),
          },
        });

        // Create transaction for direct referral income
        const refTxId = `DR${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await tx.transaction.create({
          data: {
            userId: referrerId,
            walletId: roiWallet.id,
            type: 'DIRECT_REFERRAL',
            amount: directReferralIncome.toFixed(18),
            currency: 'USDT',
            status: 'COMPLETED',
            txId: refTxId,
            description: `${isReferrerPaid ? 'Paid' : 'Free'} direct referral income from ${referralName}'s ${plan.name} plan purchase ($${amount.toFixed(2)} USDT)`,
          },
        });
      }
    }

    // Update referral count for referrer
    if (isFirstInvestment) {
      await tx.user.update({
        where: { id: referrerId },
        data: {
          freeReferralCount: { decrement: 1 },
          paidReferralCount: { increment: 1 },
        },
      });
    }
  }
}

// Get user login logs
export const getUserLoginLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.loginLog.count({ where: { userId: id } }),
    ]);

    paginatedResponse(
      res,
      logs,
      Number(page),
      Number(limit),
      total,
      'Login logs retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get user ROI logs
export const getUserRoiLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: id,
          type: 'ROI_CREDIT',
        },
        include: {
          wallet: {
            select: {
              type: true,
              currency: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.transaction.count({
        where: {
          userId: id,
          type: 'ROI_CREDIT',
        },
      }),
    ]);

    paginatedResponse(
      res,
      logs,
      Number(page),
      Number(limit),
      total,
      'ROI logs retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const monitorBlockchainDeposits = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await monitorAllDeposits();
    
    successResponse(
      res,
      { status: 'completed' },
      'Blockchain deposit monitoring completed successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const recalculateDepositBalances = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all deposit wallet transactions that are credited
    const depositTxs = await prisma.depositWalletTransaction.findMany({
      where: {
        credited: true,
      },
      include: {
        user: {
          include: {
            wallets: {
              where: { type: 'USDT' }
            }
          }
        }
      }
    });

    const userBalances: Record<string, number> = {};
    
    // Calculate expected balance for each user
    for (const tx of depositTxs) {
      if (!userBalances[tx.userId]) {
        userBalances[tx.userId] = 0;
      }
      userBalances[tx.userId] += parseFloat(tx.amount.toString());
    }

    console.log('📊 Expected balances:', userBalances);

    // Update each user's wallet to match expected balance
    const updates = [];
    for (const [userId, expectedBalance] of Object.entries(userBalances)) {
      const user = depositTxs.find(tx => tx.userId === userId)?.user;
      const wallet = user?.wallets[0];
      
      if (wallet) {
        const currentBalance = parseFloat(wallet.balance.toString());
        console.log(`User ${userId}: Current=${currentBalance}, Expected=${expectedBalance}`);
        
        if (currentBalance !== expectedBalance) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: expectedBalance.toString() }
          });
          updates.push({ userId, from: currentBalance, to: expectedBalance });
        }
      }
    }

    successResponse(
      res,
      { 
        totalDeposits: depositTxs.length,
        usersAffected: Object.keys(userBalances).length,
        balancesUpdated: updates.length,
        updates
      },
      'Deposit balances recalculated successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getPendingBlockchainDeposits = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const pendingDeposits = await prisma.depositWalletTransaction.findMany({
      where: {
        credited: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        blockTimestamp: 'desc'
      }
    });

    successResponse(
      res,
      { 
        deposits: pendingDeposits.map(tx => ({
          ...tx,
          blockNumber: tx.blockNumber.toString(),
          amount: tx.amount.toString(),
        })),
        count: pendingDeposits.length
      },
      'Pending blockchain deposits fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a PENDING blockchain deposit and credit user's USDT wallet.
 */
export const approveBlockchainDeposit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const depositTx = await prisma.depositWalletTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!depositTx) {
      throw new AppError('Deposit transaction not found', 404);
    }
    if (depositTx.credited) {
      throw new AppError('Deposit already credited', 400);
    }
    const { creditUserBalance } = await import('../utils/blockchainMonitor');
    await creditUserBalance(depositTx.id, depositTx.userId, parseFloat(depositTx.amount.toString()));
    await prisma.depositWalletTransaction.update({
      where: { id: transactionId },
      data: { status: 'CONFIRMED' },
    });
    successResponse(res, { transactionId }, 'Blockchain deposit approved and credited successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a PENDING blockchain deposit (no credit).
 */
export const rejectBlockchainDeposit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const depositTx = await prisma.depositWalletTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!depositTx) {
      throw new AppError('Deposit transaction not found', 404);
    }
    if (depositTx.credited) {
      throw new AppError('Cannot reject already credited deposit', 400);
    }
    await prisma.depositWalletTransaction.update({
      where: { id: transactionId },
      data: { status: 'REJECTED' },
    });
    successResponse(res, { transactionId }, 'Blockchain deposit rejected successfully');
  } catch (error) {
    next(error);
  }
};

// Get all transactions with filtering and pagination
export const getAllTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      type, 
      status, 
      userId,
      dateFrom,
      dateTo,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Search by user email, name, or transaction ID
    if (search) {
      where.OR = [
        { id: { contains: search as string, mode: 'insensitive' } },
        { txId: { contains: search as string, mode: 'insensitive' } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          wallet: {
            select: {
              type: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    paginatedResponse(res, transactions, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
};

// Manual CRON trigger endpoints for testing
export const triggerRoiCalculation = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    console.log('🧪 Manually triggering ROI calculation...');
    const result = await calculateDailyROI();
    
    return successResponse(
      res,
      result,
      `ROI calculation completed. Processed ${result.processed} investments.`
    );
  } catch (error) {
    console.error('❌ Manual ROI calculation failed:', error);
    next(error);
  }
};

export const triggerSalaryCalculation = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    console.log('🧪 Manually triggering Salary calculation...');
    const result = await calculateMonthlySalary();
    
    return successResponse(
      res,
      result,
      `Salary calculation completed. Processed ${result.processed} level completions.`
    );
  } catch (error) {
    console.error('❌ Manual Salary calculation failed:', error);
    next(error);
  }
};
