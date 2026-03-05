import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const createPlanValidation = [
  body('name').notEmpty().trim(),
  body('amount').isNumeric().custom((value: any) => value > 0),
  body('roiAmount').isNumeric().custom((value: any) => value > 0),
  body('durationTimes').isInt({ min: 1 }),
  body('frequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY']),
  body('frequencyDay').optional().isInt({ min: 1, max: 30 }).custom((value: any, { req }) => {
    if (req.body.frequency === 'WEEKLY' && value && (value < 1 || value > 7)) {
      throw new Error('Frequency day must be between 1-7 for weekly frequency');
    }
    if (req.body.frequency === 'MONTHLY' && value && (value < 1 || value > 30)) {
      throw new Error('Frequency day must be between 1-30 for monthly frequency');
    }
    return true;
  }),
  body('frequencyDays').optional().isArray().custom((value: any, { req }) => {
    if (req.body.frequency === 'DAILY') {
      if (!value || !Array.isArray(value) || value.length === 0) {
        throw new Error('At least one day must be selected for daily frequency');
      }
      // Validate each day is between 1-7 (Monday-Sunday)
      for (const day of value) {
        if (!Number.isInteger(day) || day < 1 || day > 7) {
          throw new Error('Frequency days must be integers between 1-7 (1=Monday, 7=Sunday)');
        }
      }
    }
    return true;
  }),
  body('freeDirectReferralIncome').optional().isNumeric().custom((value: any) => value >= 0),
  body('paidDirectReferralIncome').optional().isNumeric().custom((value: any) => value >= 0),
  body('boostIncome').optional().isNumeric().custom((value: any) => value >= 0 && value <= 100),
];

export const createPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      amount,
      roiAmount,
      durationTimes,
      frequency,
      frequencyDay,
      frequencyDays,
      freeDirectReferralIncome,
      paidDirectReferralIncome,
      boostIncome,
    } = req.body;

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        amount,
        roiAmount,
        durationTimes,
        frequency,
        frequencyDay: frequency === 'DAILY' ? null : frequencyDay,
        frequencyDays: frequency === 'DAILY' ? (frequencyDays || []) : null,
        freeDirectReferralIncome: freeDirectReferralIncome || null,
        paidDirectReferralIncome: paidDirectReferralIncome || null,
        boostIncome: boostIncome || null,
        isActive: true,
      },
    });

    successResponse(res, plan, 'Plan created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getAllPlans = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.plan.count({ where }),
    ]);

    paginatedResponse(
      res,
      plans,
      Number(page),
      Number(limit),
      total,
      'Plans retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      amount,
      roiAmount,
      durationTimes,
      frequency,
      frequencyDay,
      frequencyDays,
      isActive,
      freeDirectReferralIncome,
      paidDirectReferralIncome,
      boostIncome,
    } = req.body;

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        description,
        amount,
        roiAmount,
        durationTimes,
        frequency,
        frequencyDay: frequency === 'DAILY' ? null : frequencyDay,
        frequencyDays: frequency === 'DAILY' ? (frequencyDays || []) : null,
        freeDirectReferralIncome: freeDirectReferralIncome !== undefined ? freeDirectReferralIncome : undefined,
        paidDirectReferralIncome: paidDirectReferralIncome !== undefined ? paidDirectReferralIncome : undefined,
        boostIncome: boostIncome !== undefined ? boostIncome : undefined,
        isActive,
      },
    });

    successResponse(res, plan, 'Plan updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if plan has active investments
    const activeInvestments = await prisma.investment.count({
      where: {
        planId: id,
        status: 'ACTIVE',
      },
    });

    if (activeInvestments > 0) {
      throw new AppError('Cannot delete plan with active investments', 400);
    }

    await prisma.plan.delete({
      where: { id },
    });

    successResponse(res, null, 'Plan deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const togglePlanStatus = async (
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

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });

    successResponse(res, updatedPlan, 'Plan status updated successfully');
  } catch (error) {
    next(error);
  }
};

// Get all investments (admin)
export const getAllInvestments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status, userId, planId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (planId) where.planId = planId;

    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
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
          plan: true,
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

export const getInvestmentStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalInvestments,
      activeInvestments,
      completedInvestments,
      totalInvested,
      totalROIPaid,
    ] = await Promise.all([
      prisma.investment.count(),
      prisma.investment.count({ where: { status: 'ACTIVE' } }),
      prisma.investment.count({ where: { status: 'COMPLETED' } }),
      prisma.investment.aggregate({
        _sum: { amount: true },
      }),
      prisma.investment.aggregate({
        _sum: { roiEarned: true },
      }),
    ]);

    const stats = {
      total: totalInvestments,
      active: activeInvestments,
      completed: completedInvestments,
      totalInvested: totalInvested._sum.amount || '0',
      totalROIPaid: totalROIPaid._sum.roiEarned || '0',
    };

    successResponse(res, stats, 'Investment statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
