import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// Get salary configuration settings
export const getSalarySettings = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get salary configs for both user types
    const [freeConfig, paidConfig] = await Promise.all([
      prisma.salaryConfig.findUnique({
        where: { userType: 'FREE' },
        include: {
          levels: {
            orderBy: { levelOrder: 'asc' },
          },
        },
      }),
      prisma.salaryConfig.findUnique({
        where: { userType: 'PAID' },
        include: {
          levels: {
            orderBy: { levelOrder: 'asc' },
          },
        },
      }),
    ]);

    // Get qualificationTimeLimitHours from either config (they should be the same)
    const qualificationTimeLimitHours = freeConfig?.qualificationTimeLimitHours || paidConfig?.qualificationTimeLimitHours || 72;

    // Build response structure
    const salarySettings = {
      qualificationTimeLimitHours,
      freeUser: freeConfig
        ? {
            freeReferralCount: freeConfig.freeReferralCount,
            paidReferralCount: freeConfig.paidReferralCount,
            levels: freeConfig.levels.map((level) => ({
              days: level.days,
              turnoverAmount: Number(level.turnoverAmount),
              salaryIncomeAmount: Number(level.salaryIncomeAmount),
              salaryPaymentTimes: level.salaryPaymentTimes,
            })),
          }
        : {
            freeReferralCount: 0,
            paidReferralCount: 0,
            levels: [],
          },
      paidUser: paidConfig
        ? {
            freeReferralCount: paidConfig.freeReferralCount,
            paidReferralCount: paidConfig.paidReferralCount,
            levels: paidConfig.levels.map((level) => ({
              days: level.days,
              turnoverAmount: Number(level.turnoverAmount),
              salaryIncomeAmount: Number(level.salaryIncomeAmount),
              salaryPaymentTimes: level.salaryPaymentTimes,
            })),
          }
        : {
            freeReferralCount: 0,
            paidReferralCount: 0,
            levels: [],
          },
    };

    successResponse(res, salarySettings, 'Salary settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Save salary configuration settings
export const saveSalarySettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { qualificationTimeLimitHours, freeUser, paidUser } = req.body;

    // Validate structure
    if (!freeUser || !paidUser) {
      throw new AppError('freeUser and paidUser configurations are required', 400);
    }

    // Validate qualification time limit
    if (qualificationTimeLimitHours !== undefined && qualificationTimeLimitHours < 1) {
      throw new AppError('Qualification time limit must be at least 1 hour', 400);
    }

    // Validate free user
    if (
      freeUser.freeReferralCount === undefined ||
      freeUser.paidReferralCount === undefined ||
      !Array.isArray(freeUser.levels)
    ) {
      throw new AppError('Invalid freeUser configuration', 400);
    }

    // Validate paid user
    if (
      paidUser.freeReferralCount === undefined ||
      paidUser.paidReferralCount === undefined ||
      !Array.isArray(paidUser.levels)
    ) {
      throw new AppError('Invalid paidUser configuration', 400);
    }

    // Validate referral counts
    if (
      freeUser.freeReferralCount < 0 ||
      freeUser.paidReferralCount < 0 ||
      paidUser.freeReferralCount < 0 ||
      paidUser.paidReferralCount < 0
    ) {
      throw new AppError('Referral counts must be non-negative', 400);
    }

    // Validate levels
    const validateLevel = (level: any, levelIndex: number, userType: string) => {
      if (
        level.days === undefined ||
        level.turnoverAmount === undefined ||
        level.salaryIncomeAmount === undefined ||
        level.salaryPaymentTimes === undefined
      ) {
        throw new AppError(
          `Level ${levelIndex + 1} in ${userType} is missing required fields`,
          400
        );
      }
      if (
        level.days < 1 ||
        level.turnoverAmount < 0 ||
        level.salaryIncomeAmount < 0 ||
        level.salaryPaymentTimes < 1
      ) {
        throw new AppError(
          `Level ${levelIndex + 1} in ${userType} has invalid values`,
          400
        );
      }
    };

    freeUser.levels.forEach((level: any, index: number) => {
      validateLevel(level, index, 'freeUser');
    });

    paidUser.levels.forEach((level: any, index: number) => {
      validateLevel(level, index, 'paidUser');
    });

    // Save using transaction
    await prisma.$transaction(async (tx) => {
      // Helper function to save config and levels
      const saveConfig = async (
        userType: 'FREE' | 'PAID',
        config: { freeReferralCount: number; paidReferralCount: number; levels: any[] }
      ) => {
        // Upsert the config with qualificationTimeLimitHours
        const salaryConfig = await tx.salaryConfig.upsert({
          where: { userType },
          update: {
            freeReferralCount: Number(config.freeReferralCount),
            paidReferralCount: Number(config.paidReferralCount),
            qualificationTimeLimitHours: qualificationTimeLimitHours !== undefined ? Number(qualificationTimeLimitHours) : undefined,
          },
          create: {
            userType,
            freeReferralCount: Number(config.freeReferralCount),
            paidReferralCount: Number(config.paidReferralCount),
            qualificationTimeLimitHours: qualificationTimeLimitHours !== undefined ? Number(qualificationTimeLimitHours) : 72,
          },
        });

        // Delete existing levels
        await tx.salaryLevel.deleteMany({
          where: { configId: salaryConfig.id },
        });

        // Create new levels
        if (config.levels.length > 0) {
          await tx.salaryLevel.createMany({
            data: config.levels.map((level: any, index: number) => ({
              configId: salaryConfig.id,
              levelOrder: index + 1,
              days: Number(level.days),
              turnoverAmount: Number(level.turnoverAmount),
              salaryIncomeAmount: Number(level.salaryIncomeAmount),
              salaryPaymentTimes: Number(level.salaryPaymentTimes),
            })),
          });
        }
      };

      // Save both configs
      await saveConfig('FREE', freeUser);
      await saveConfig('PAID', paidUser);
    });

    successResponse(res, null, 'Salary settings saved successfully');
  } catch (error) {
    next(error);
  }
};

// Get breakdown settings
export const getBreakdownSettings = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [refundTimelineSetting, deductionPctSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'breakdown_refundTimelineDays' } }),
      prisma.setting.findUnique({ where: { key: 'breakdown_deductionPercentage' } }),
    ]);

    const refundTimelineDays = refundTimelineSetting
      ? (typeof refundTimelineSetting.value === 'string'
          ? JSON.parse(refundTimelineSetting.value)
          : refundTimelineSetting.value)
      : 20;

    const deductionPercentage = deductionPctSetting
      ? (typeof deductionPctSetting.value === 'string'
          ? JSON.parse(deductionPctSetting.value)
          : deductionPctSetting.value)
      : 20;

    successResponse(
      res,
      {
        refundTimelineDays: Number(refundTimelineDays),
        deductionPercentage: Number(deductionPercentage),
      },
      'Breakdown settings retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Save breakdown settings
export const saveBreakdownSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refundTimelineDays, deductionPercentage } = req.body;

    if (refundTimelineDays !== undefined && (refundTimelineDays < 0 || refundTimelineDays > 365)) {
      throw new AppError('Refund timeline must be between 1 and 365 days', 400);
    }

    if (deductionPercentage !== undefined && (deductionPercentage < 0 || deductionPercentage > 100)) {
      throw new AppError('Deduction percentage must be between 0 and 100', 400);
    }

    await prisma.$transaction(async (tx) => {
      if (refundTimelineDays !== undefined) {
        await tx.setting.upsert({
          where: { key: 'breakdown_refundTimelineDays' },
          update: { value: Number(refundTimelineDays) },
          create: {
            key: 'breakdown_refundTimelineDays',
            value: Number(refundTimelineDays),
            group: 'breakdown',
          },
        });
      }

      if (deductionPercentage !== undefined) {
        await tx.setting.upsert({
          where: { key: 'breakdown_deductionPercentage' },
          update: { value: Number(deductionPercentage) },
          create: {
            key: 'breakdown_deductionPercentage',
            value: Number(deductionPercentage),
            group: 'breakdown',
          },
        });
      }
    });

    successResponse(res, null, 'Breakdown settings saved successfully');
  } catch (error) {
    next(error);
  }
};

// Get deposit settings (threshold)
export const getDepositSettings = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const thresholdSetting = await prisma.setting.findUnique({
      where: { key: 'deposit_autoCreditThreshold' },
    });

    const autoCreditThreshold = thresholdSetting
      ? (typeof thresholdSetting.value === 'string'
          ? JSON.parse(thresholdSetting.value)
          : thresholdSetting.value)
      : 0;

    successResponse(
      res,
      {
        autoCreditThreshold: Number(autoCreditThreshold),
      },
      'Deposit settings retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Save deposit settings (threshold)
export const saveDepositSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { autoCreditThreshold } = req.body;

    if (autoCreditThreshold !== undefined && autoCreditThreshold < 0) {
      throw new AppError('Auto-credit threshold must be non-negative', 400);
    }

    await prisma.setting.upsert({
      where: { key: 'deposit_autoCreditThreshold' },
      update: { value: Number(autoCreditThreshold) },
      create: {
        key: 'deposit_autoCreditThreshold',
        value: Number(autoCreditThreshold),
        group: 'deposit',
      },
    });

    successResponse(res, null, 'Deposit settings saved successfully');
  } catch (error) {
    next(error);
  }
};

// Get platform fee settings
export const getPlatformFeeSettings = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [minDepositSetting, minWithdrawalSetting, depositFeeSetting, withdrawalFeeSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'platform_minDepositUSDT' } }),
      prisma.setting.findUnique({ where: { key: 'platform_minWithdrawalUSDT' } }),
      prisma.setting.findUnique({ where: { key: 'platform_depositFeePercent' } }),
      prisma.setting.findUnique({ where: { key: 'platform_withdrawalFeePercent' } }),
    ]);

    const minDepositUSDT = minDepositSetting
      ? (typeof minDepositSetting.value === 'string' ? JSON.parse(minDepositSetting.value) : minDepositSetting.value)
      : 10;

    const minWithdrawalUSDT = minWithdrawalSetting
      ? (typeof minWithdrawalSetting.value === 'string' ? JSON.parse(minWithdrawalSetting.value) : minWithdrawalSetting.value)
      : 10;

    const depositFeePercent = depositFeeSetting
      ? (typeof depositFeeSetting.value === 'string' ? JSON.parse(depositFeeSetting.value) : depositFeeSetting.value)
      : 0;

    const withdrawalFeePercent = withdrawalFeeSetting
      ? (typeof withdrawalFeeSetting.value === 'string' ? JSON.parse(withdrawalFeeSetting.value) : withdrawalFeeSetting.value)
      : 0;

    successResponse(
      res,
      {
        minDepositUSDT: Number(minDepositUSDT),
        minWithdrawalUSDT: Number(minWithdrawalUSDT),
        depositFeePercent: Number(depositFeePercent),
        withdrawalFeePercent: Number(withdrawalFeePercent),
      },
      'Platform fee settings retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Save platform fee settings
export const savePlatformFeeSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { minDepositUSDT, minWithdrawalUSDT, depositFeePercent, withdrawalFeePercent } = req.body;

    // Validate inputs
    if (minDepositUSDT !== undefined && minDepositUSDT < 0) {
      throw new AppError('Minimum deposit must be non-negative', 400);
    }
    if (minWithdrawalUSDT !== undefined && minWithdrawalUSDT < 0) {
      throw new AppError('Minimum withdrawal must be non-negative', 400);
    }
    if (depositFeePercent !== undefined && (depositFeePercent < 0 || depositFeePercent > 100)) {
      throw new AppError('Deposit fee percent must be between 0 and 100', 400);
    }
    if (withdrawalFeePercent !== undefined && (withdrawalFeePercent < 0 || withdrawalFeePercent > 100)) {
      throw new AppError('Withdrawal fee percent must be between 0 and 100', 400);
    }

    // Save all settings
    const updates = [];
    
    if (minDepositUSDT !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'platform_minDepositUSDT' },
          update: { value: Number(minDepositUSDT) },
          create: { key: 'platform_minDepositUSDT', value: Number(minDepositUSDT), group: 'platform' },
        })
      );
    }

    if (minWithdrawalUSDT !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'platform_minWithdrawalUSDT' },
          update: { value: Number(minWithdrawalUSDT) },
          create: { key: 'platform_minWithdrawalUSDT', value: Number(minWithdrawalUSDT), group: 'platform' },
        })
      );
    }

    if (depositFeePercent !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'platform_depositFeePercent' },
          update: { value: Number(depositFeePercent) },
          create: { key: 'platform_depositFeePercent', value: Number(depositFeePercent), group: 'platform' },
        })
      );
    }

    if (withdrawalFeePercent !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'platform_withdrawalFeePercent' },
          update: { value: Number(withdrawalFeePercent) },
          create: { key: 'platform_withdrawalFeePercent', value: Number(withdrawalFeePercent), group: 'platform' },
        })
      );
    }

    await Promise.all(updates);

    successResponse(res, null, 'Platform fee settings saved successfully');
  } catch (error) {
    next(error);
  }
};

// Get ROI Boost Settings
export const getROIBoostSettings = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const minReferralsSetting = await prisma.setting.findUnique({
      where: { key: 'min_referrals_for_boost' },
    });

    const minReferrals = minReferralsSetting
      ? (typeof minReferralsSetting.value === 'string' ? parseInt(minReferralsSetting.value) : minReferralsSetting.value)
      : 0;

    successResponse(
      res,
      { minReferralsForBoost: minReferrals },
      'ROI boost settings retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Update ROI Boost Settings
export const updateROIBoostSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { minReferralsForBoost } = req.body;

    if (minReferralsForBoost === undefined || minReferralsForBoost < 0) {
      throw new AppError('Invalid minimum referrals value', 400);
    }

    await prisma.setting.upsert({
      where: { key: 'min_referrals_for_boost' },
      update: { value: Number(minReferralsForBoost) },
      create: {
        key: 'min_referrals_for_boost',
        value: Number(minReferralsForBoost),
        group: 'referral',
      },
    });

    successResponse(res, null, 'ROI boost settings updated successfully');
  } catch (error) {
    next(error);
  }
};
