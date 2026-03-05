import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { getPoolBalance } from '../utils/poolContract';

// Get fee statistics
export const getFeeStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { range = 'all' } = req.query;

    // Calculate date filter based on range
    let dateFilter: any = {};
    
    if (range === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter = { gte: startOfDay };
    } else if (range === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      dateFilter = { gte: startOfWeek };
    } else if (range === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(startOfMonth.getDate() - 30);
      dateFilter = { gte: startOfMonth };
    }

    const whereClause = dateFilter.gte ? { createdAt: dateFilter } : {};

    // 1. Get USDT balance from smart contract
    const contractUSDTBalance = await getPoolBalance().catch(() => '0');

    // Get current currency rate
    const currencyRateSetting = await prisma.setting.findUnique({
      where: { key: 'currency_rate' },
    });

    const currencyRate = currencyRateSetting
      ? (typeof currencyRateSetting.value === 'string' ? JSON.parse(currencyRateSetting.value) : currencyRateSetting.value)
      : 83;

    // 2. Calculate INR balance: INR deposits - INR withdrawals
    const inrDepositsAgg = await prisma.deposit.aggregate({
      where: {
        status: 'APPROVED',
        currency: 'INR',
      },
      _sum: {
        amount: true,
      },
    });

    const inrWithdrawalsAgg = await prisma.withdrawal.aggregate({
      where: {
        status: 'APPROVED',
        currency: 'INR',
      },
      _sum: {
        amount: true,
      },
    });

    const totalINRDeposits = Number(inrDepositsAgg._sum.amount || 0);
    const totalINRWithdrawals = Number(inrWithdrawalsAgg._sum.amount || 0);
    const inrBalance = totalINRDeposits - totalINRWithdrawals;

    // 3. Calculate total investments in INR (purchased via INR wallet)
    const investmentsINRAgg = await prisma.investment.aggregate({
      where: {
        purchaseMethod: 'DIRECT_WALLET_INR',
      },
      _sum: {
        amount: true,
      },
    });
    const investmentsINR = Number(investmentsINRAgg._sum?.amount || 0);

    // 4. Calculate total investments in USDT (purchased via USDT wallet)
    const investmentsUSDTAgg = await prisma.investment.aggregate({
      where: {
        purchaseMethod: 'DIRECT_WALLET_USDT',
      },
      _sum: {
        amount: true,
      },
    });
    const investmentsUSDT = Number(investmentsUSDTAgg._sum?.amount || 0);

    // 5. Calculate trading value: Total investments - Total ROI credited - Total Refunds
    const totalInvestments = investmentsINR + (investmentsUSDT * Number(currencyRate));

    // Get total ROI credited by wallet type
    const roiINRAgg = await prisma.transaction.aggregate({
      where: {
        type: 'ROI_CREDIT',
        wallet: {
          type: 'INR'
        }
      },
      _sum: {
        amount: true,
      },
    });

    const roiUSDTAgg = await prisma.transaction.aggregate({
      where: {
        type: 'ROI_CREDIT',
        wallet: {
          type: 'USDT'
        }
      },
      _sum: {
        amount: true,
      },
    });

    const totalROIINR = Number(roiINRAgg._sum?.amount || 0);
    const totalROIUSDT = Number(roiUSDTAgg._sum?.amount || 0);
    const totalROICredited = totalROIINR + (totalROIUSDT * Number(currencyRate));

    // Get total refunds (RefundRequest model)
    const refundsAgg = await prisma.refundRequest.aggregate({
      where: {
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
    });

    const totalRefunds = Number(refundsAgg._sum?.amount || 0);

    const tradingValue = totalInvestments - totalROICredited - totalRefunds;

    // Get deposit/withdrawal FEES for the detailed summary (with date filter)
    const depositINRFeesAgg = await prisma.deposit.aggregate({
      where: {
        ...whereClause,
        status: 'APPROVED',
        currency: 'INR',
      },
      _sum: {
        platformFee: true,
      } as any,
    });

    const depositUSDTFeesAgg = await prisma.depositWalletTransaction.aggregate({
      where: {
        ...whereClause,
        credited: true,
      },
      _sum: {
        platformFee: true,
      } as any,
    });

    const withdrawalINRFeesAgg = await prisma.withdrawal.aggregate({
      where: {
        ...whereClause,
        status: 'APPROVED',
        currency: 'INR',
      },
      _sum: {
        platformFee: true,
      } as any,
    });

    const withdrawalUSDTFeesAgg = await prisma.withdrawal.aggregate({
      where: {
        ...whereClause,
        status: 'APPROVED',
        currency: 'USDT',
      },
      _sum: {
        platformFee: true,
      } as any,
    });

    const depositINRFees = Number((depositINRFeesAgg._sum as any)?.platformFee || 0);
    const depositUSDTFees = Number((depositUSDTFeesAgg._sum as any)?.platformFee || 0);
    const withdrawalINRFees = Number((withdrawalINRFeesAgg._sum as any)?.platformFee || 0);
    const withdrawalUSDTFees = Number((withdrawalUSDTFeesAgg._sum as any)?.platformFee || 0);

    // Get admin pool transactions summary
    const adminWithdrawalsAgg = await prisma.adminPoolTransaction.aggregate({
      where: {
        type: 'WITHDRAW',
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const adminDepositsAgg = await prisma.adminPoolTransaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const adminWithdrawals = Number(adminWithdrawalsAgg._sum?.amount || 0);
    const adminDeposits = Number(adminDepositsAgg._sum?.amount || 0);

    successResponse(
      res,
      {
        // Main 5 values
        contractUSDTBalance: Number(contractUSDTBalance),
        inrBalance: Number(inrBalance.toFixed(2)),
        investmentsINR: Number(investmentsINR.toFixed(2)),
        investmentsUSDT: Number(investmentsUSDT.toFixed(2)),
        tradingValue: Number(tradingValue.toFixed(2)),
        
        // Detailed summary - FEES/EARNINGS (with date filter applied)
        depositINRFees: Number(depositINRFees.toFixed(2)),
        depositUSDTFees: Number(depositUSDTFees.toFixed(2)),
        withdrawalINRFees: Number(withdrawalINRFees.toFixed(2)),
        withdrawalUSDTFees: Number(withdrawalUSDTFees.toFixed(2)),
        
        // Admin pool transactions (all time)
        adminWithdrawals: Number(adminWithdrawals.toFixed(2)),
        adminDeposits: Number(adminDeposits.toFixed(2)),
        
        currencyRate: Number(currencyRate),
      },
      'Fund management statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};
