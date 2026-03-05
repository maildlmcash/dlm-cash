import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

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

export const getPlans = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' },
    });

    successResponse(res, plans, 'Plans retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    successResponse(res, plan, 'Plan retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createInvestmentValidation = [
  body('planId').isUUID(),
  body('amount').isNumeric().custom((value: any) => value > 0),
  body('purchaseMethod').isIn(['ADMIN_REQUEST', 'DIRECT_WALLET_INR', 'DIRECT_WALLET_USDT', 'AUTH_KEY']),
  body('authKeyCode').optional().trim(),
  body('walletType').optional().isIn(['INR', 'USDT']),
];

export const createInvestment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { planId, amount, purchaseMethod, authKeyCode } = req.body;

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new AppError('Invalid or inactive plan', 400);
    }

    // Check if user already has an investment in this plan
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        userId: req.user.id,
        planId: planId,
      },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    if (existingInvestment) {
      throw new AppError(`You have already purchased the "${existingInvestment.plan?.name || 'this'}" plan. Each plan can only be purchased once per user.`, 400);
    }

    const investmentAmount = Number(amount);

    // Validate investment amount matches plan amount
    if (investmentAmount !== Number(plan.amount)) {
      throw new AppError(`Investment amount must be exactly ${plan.amount}`, 400);
    }
 
    let authKeyId: string | undefined;
    let selectedWalletType = 'USDT';  // Changed from INR to USDT - all plans are in USDT

    // Handle different purchase methods
    if (purchaseMethod === 'AUTH_KEY') {
      if (!authKeyCode) {
        throw new AppError('Authentication Key code is required', 400);
      }

      // Find and validate Authentication Key
      const authKey = await prisma.authKey.findUnique({
        where: { code: authKeyCode.toUpperCase().trim() },
        include: { plan: true },
      });

      if (!authKey) {
        throw new AppError('Invalid Authentication Key code. Please check and try again.', 400);
      }

      // Check if Authentication Key is already redeemed/used
      if (authKey.usedBy) {
        throw new AppError('This Authentication Key has already been redeemed and cannot be used again.', 400);
      }

      // Check if Authentication Key is active
      if (authKey.status !== 'ACTIVE') {
        throw new AppError(`Authentication Key is ${authKey.status.toLowerCase()}. Please contact support.`, 400);
      }

      // Verify Authentication Key is for the selected plan
      if (authKey.planId !== planId) {
        throw new AppError(`This Authentication Key is not valid for the selected plan. This key is for "${authKey.plan.name}".`, 400);
      }

      authKeyId = authKey.id;
    } else if (purchaseMethod === 'DIRECT_WALLET_INR' || purchaseMethod === 'DIRECT_WALLET_USDT') {
      // Determine wallet type based on purchase method
      if (purchaseMethod === 'DIRECT_WALLET_INR') {
        selectedWalletType = 'INR';
      } else {
        selectedWalletType = 'USDT';
      }
      
      // For INR payments, calculate the INR amount using conversion rate
      let paymentAmount = investmentAmount; // Default to USDT amount
      
      if (purchaseMethod === 'DIRECT_WALLET_INR') {
        // Get currency conversion rate from currencyRate table (same as admin uses)
        const currencyRateRecord = await prisma.currencyRate.findFirst({
          where: {
            pair: 'INR/USDT',
          },
          orderBy: { fetchedAt: 'desc' },
        });
        
        const currencyRate = currencyRateRecord
          ? Number(currencyRateRecord.rate)
          : 83;
        
        // Convert USDT amount to INR
        paymentAmount = investmentAmount * currencyRate;
      }
      
      // Check wallet balance
      const wallet = await prisma.wallet.findUnique({
        where: {
          userId_type: {
            userId: req.user.id,
            type: selectedWalletType as any,
          },
        },
      });

      if (!wallet || Number(wallet.balance) < paymentAmount) {
        throw new AppError(`Insufficient balance in ${selectedWalletType} wallet. Required: ${paymentAmount.toFixed(2)}`, 400);
      }
    }
    // For ADMIN_REQUEST, no wallet check needed - admin will handle payment

    // Get refund timeline setting to store with investment
    const refundTimelineSetting = await prisma.setting.findUnique({
      where: { key: 'breakdown_refundTimelineDays' },
    });

    const refundTimelineDays = refundTimelineSetting
      ? (typeof refundTimelineSetting.value === 'string'
          ? JSON.parse(refundTimelineSetting.value)
          : refundTimelineSetting.value)
      : 30; // Default 30 days

    // Calculate breakdown (e.g., 80% goes to breakdown wallet)
    const deductionPct = 20;
    const breakdownPct = 80;
    const breakdownAmt = (investmentAmount * breakdownPct) / 100;

    // Calculate dates based on duration times and frequency (only for approved investments)
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    // Only calculate dates if investment will be immediately active (not for PENDING status)
    const willBeActive = purchaseMethod === 'DIRECT_WALLET_INR' || purchaseMethod === 'DIRECT_WALLET_USDT' || purchaseMethod === 'AUTH_KEY';
    
    if (willBeActive) {
      startDate = new Date();
      // Calculate end date based on when the last payout will occur
      endDate = calculateEndDateForPayouts(
        startDate,
        plan.frequency,
        plan.durationTimes,
        plan.frequencyDay,
        plan.frequencyDays
      );
    }

    // Determine investment status
    let investmentStatus: any = 'PENDING';
    if (purchaseMethod === 'DIRECT_WALLET_INR' || purchaseMethod === 'DIRECT_WALLET_USDT' || purchaseMethod === 'AUTH_KEY') {
      investmentStatus = 'ACTIVE'; // Direct wallet purchases and Authentication Key are immediately active
    } else {
      investmentStatus = 'PENDING'; // Admin request requires approval
    }

    // Create investment
    const investment = await prisma.$transaction(async (tx: any) => {
      // Mark Authentication Key as used if applicable
      if (authKeyId) {
        await tx.authKey.update({
          where: { id: authKeyId },
          data: {
            status: 'USED',
            usedBy: req.user.id,
            usedAt: new Date(),
          },
        });
      }

      // Create investment record
      const inv = await tx.investment.create({
        data: {
          userId: req.user.id,
          planId: plan.id,
          amount: investmentAmount.toFixed(18),
          breakdownAmt: breakdownAmt.toFixed(18),
          deductionPct,
          refundTimelineDays: Number(refundTimelineDays),
          startDate,
          endDate,
          status: investmentStatus,
          purchaseMethod: purchaseMethod as any,
          authKeyId,
        },
      });

      // For direct wallet purchases, deduct from wallet and credit breakdown wallet
      if (purchaseMethod === 'DIRECT_WALLET_INR' || purchaseMethod === 'DIRECT_WALLET_USDT') {
        // Calculate payment amount based on wallet type
        let paymentAmount = investmentAmount; // Default to USDT amount
        let transactionCurrency = 'USDT';
        
        if (purchaseMethod === 'DIRECT_WALLET_INR') {
          // Get currency conversion rate from currencyRate table (same as admin uses)
          const currencyRateRecord = await tx.currencyRate.findFirst({
            where: {
              pair: 'INR/USDT',
            },
            orderBy: { fetchedAt: 'desc' },
          });
          
          const currencyRate = currencyRateRecord
            ? Number(currencyRateRecord.rate)
            : 83;
          
          // Convert USDT amount to INR
          paymentAmount = investmentAmount * currencyRate;
          transactionCurrency = 'INR';
        }
        
        const wallet = await tx.wallet.findUnique({
          where: {
            userId_type: {
              userId: req.user.id,
              type: selectedWalletType as any,
            },
          },
        });

        if (wallet) {
          // Deduct from selected wallet (INR or USDT)
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: (Number(wallet.balance) - paymentAmount).toFixed(18),
            },
          });

          // Note: Breakdown wallet will only be credited when breakdown request is approved by admin
          // Not crediting here to avoid showing potential breakdown amounts

          // Create transaction record
          const txId = `PP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          await tx.transaction.create({
            data: {
              userId: req.user.id,
              walletId: wallet.id,
              type: 'PLAN_PURCHASE',
              amount: paymentAmount.toFixed(18),
              currency: transactionCurrency,
              status: 'COMPLETED',
              txId,
              description: `Investment in ${plan.name} (${purchaseMethod})${transactionCurrency === 'INR' ? ` - Paid ₹${paymentAmount.toFixed(2)} for $${investmentAmount.toFixed(2)} USDT plan` : ''}`,
              meta: {
                purchaseMethod,
                planId: plan.id,
                planName: plan.name,
              },
            },
          });

          // Process referral income
          await processReferralIncome(tx, req.user.id, investmentAmount, plan);
        }
      } else if (purchaseMethod === 'AUTH_KEY') {
        // For Authentication Key purchases
        // Note: Breakdown wallet will only be credited when breakdown request is approved by admin
        // Not crediting here to avoid showing potential breakdown amounts

        // Create transaction record for Authentication Key purchase
        const txId = `PP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await tx.transaction.create({
          data: {
            userId: req.user.id,
            type: 'PLAN_PURCHASE',
            amount: investmentAmount.toFixed(18),
            currency: 'USDT',
            status: 'COMPLETED',
            txId,
            description: `Investment in ${plan.name} using Authentication Key (${authKeyCode})`,
            meta: {
              purchaseMethod: 'AUTH_KEY',
              planId: plan.id,
              planName: plan.name,
              authKeyCode: authKeyCode?.toUpperCase(),
            },
          },
        });

        // Process referral income for Authentication Key purchases
        await processReferralIncome(tx, req.user.id, investmentAmount, plan);
      } else {
        // For admin request, create pending transaction
        await tx.transaction.create({
          data: {
            userId: req.user.id,
            type: 'PLAN_PURCHASE',
            amount: investmentAmount.toFixed(18),
            currency: 'USDT',
            status: 'PENDING',
            description: `Investment request in ${plan.name} (${purchaseMethod})`,
            meta: {
              purchaseMethod,
              planId: plan.id,
              planName: plan.name,
            },
          },
        });
      }

      return inv;
    });

    const message = investmentStatus === 'PENDING' 
      ? 'Investment request created successfully. Waiting for admin approval.'
      : purchaseMethod === 'AUTH_KEY'
      ? 'Investment activated successfully using Authentication Key!'
      : 'Investment created successfully';

    successResponse(res, investment, message, 201);
  } catch (error) {
    next(error);
  }
};

export const getInvestments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user.id };
    if (status) where.status = status;

    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          plan: true,
          refunds: {
            where: {
              status: { in: ['PENDING', 'APPROVED'] },
            },
            select: {
              id: true,
              status: true,
              amount: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.investment.count({ where }),
    ]);

    paginatedResponse(
      res,
      investments,
      Number(page),
      Number(limit),
      total,
      'Investments retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getInvestmentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const investment = await prisma.investment.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        plan: true,
      },
    });

    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    successResponse(res, investment, 'Investment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Calculate real-time ROI earned for an investment
export const getInvestmentRealTimeROI = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const investment = await prisma.investment.findFirst({
      where: {
        id,
        userId: req.user.id,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    if (!investment || !investment.plan) {
      throw new AppError('Active investment not found', 404);
    }

    if (!investment.startDate || !investment.endDate) {
      throw new AppError('Investment dates are not set', 400);
    }

    // Calculate ROI based on completed payouts (actual credited amount)
    // The realTimeROI should show the actual amount earned from completed payouts
    // NOT a continuous per-second calculation
    const realTimeROI = Number(investment.roiEarned);
    
    // The ROI is credited in discrete payouts of the exact roiAmount per payout
    // The scheduler handles the actual crediting based on frequency and duration
    // So realTimeROI = roiEarned (which is updated by the scheduler)

    successResponse(res, { 
      investmentId: investment.id,
      roiEarned: investment.roiEarned.toString(),
      realTimeROI: realTimeROI.toFixed(18)
    }, 'Real-time ROI calculated successfully');
  } catch (error) {
    next(error);
  }
};

// Request breakdown for an investment
export const requestBreakdown = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const investment = await prisma.investment.findFirst({
      where: {
        id,
        userId: req.user.id,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
        refunds: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] },
          },
        },
      },
    });

    if (!investment) {
      throw new AppError('Active investment not found', 404);
    }

    // Check if breakdown already requested
    if (investment.refunds.length > 0) {
      throw new AppError('Breakdown already requested for this investment', 400);
    }

    // Get breakdown settings
    const deductionPctSetting = await prisma.setting.findUnique({
      where: { key: 'breakdown_deductionPercentage' },
    });

    const deductionPercentage = deductionPctSetting
      ? (typeof deductionPctSetting.value === 'string'
          ? JSON.parse(deductionPctSetting.value)
          : deductionPctSetting.value)
      : 20; // Default 20%

    // Check if user is within the allowed refund timeline window
    if (!investment.startDate) {
      throw new AppError('Investment start date not set', 400);
    }
    
    const startDate = new Date(investment.startDate);
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Use the refund timeline that was saved with the investment 
    const refundTimelineDays = investment.refundTimelineDays || 30; // Default 30 days if not set

    // User can ONLY request breakdown WITHIN the timeline window (not after)
    if (daysSinceStart > refundTimelineDays) {
      throw new AppError(
        `Breakdown request window has expired. You can only request breakdown within ${refundTimelineDays} days from investment start. Your investment started ${daysSinceStart} days ago.`,
        400
      );
    }

    // New formula: [Total invested * (100 - Deduction%)] - [Total ROI Credited * 50%]
    const investmentAmount = Number(investment.amount);
    const totalROICredited = Number(investment.roiEarned);
    
    // Investment after deduction
    const investmentAfterDeduction = investmentAmount * (100 - deductionPercentage) / 100;
    
    // ROI penalty (50% of total ROI credited)
    const roiPenalty = totalROICredited * 0.5;
    
    // Breakdown amount = Investment after deduction - ROI penalty
    const breakdownAmount = investmentAfterDeduction - roiPenalty;
    
    // Ensure breakdown amount is not negative
    if (breakdownAmount <= 0) {
      throw new AppError(
        `Breakdown amount would be zero or negative. ROI earned exceeds refundable amount. Calculation: $${investmentAfterDeduction.toFixed(2)} (investment after ${deductionPercentage}% deduction) - $${roiPenalty.toFixed(2)} (50% of $${totalROICredited.toFixed(2)} ROI) = $${breakdownAmount.toFixed(2)}`,
        400
      );
    }

    // Create breakdown request (wallet will be credited when admin approves)
    const breakdownRequest = await prisma.$transaction(async (tx: any) => {
      // Get breakdown wallet for transaction record
      const breakdownWallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId: req.user.id,
            type: 'BREAKDOWN',
          },
        },
      });

      if (!breakdownWallet) {
        throw new AppError('Breakdown wallet not found', 404);
      }

      // Note: Not crediting breakdown wallet here - will be credited when admin approves
      // This ensures breakdown wallet only shows approved/refunded amounts

      // Create breakdown request
      const request = await tx.refundRequest.create({
        data: {
          investmentId: investment.id,
          requestedBy: req.user.id,
          amount: breakdownAmount.toFixed(18),
          status: 'PENDING',
        },
      });

      // Update investment status to BREAKDOWN_REQUESTED
      await tx.investment.update({
        where: { id: investment.id },
        data: {
          status: 'BREAKDOWN_REQUESTED',
        },
      });

      // Create transaction record
      const txId = `BD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await tx.transaction.create({
        data: {
          userId: req.user.id,
          walletId: breakdownWallet.id,
          type: 'BREAKDOWN',
          amount: breakdownAmount.toFixed(18),
          currency: 'USDT',
          status: 'COMPLETED',
          txId,
          description: `Investment #${investment.id} Breakdown: $${investmentAmount.toFixed(2)} investment × ${100-deductionPercentage}% = $${investmentAfterDeduction.toFixed(2)} - ROI penalty $${roiPenalty.toFixed(2)} (50% of $${totalROICredited.toFixed(2)}) = $${breakdownAmount.toFixed(2)}`,
        },
      });

      return request;
    });

    successResponse(
      res,
      {
        breakdownRequest,
        breakdownAmount: breakdownAmount.toFixed(2),
        calculation: {
          investmentAmount: investmentAmount.toFixed(2),
          deductionPercentage,
          investmentAfterDeduction: investmentAfterDeduction.toFixed(2),
          totalROICredited: totalROICredited.toFixed(2),
          roiPenalty: roiPenalty.toFixed(2),
        },
        message: `Breakdown request created. Amount: $${breakdownAmount.toFixed(2)} USDT. No further ROI credits will be processed for this investment.`,
      },
      'Breakdown request created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

// Cancel Breakdown Request
export const cancelBreakdown = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { investmentId } = req.params;

    // Get the investment
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        plan: true,
      },
    });

    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    // Check ownership
    if (investment.userId !== req.user.id) {
      throw new AppError('Not authorized to cancel this breakdown request', 403);
    }

    // Check if investment has a breakdown request
    if (investment.status !== 'BREAKDOWN_REQUESTED') {
      throw new AppError('No active breakdown request for this investment', 400);
    }

    // Get the breakdown request
    const breakdownRequest = await prisma.refundRequest.findFirst({
      where: {
        investmentId: investment.id,
        status: 'PENDING',
      },
    });

    if (!breakdownRequest) {
      throw new AppError('No pending breakdown request found', 404);
    }

    await prisma.$transaction(async (tx: any) => {
      const refundAmount = Number(breakdownRequest.amount);

      // Delete the refund request
      await tx.refundRequest.delete({
        where: { id: breakdownRequest.id },
      });

      // Restore investment status to ACTIVE
      await tx.investment.update({
        where: { id: investment.id },
        data: {
          status: 'ACTIVE',
        },
      });

      // Deduct from breakdown wallet
      const breakdownWallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId: req.user.id,
            type: 'BREAKDOWN',
          },
        },
      });

      if (breakdownWallet) {
        await tx.wallet.update({
          where: { id: breakdownWallet.id },
          data: {
            balance: (Number(breakdownWallet.balance) - refundAmount).toFixed(18),
          },
        });
      }

      // Process all pending ROI transactions for this investment
      const pendingROI = await tx.transaction.findMany({
        where: {
          userId: req.user.id,
          status: 'PENDING',
          description: {
            contains: `Investment #${investment.id}`,
          },
        },
      });

      // Also find pending ROI_BOOST transactions for referrer (if user has a referrer)
      let pendingBoostTransactions: any[] = [];
      const userWithReferrer = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { referredById: true },
      });

      if (userWithReferrer?.referredById) {
        pendingBoostTransactions = await tx.transaction.findMany({
          where: {
            userId: userWithReferrer.referredById,
            type: 'ROI_BOOST',
            status: 'PENDING',
            description: {
              contains: `Investment #${investment.id}`,
            },
          },
        });
      }

      // Get user's ROI wallet
      const roiWallet = await tx.wallet.findUnique({
        where: {
          userId_type: {
            userId: req.user.id,
            type: 'ROI',
          },
        },
      });

      // Credit all pending ROI to user's wallet
      let totalPendingROI = 0;
      for (const transaction of pendingROI) {
        totalPendingROI += Number(transaction.amount);
        
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
          },
        });
      }

      if (roiWallet && totalPendingROI > 0) {
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

        if (referrerRoiWallet && totalPendingBoost > 0) {
          await tx.wallet.update({
            where: { id: referrerRoiWallet.id },
            data: {
              balance: (Number(referrerRoiWallet.balance) + totalPendingBoost).toFixed(18),
            },
          });
        }
      }

      // Delete the breakdown transaction from breakdown wallet
      await tx.transaction.deleteMany({
        where: {
          userId: req.user.id,
          type: 'BREAKDOWN',
          description: {
            contains: `Investment #${investment.id}`,
          },
        },
      });
    });

    successResponse(
      res,
      {
        message: 'Breakdown request cancelled successfully. ROI credits will resume.',
      },
      'Breakdown request cancelled successfully'
    );
  } catch (error) {
    next(error);
  }
};


async function processReferralIncome(tx: any, userId: string, amount: number, plan: any) {
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

  // Only process direct referrer (level 1)
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
      // This is the user's first investment - convert from free to paid
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
