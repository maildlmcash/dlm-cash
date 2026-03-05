import { prisma } from '../lib/prisma';

/**
 * Calculate turnover amount for a user since a specific date
 * Turnover = Sum of investment amounts from:
 * - Direct referrals (level 1)
 * - Direct referrals of direct referrals (level 2)
 * 
 * @param userId - The user ID to calculate turnover for
 * @param sinceDate - Start date to calculate turnover from
 * @returns Total turnover amount
 */
export const calculateUserTurnoverSinceDate = async (
  userId: string,
  sinceDate: Date
): Promise<number> => {
  try {
    // Get all direct referrals (level 1)
    const level1Referrals = await prisma.user.findMany({
      where: {
        referredById: userId,
      },
      select: {
        id: true,
      },
    });

    const level1UserIds = level1Referrals.map((ref) => ref.id);

    // Get all level 2 referrals (direct referrals of level 1 referrals)
    const level2Referrals = await prisma.user.findMany({
      where: {
        referredById: { in: level1UserIds },
      },
      select: {
        id: true,
      },
    });

    const level2UserIds = level2Referrals.map((ref) => ref.id);

    // Combine all referral user IDs (level 1 + level 2)
    const allReferralUserIds = [...level1UserIds, ...level2UserIds];

    if (allReferralUserIds.length === 0) {
      return 0;
    }

    // Calculate total investment amount from all referrals within the time period
    const investments = await prisma.investment.aggregate({
      where: {
        userId: { in: allReferralUserIds },
        status: { in: ['ACTIVE', 'COMPLETED'] },
        createdAt: {
          gte: sinceDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return Number(investments._sum.amount || 0);
  } catch (error) {
    console.error('Error calculating user turnover:', error);
    return 0;
  }
};

/**
 * Calculate turnover amount for a user within a specific time period (for backward compatibility)
 * @param userId - The user ID to calculate turnover for
 * @param days - Number of days to look back for investments
 * @returns Total turnover amount
 */
export const calculateUserTurnover = async (
  userId: string,
  days: number
): Promise<number> => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  return calculateUserTurnoverSinceDate(userId, dateThreshold);
};

/**
 * Check if user is paid (has bought any plan) or free (hasn't bought any plan)
 * @param userId - The user ID to check
 * @returns true if user is paid (has investments), false if free
 */
export const isUserPaid = async (userId: string): Promise<boolean> => {
  try {
    const investmentCount = await prisma.investment.count({
      where: {
        userId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    });
    return investmentCount > 0;
  } catch (error) {
    console.error('Error checking if user is paid:', error);
    return false;
  }
};

/**
 * Check if user qualifies for salary based on referral counts and turnover
 * @param userId - The user ID to check
 * @param config - Salary configuration for the user type (free or paid)
 * @returns Object with qualification status, matched level, and turnover amount
 */
export const checkSalaryQualification = async (
  userId: string,
  config: {
    freeReferralCount: number;
    paidReferralCount: number;
    qualificationTimeLimitHours?: number;
    levels: Array<{
      days: number;
      turnoverAmount: number;
      salaryIncomeAmount: number;
      salaryPaymentTimes: number;
    }>;
  }
): Promise<{
  qualified: boolean;
  matchedLevel: any | null;
  turnoverAmount: number;
  referralQualified: boolean;
}> => {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        freeReferralCount: true,
        paidReferralCount: true,
        createdAt: true,
      },
    });

    if (!user) {
      return {
        qualified: false,
        matchedLevel: null,
        turnoverAmount: 0,
        referralQualified: false,
      };
    }

    // Check if user is within qualification time limit
    if (config.qualificationTimeLimitHours) {
      const now = new Date();
      const signupDate = new Date(user.createdAt);
      const hoursSinceSignup = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceSignup > config.qualificationTimeLimitHours) {
        // User exceeded time limit - permanently disqualified
        return {
          qualified: false,
          matchedLevel: null,
          turnoverAmount: 0,
          referralQualified: false,
        };
      }
    }

    // Check if user meets referral requirement (either free OR paid)
    const referralQualified =
      user.freeReferralCount >= config.freeReferralCount ||
      user.paidReferralCount >= config.paidReferralCount;

    if (!referralQualified) {
      return {
        qualified: false,
        matchedLevel: null,
        turnoverAmount: 0,
        referralQualified: false,
      };
    }

    // Check each level to find the highest qualified level
    let highestQualifiedLevel: any = null;
    let maxTurnover = 0;

    for (const level of config.levels) {
      const turnoverAmount = await calculateUserTurnover(userId, level.days);
      maxTurnover = Math.max(maxTurnover, turnoverAmount);

      if (turnoverAmount >= level.turnoverAmount) {
        // If this level has higher requirements, it's a better match
        if (
          !highestQualifiedLevel ||
          level.turnoverAmount > highestQualifiedLevel.turnoverAmount
        ) {
          highestQualifiedLevel = {
            ...level,
            actualTurnover: turnoverAmount,
          };
        }
      }
    }

    return {
      qualified: highestQualifiedLevel !== null,
      matchedLevel: highestQualifiedLevel,
      turnoverAmount: maxTurnover,
      referralQualified: true,
    };
  } catch (error) {
    console.error('Error checking salary qualification:', error);
    return {
      qualified: false,
      matchedLevel: null,
      turnoverAmount: 0,
      referralQualified: false,
    };
  }
};

