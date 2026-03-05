import { prisma } from '../../lib/prisma';

export const calculateDailyROI = async () => {
  const today = new Date();
  
  // Get all active investments (status is the authority, not endDate)
  const activeInvestments = await prisma.investment.findMany({
    where: {
      status: 'ACTIVE',
      startDate: { lte: today },
    },
    include: {
      plan: true,
      user: true,
    },
  });

  console.log(`Processing ${activeInvestments.length} active investments...`);

  for (const investment of activeInvestments) {
    try {
      const { plan, user } = investment;

      if (!plan) {
        continue;
      }

      // Check investment status - if BREAKDOWN_REQUESTED or CLOSED, handle accordingly
      const isBreakdownRequested = investment.status === 'BREAKDOWN_REQUESTED';
      const isClosed = investment.status === 'CLOSED';

      if (isClosed) {
        console.log(`⏸️ Skipping investment ${investment.id} - Investment is CLOSED`);
        continue;
      }

      let shouldCredit = false;
      let roiAmount = 0;
      const todayDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const todayDayNumber = todayDay === 0 ? 7 : todayDay; // Convert to 1-7 format

      // DAILY frequency
      if (plan.frequency === 'DAILY') {
        // Get selected days from frequencyDays (array of 1-7)
        let selectedDays: number[] = [];
        if (plan.frequencyDays) {
          if (Array.isArray(plan.frequencyDays)) {
            selectedDays = plan.frequencyDays.filter((d): d is number => 
              typeof d === 'number' && d >= 1 && d <= 7
            );
          } else if (typeof plan.frequencyDays === 'string') {
            try {
              const parsed = JSON.parse(plan.frequencyDays);
              if (Array.isArray(parsed)) {
                selectedDays = parsed.filter((d): d is number => 
                  typeof d === 'number' && d >= 1 && d <= 7
                );
              }
            } catch (e) {
              console.error('Error parsing frequencyDays:', e);
              selectedDays = [];
            }
          }
        }

        // If no days selected, skip
        if (selectedDays.length === 0) {
          continue;
        }

        // Check if today matches one of the selected days
        if (selectedDays.includes(todayDayNumber)) {
          shouldCredit = true;
          roiAmount = Number(plan.roiAmount);
        }
      }
      // WEEKLY frequency
      else if (plan.frequency === 'WEEKLY') {
        // Check if today matches the frequencyDay
        if (plan.frequencyDay && plan.frequencyDay === todayDayNumber) {
          shouldCredit = true;
          roiAmount = Number(plan.roiAmount);
        }
      }
      // MONTHLY frequency
      else if (plan.frequency === 'MONTHLY') {
        const todayDayOfMonth = today.getDate(); // 1-31
        // Check if today matches the frequencyDay (day of month)
        if (plan.frequencyDay && plan.frequencyDay === todayDayOfMonth) {
          shouldCredit = true;
          roiAmount = Number(plan.roiAmount);
        }
      }

      // Skip if today doesn't match the schedule
      if (!shouldCredit || roiAmount === 0) {
        continue;
      }

      // Count payouts for THIS specific investment (investment-scoped, not user+plan scoped)
      const roiCreditCount = await prisma.transaction.count({
        where: {
          type: 'ROI_CREDIT',
          description: { contains: investment.id }, // Scoped to this investment
        },
      });

      // Don't credit if we've already reached the maximum number of payouts
      if (roiCreditCount >= plan.durationTimes) {
        continue;
      }

      // ROI amount to process
      const roiToCredit = roiAmount;

      // Process the payout
      await prisma.$transaction(async (tx: any) => {
        const frequencyLabel = plan.frequency === 'DAILY' ? 'Daily' : plan.frequency === 'WEEKLY' ? 'Weekly' : 'Monthly';
        
        // This will be the (roiCreditCount + 1)th payout
        const currentPayoutNumber = roiCreditCount + 1;
        const isLastPayout = currentPayoutNumber >= plan.durationTimes;
        
        // Update investment
        await tx.investment.update({
          where: { id: investment.id },
          data: {
            roiEarned: (Number(investment.roiEarned) + roiAmount).toFixed(18),
            ...(isLastPayout ? { status: 'COMPLETED' } : {}),
          },
        });

        // Credit to ROI wallet
        const roiWallet = await tx.wallet.findUnique({
          where: {
            userId_type: {
              userId: user.id,
              type: 'ROI',
            },
          },
        });

        if (roiWallet && roiToCredit > 0) {
          // If breakdown is requested, create PENDING transaction (don't credit wallet yet)
          // If normal, credit wallet and create COMPLETED transaction
          const transactionStatus = isBreakdownRequested ? 'PENDING' : 'COMPLETED';
          
          if (!isBreakdownRequested) {
            // Only update wallet balance if not in breakdown status
            await tx.wallet.update({
              where: { id: roiWallet.id },
              data: {
                balance: (Number(roiWallet.balance) + roiToCredit).toFixed(18),
              },
            });
          }

          // Create transaction record (investment-scoped)
          await tx.transaction.create({
            data: {
              userId: user.id,
              walletId: roiWallet.id,
              type: 'ROI_CREDIT',
              amount: roiToCredit.toFixed(18),
              currency: 'USDT',
              status: transactionStatus,
              description: `${frequencyLabel} ROI from ${plan.name} - Investment #${investment.id}${isLastPayout ? ' - Final Payout' : ''}${isBreakdownRequested ? ' (PENDING - Breakdown Requested)' : ''}`,
            },
          });
          
          // Process ROI Boost for referrer (create PENDING if breakdown requested, otherwise COMPLETED)
          if (user.referredById && plan.boostIncome && Number(plan.boostIncome) > 0) {
            // Get minimum referrals setting
            const minReferralsSetting = await tx.setting.findUnique({
              where: { key: 'min_referrals_for_boost' },
            });
            const minReferrals = minReferralsSetting 
              ? (typeof minReferralsSetting.value === 'string' ? parseInt(minReferralsSetting.value) : minReferralsSetting.value)
              : 0;
            
            // Check if referrer is qualified
            const referrer = await tx.user.findUnique({
              where: { id: user.referredById },
              select: {
                id: true,
                totalReferralCount: true,
              },
            });
            
            if (referrer && referrer.totalReferralCount >= minReferrals) {
              // Calculate boost amount (percentage of ROI)
              const boostAmount = (roiToCredit * Number(plan.boostIncome)) / 100;
              
              // Get referrer's ROI wallet
              const referrerRoiWallet = await tx.wallet.findUnique({
                where: {
                  userId_type: {
                    userId: referrer.id,
                    type: 'ROI',
                  },
                },
              });
              
              if (referrerRoiWallet && boostAmount > 0) {
                // Only credit wallet if not in breakdown status
                if (!isBreakdownRequested) {
                  await tx.wallet.update({
                    where: { id: referrerRoiWallet.id },
                    data: {
                      balance: (Number(referrerRoiWallet.balance) + boostAmount).toFixed(18),
                    },
                  });
                }
                
                // Create boost transaction (PENDING if breakdown requested, otherwise COMPLETED)
                await tx.transaction.create({
                  data: {
                    userId: referrer.id,
                    walletId: referrerRoiWallet.id,
                    type: 'ROI_BOOST',
                    amount: boostAmount.toFixed(18),
                    currency: 'USDT',
                    status: transactionStatus,
                    description: `ROI Boost (${plan.boostIncome}% of $${roiToCredit.toFixed(2)}) from referral's ${plan.name} plan - Investment #${investment.id}${isBreakdownRequested ? ' (PENDING - Breakdown Requested)' : ''}`,
                  },
                });
                
                const statusSuffix = isBreakdownRequested ? ' (PENDING)' : '';
                console.log(`  ✓ ROI Boost ${isBreakdownRequested ? 'pending' : 'credited'} to referrer: ${boostAmount.toFixed(2)} USDT (${plan.boostIncome}% of ${roiToCredit.toFixed(2)} USDT)${statusSuffix}`);
              }
            }
          }
        }
      });

      const frequencyLabel = plan.frequency === 'DAILY' ? 'Daily' : plan.frequency === 'WEEKLY' ? 'Weekly' : 'Monthly';
      const statusLabel = isBreakdownRequested ? '(PENDING - Breakdown Requested)' : '';
      console.log(`✓ Processed ${frequencyLabel} ROI for investment ${investment.id} (user: ${user.email}): ${roiToCredit.toFixed(2)} USDT - Payout ${roiCreditCount + 1}/${plan.durationTimes} ${statusLabel}`);
    } catch (error) {
      console.error(`✗ Failed to process investment ${investment.id}:`, error);
    }
  }

  console.log(`Completed ROI calculation for ${activeInvestments.length} investments`);

  return {
    processed: activeInvestments.length,
  };
};
