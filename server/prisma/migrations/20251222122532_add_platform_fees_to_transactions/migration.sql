-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "platformFee" DECIMAL(65,18);

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "platformFee" DECIMAL(65,18);
