import { prisma } from '../../lib/prisma';
import { isUserPaid, calculateUserTurnoverSinceDate } from '../../utils/salaryCalculation';

/**
 * Progressive Salary Calculation System
 * - Users progress through levels as they achieve turnover milestones
 * - Each level has its own timeline and turnover requirement
 * - Turnover is calculated per-level (additional, not cumulative)
 * - Salary is paid once per level to USDT wallet
 * - Users must achieve level's turnover within level's timeline
 */
export const calculateMonthlySalary = async () => {
  const today = new Date();
  
  try {
    // Get salary configs from database
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

    if (!freeConfig || !paidConfig) {
      console.log('Salary configuration incomplete - missing FREE or PAID config');
      return { processed: 0 };
    }

    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        currentSalaryLevel: true,
        currentLevelStartedAt: true,
        freeReferralCount: true,
        paidReferralCount: true,
      },
    });

    console.log(`Processing salary progression for ${users.length} users...`);

    let processedCount = 0;

    for (const user of users) {
      try {
        // Determine if user is paid or free
        const userIsPaid = await isUserPaid(user.id);
        const config = userIsPaid ? paidConfig : freeConfig;
        
        // Initialize user if they haven't started (first time)
        if (user.currentSalaryLevel === null || user.currentSalaryLevel === undefined) {
          // Check if user meets basic referral requirements
          const meetsReferralReq =
            user.freeReferralCount >= config.freeReferralCount ||
            user.paidReferralCount >= config.paidReferralCount;
          
          if (!meetsReferralReq) {
            continue; // User doesn't meet basic requirements yet
          }

          // Check qualification time limit
          if (config.qualificationTimeLimitHours) {
            const hoursSinceSignup = (today.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceSignup > config.qualificationTimeLimitHours) {
              continue; // User exceeded qualification time limit
            }
          }

          // Initialize user at level 1
          await prisma.user.update({
            where: { id: user.id },
            data: {
              currentSalaryLevel: 1,
              currentLevelStartedAt: today,
            },
          });
          
          console.log(`Initialized user ${user.email} at Level 1`);
          continue; // Process in next run
        }

        const currentLevel = user.currentSalaryLevel || 0;
        
        // Find the level configuration
        const levelConfig = config.levels.find((l) => l.levelOrder === currentLevel);
        
        if (!levelConfig) {
          console.log(`No level config found for user ${user.email} at level ${currentLevel}`);
          continue; // No more levels available
        }

        // Check if level timeline has expired
        const levelStartDate = user.currentLevelStartedAt || new Date(user.createdAt);
        const daysSinceLevelStart = (today.getTime() - new Date(levelStartDate).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLevelStart > levelConfig.days) {
          console.log(`User ${user.email} exceeded timeline for Level ${currentLevel} (${levelConfig.days} days)`);
          // User failed this level - they stay at this level (no progression)
          continue;
        }

        // Calculate turnover since current level started
        const turnoverSinceLevelStart = await calculateUserTurnoverSinceDate(
          user.id,
          new Date(levelStartDate)
        );

        console.log(`User ${user.email} - Level ${currentLevel}: Turnover ${turnoverSinceLevelStart} / ${levelConfig.turnoverAmount}`);

        // Check if user has achieved the required turnover for current level
        if (turnoverSinceLevelStart >= Number(levelConfig.turnoverAmount)) {
          // User qualifies! Pay salary and advance to next level
          const salaryAmount = Number(levelConfig.salaryIncomeAmount);

          await prisma.$transaction(async (tx: any) => {
            // Credit salary to USDT wallet (not SALARY wallet)
            const usdtWallet = await tx.wallet.findUnique({
              where: {
                userId_type: {
                  userId: user.id,
                  type: 'USDT',
                },
              },
            });

            if (!usdtWallet) {
              console.error(`USDT wallet not found for user ${user.email}`);
              return;
            }

            // Update wallet balance
            await tx.wallet.update({
              where: { id: usdtWallet.id },
              data: {
                balance: (Number(usdtWallet.balance) + salaryAmount).toFixed(18),
              },
            });

            // Create transaction record
            await tx.transaction.create({
              data: {
                userId: user.id,
                walletId: usdtWallet.id,
                type: 'SALARY_CREDIT',
                amount: salaryAmount.toFixed(18),
                currency: 'USDT',
                status: 'COMPLETED',
                description: `Level ${currentLevel} salary achieved (Turnover: $${turnoverSinceLevelStart.toFixed(2)})`,
              },
            });

            // Create salary log
            await tx.salaryLog.create({
              data: {
                userId: user.id,
                amount: salaryAmount.toFixed(18),
                periodFrom: levelStartDate,
                periodTo: today,
                level: currentLevel,
                turnoverAchieved: turnoverSinceLevelStart.toFixed(18),
                remarks: `Level ${currentLevel} completed`,
              },
            });

            // Advance user to next level
            const nextLevel = currentLevel + 1;
            await tx.user.update({
              where: { id: user.id },
              data: {
                currentSalaryLevel: nextLevel,
                currentLevelStartedAt: today,
              },
            });

            console.log(`✅ User ${user.email} completed Level ${currentLevel}, paid $${salaryAmount}, advanced to Level ${nextLevel}`);
            processedCount++;
          });
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }

    console.log(`Salary calculation complete. Processed: ${processedCount} level completions`);
    return { processed: processedCount };
  } catch (error) {
    console.error('Error in salary calculation job:', error);
    throw error;
  }
};
