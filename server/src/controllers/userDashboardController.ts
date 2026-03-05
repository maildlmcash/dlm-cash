import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// Get User Dashboard Stats
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    // Get user with wallets
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get all ACTIVE investments first
    const activeInvestmentsList = await prisma.investment.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    // Calculate ROI earned from ACTIVE investments only
    let totalROIFromActiveInvestments = 0;
    if (activeInvestmentsList.length > 0) {
      const activeInvestmentIds = activeInvestmentsList.map(inv => inv.id);
      
      // Get all ROI transactions from active investments
      const roiTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'ROI_CREDIT',
          status: 'COMPLETED',
          OR: activeInvestmentIds.map(invId => ({
            description: {
              contains: `Investment #${invId}`,
            },
          })),
        },
        select: {
          amount: true,
        },
      });

      // Sum up the ROI
      totalROIFromActiveInvestments = roiTransactions.reduce(
        (sum, tx) => sum + Number(tx.amount),
        0
      );
    }

    // Calculate total direct referral income
    const directReferralIncome = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'DIRECT_REFERRAL',
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const totalDirectReferralIncome = Number(directReferralIncome._sum.amount || 0);

    // Calculate other stats
    const [
      activeInvestments,
      totalInvestments,
      totalInvestedAmount,
      latestTransactions,
      unreadNotifications,
    ] = await Promise.all([
      // Active Investments count
      prisma.investment.count({
        where: {
          userId,
          status: 'ACTIVE',
        },
      }),

      // Total Investments count
      prisma.investment.count({
        where: { userId },
      }),

      // Total Invested Amount
      prisma.investment.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),

      // Latest Transactions (last 5)
      prisma.transaction.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          createdAt: true,
        },
      }),

      // Unread Notifications count
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    // Get wallet balances
    const inrWallet = user.wallets.find((w) => w.type === 'INR');
    const usdtWallet = user.wallets.find((w) => w.type === 'USDT');
    const roiWallet = user.wallets.find((w) => w.type === 'ROI');
    const salaryWallet = user.wallets.find((w) => w.type === 'SALARY');
    const breakdownWallet = user.wallets.find((w) => w.type === 'BREAKDOWN');

    // Calculate referral stats
    const referralStats = {
      total: user.totalReferralCount || 0,
      paid: user.paidReferralCount || 0,
      free: user.freeReferralCount || 0,
    };

    // Check if user has submitted any KYC documents
    const hasKycDocuments = await prisma.kycDocument.count({
      where: { userId },
    });

    // Determine actual KYC status - if no documents exist, consider it as NOT_SUBMITTED
    let actualKycStatus = user.kycStatus;
    if (!hasKycDocuments && user.kycStatus === 'PENDING') {
      actualKycStatus = 'NOT_SUBMITTED' as any; // We'll handle this on frontend
    }

    const stats = {
      wallets: {
        inr: {
          balance: inrWallet?.balance.toString() || '0',
          pending: inrWallet?.pending.toString() || '0',
        },
        usdt: {
          balance: usdtWallet?.balance.toString() || '0',
          pending: usdtWallet?.pending.toString() || '0',
        },
        roi: {
          balance: roiWallet?.balance.toString() || '0',
        },
        salary: {
          balance: salaryWallet?.balance.toString() || '0',
        },
        breakdown: {
          balance: breakdownWallet?.balance.toString() || '0',
        },
      },
      roi: {
        totalEarned: totalROIFromActiveInvestments.toFixed(18),
      },
      directReferralIncome: totalDirectReferralIncome.toFixed(18),
      investments: {
        active: activeInvestments,
        total: totalInvestments,
        totalInvested: totalInvestedAmount._sum.amount?.toString() || '0',
      },
      referrals: referralStats,
      latestTransactions,
      notifications: {
        unread: unreadNotifications,
      },
      kycStatus: actualKycStatus,
      hasKycDocuments,
    };

    successResponse(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get Referral Tree
export const getReferralTree = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { level = 2 } = req.query; // Default to 2 levels

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

    const tree = await getReferrals(userId, 1, maxLevel);

    successResponse(res, { tree, level: maxLevel }, 'Referral tree retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get Referral Income
export const getReferralIncome = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [referralIncomes, total] = await Promise.all([
      prisma.referralIncome.findMany({
        where: { toUserId: userId },
        skip,
        take: Number(limit),
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              referralCode: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referralIncome.count({
        where: { toUserId: userId },
      }),
    ]);

    // Calculate total referral income
    const totalIncome = await prisma.referralIncome.aggregate({
      where: { toUserId: userId },
      _sum: { amount: true },
    });

    successResponse(
      res,
      {
        incomes: referralIncomes,
        total: totalIncome._sum.amount?.toString() || '0',
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      'Referral income retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get ROI & Income Details
export const getROIIncome = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause for credits and debits
    let where: any = { userId };
    
    if (type === 'ROI') {
      // ROI: include ROI_CREDIT (credits) and WITHDRAW from ROI wallet
      where.OR = [
        { type: 'ROI_CREDIT' },
        { 
          type: 'WITHDRAW',
          wallet: { type: 'ROI' }
        }
      ];
    } else if (type === 'SALARY') {
      // SALARY: include SALARY_CREDIT (credits) and WITHDRAW from SALARY wallet
      where.OR = [
        { type: 'SALARY_CREDIT' },
        { 
          type: 'WITHDRAW',
          wallet: { type: 'SALARY' }
        }
      ];
    } else {
      // Default: show both ROI and SALARY transactions only
      where.OR = [
        { type: 'ROI_CREDIT' },
        { type: 'SALARY_CREDIT' },
        { 
          type: 'WITHDRAW',
          wallet: { type: { in: ['ROI', 'SALARY'] } }
        }
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          wallet: {
            select: {
              type: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate totals
    const [totalROI, totalSalary] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'ROI_CREDIT',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'SALARY_CREDIT',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
    ]);

    successResponse(
      res,
      {
        transactions,
        totals: {
          roi: totalROI._sum.amount?.toString() || '0',
          salary: totalSalary._sum.amount?.toString() || '0',
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      'ROI & Income retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get Currency Rate (INR/USDT)
export const getCurrencyRate = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get latest currency rate
    const rate = await prisma.currencyRate.findFirst({
      where: {
        pair: 'INR/USDT',
      },
      orderBy: { fetchedAt: 'desc' },
    });

    if (!rate) {
      // Return default rate if not found
      successResponse(
        res,
        {
          pair: 'INR/USDT',
          rate: '83.0', // Default rate
          source: 'default',
          fetchedAt: new Date(),
        },
        'Currency rate retrieved successfully'
      );
      return;
    }

    successResponse(
      res,
      {
        pair: rate.pair,
        rate: rate.rate.toString(),
        source: rate.source || 'unknown',
        fetchedAt: rate.fetchedAt,
      },
      'Currency rate retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get ROI Boost Income
export const getROIBoostIncome = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get minimum referrals setting
    const minReferralsSetting = await prisma.setting.findUnique({
      where: { key: 'min_referrals_for_boost' },
    });

    const minReferrals = minReferralsSetting
      ? (typeof minReferralsSetting.value === 'string' ? parseInt(minReferralsSetting.value) : Number(minReferralsSetting.value))
      : 0;

    // Get user's total referrals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalReferralCount: true,
      },
    });

    const isQualified = user ? user.totalReferralCount >= minReferrals : false;

    // Get boost transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'ROI_BOOST',
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({
        where: {
          userId,
          type: 'ROI_BOOST',
        },
      }),
    ]);

    // Calculate total boost earned
    const totalBoost = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'ROI_BOOST',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    // Get referrals with breakdown requests (boost stopped)
    const referralsWithBreakdown = await prisma.user.findMany({
      where: {
        referredById: userId,
        investments: {
          some: {
            status: 'BREAKDOWN_REQUESTED',
          },
        },
      },
      include: {
        investments: {
          where: {
            status: 'BREAKDOWN_REQUESTED',
          },
          include: {
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    successResponse(
      res,
      {
        isQualified,
        minReferralsRequired: minReferrals,
        currentReferralCount: user?.totalReferralCount || 0,
        totalBoostEarned: totalBoost._sum.amount?.toString() || '0',
        transactions,
        referralsWithBreakdown: referralsWithBreakdown.map(ref => ({
          userId: ref.id,
          name: ref.name,
          email: ref.email,
          investments: ref.investments.map(inv => ({
            id: inv.id,
            planName: inv.plan?.name,
            amount: inv.amount.toString(),
          })),
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      'ROI boost income retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getDirectReferralIncome = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get direct referral transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'DIRECT_REFERRAL',
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({
        where: {
          userId,
          type: 'DIRECT_REFERRAL',
        },
      }),
    ]);

    // Calculate total direct referral income
    const totalIncome = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'DIRECT_REFERRAL',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    successResponse(
      res,
      {
        totalDirectReferralIncome: totalIncome._sum.amount?.toString() || '0',
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      'Direct referral income retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getSalaryIncome = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get user's current salary level info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentSalaryLevel: true,
        currentLevelStartedAt: true,
        createdAt: true,
        freeReferralCount: true,
        paidReferralCount: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Determine if user is paid or free
    const investmentCount = await prisma.investment.count({
      where: {
        userId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    });
    const userIsPaid = investmentCount > 0;

    // Get appropriate salary config
    const config = await prisma.salaryConfig.findUnique({
      where: { userType: userIsPaid ? 'PAID' : 'FREE' },
      include: {
        levels: {
          orderBy: { levelOrder: 'asc' },
        },
      },
    });

    const currentLevel = user.currentSalaryLevel || 0;
    const currentLevelConfig = config?.levels.find((l) => l.levelOrder === currentLevel);
    const nextLevelConfig = config?.levels.find((l) => l.levelOrder === currentLevel + 1);

    // Calculate turnover since current level started
    let turnoverSinceLevelStart = 0;
    if (currentLevel > 0 && user.currentLevelStartedAt) {
      const { calculateUserTurnoverSinceDate } = await import('../utils/salaryCalculation');
      turnoverSinceLevelStart = await calculateUserTurnoverSinceDate(
        userId,
        new Date(user.currentLevelStartedAt)
      );
    }

    // Check if user meets basic referral requirements
    const meetsReferralReq = config
      ? user.freeReferralCount >= config.freeReferralCount ||
        user.paidReferralCount >= config.paidReferralCount
      : false;

    // Check if user exceeded qualification time limit (for users at level 0)
    let qualificationTimeExpired = false;
    let qualificationTimeRemainingHours = 0;
    if (currentLevel === 0 && config?.qualificationTimeLimitHours) {
      const hoursSinceSignup = (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);
      qualificationTimeExpired = hoursSinceSignup > config.qualificationTimeLimitHours && !meetsReferralReq;
      qualificationTimeRemainingHours = Math.max(0, config.qualificationTimeLimitHours - hoursSinceSignup);
    }

    // Calculate days remaining for current level
    let daysRemaining = null;
    let timelineExpired = false;
    if (currentLevel > 0 && currentLevelConfig && user.currentLevelStartedAt) {
      const daysSinceLevelStart =
        (new Date().getTime() - new Date(user.currentLevelStartedAt).getTime()) /
        (1000 * 60 * 60 * 24);
      daysRemaining = Math.max(0, currentLevelConfig.days - daysSinceLevelStart);
      timelineExpired = daysSinceLevelStart > currentLevelConfig.days;
    }

    // Get salary transaction history
    const [transactions, totalTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'SALARY_CREDIT',
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({
        where: {
          userId,
          type: 'SALARY_CREDIT',
        },
      }),
    ]);

    // Get salary logs
    const salaryLogs = await prisma.salaryLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate total salary credited
    const totalSalaryAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'SALARY_CREDIT',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const totalSalaryCredited = Number(totalSalaryAgg._sum.amount || 0);

    // Build response
    const response = {
      currentLevel: currentLevel || 0,
      levelStatus: qualificationTimeExpired ? 'DISQUALIFIED' : currentLevel === 0 ? 'NOT_STARTED' : timelineExpired ? 'TIMELINE_EXPIRED' : 'IN_PROGRESS',
      userType: userIsPaid ? 'PAID' : 'FREE',
      meetsReferralRequirement: meetsReferralReq,
      qualificationTimeExpired,
      qualificationTimeRemainingHours: Math.round(qualificationTimeRemainingHours * 10) / 10, // Round to 1 decimal
      
      // Current level info
      currentLevelInfo: currentLevelConfig
        ? {
            level: currentLevel,
            turnoverRequired: Number(currentLevelConfig.turnoverAmount),
            turnoverAchieved: turnoverSinceLevelStart,
            turnoverRemaining: Math.max(0, Number(currentLevelConfig.turnoverAmount) - turnoverSinceLevelStart),
            progressPercentage: Math.min(100, (turnoverSinceLevelStart / Number(currentLevelConfig.turnoverAmount)) * 100),
            salaryAmount: Number(currentLevelConfig.salaryIncomeAmount),
            timelineDays: currentLevelConfig.days,
            daysRemaining: daysRemaining !== null ? Math.ceil(daysRemaining) : null,
            timelineExpired,
            levelStartedAt: user.currentLevelStartedAt,
          }
        : null,
      
      // Next level info
      nextLevelInfo: nextLevelConfig
        ? {
            level: currentLevel + 1,
            turnoverRequired: Number(nextLevelConfig.turnoverAmount),
            salaryAmount: Number(nextLevelConfig.salaryIncomeAmount),
            timelineDays: nextLevelConfig.days,
          }
        : null,
      
      // Overall stats
      totalSalaryCredited,
      levelsCompleted: currentLevel > 0 ? currentLevel - 1 : 0,
      totalLevelsAvailable: config?.levels.length || 0,
      
      // Transaction history
      transactions,
      salaryLogs: salaryLogs.map((log) => ({
        id: log.id,
        level: log.level,
        amount: Number(log.amount),
        turnoverAchieved: Number(log.turnoverAchieved || 0),
        periodFrom: log.periodFrom,
        periodTo: log.periodTo,
        remarks: log.remarks,
        createdAt: log.createdAt,
      })),
      
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalTransactions,
        totalPages: Math.ceil(totalTransactions / Number(limit)),
      },

      // Config info for display
      qualificationTimeLimitHours: config?.qualificationTimeLimitHours || null,
      requiredReferrals: config
        ? {
            free: config.freeReferralCount,
            paid: config.paidReferralCount,
          }
        : null,
    };

    successResponse(res, response, 'Salary income data retrieved successfully');
  } catch (error) {
    next(error);
  }
};
