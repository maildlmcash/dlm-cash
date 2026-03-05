-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "boostIncome" DECIMAL(65,18),
ADD COLUMN     "freeDirectReferralIncome" DECIMAL(65,18),
ADD COLUMN     "paidDirectReferralIncome" DECIMAL(65,18);
