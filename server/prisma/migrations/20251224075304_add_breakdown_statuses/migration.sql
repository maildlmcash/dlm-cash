-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InvestmentStatus" ADD VALUE 'BREAKDOWN_REQUESTED';
ALTER TYPE "InvestmentStatus" ADD VALUE 'CLOSED';

-- AlterEnum
ALTER TYPE "PurchaseMethod" ADD VALUE 'AUTH_KEY';
