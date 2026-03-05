-- Drop old type constraint before updating enum
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE text;

-- Update the enum to replace ADJUSTMENT with BREAKDOWN
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'ROI_CREDIT', 'SALARY_CREDIT', 'REFERRAL', 'REFUND', 'PLAN_PURCHASE', 'PLAN_PAYOUT', 'BREAKDOWN', 'ROI_BOOST', 'DIRECT_REFERRAL');

-- Update any existing ADJUSTMENT transactions to BREAKDOWN in text format
UPDATE "Transaction" SET type = 'BREAKDOWN' WHERE type = 'ADJUSTMENT';

-- Update column to use new enum
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType" USING (type::text::"TransactionType");

-- Drop old enum
DROP TYPE "TransactionType_old";
