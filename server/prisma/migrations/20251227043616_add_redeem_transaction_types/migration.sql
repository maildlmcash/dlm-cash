-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'REDEEM_DEBIT';
ALTER TYPE "TransactionType" ADD VALUE 'REDEEM_CREDIT';

-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "network" TEXT;

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "refundTimelineDays" INTEGER;

-- AlterTable
ALTER TABLE "SalaryConfig" ADD COLUMN     "qualificationHours" INTEGER DEFAULT 72;

-- AlterTable
ALTER TABLE "SalaryLog" ADD COLUMN     "level" INTEGER DEFAULT 1,
ADD COLUMN     "turnoverAchieved" DECIMAL(65,18) DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentLevelStartedAt" TIMESTAMP(3),
ADD COLUMN     "currentSalaryLevel" INTEGER DEFAULT 0,
ADD COLUMN     "salaryQualifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "network" TEXT;

-- CreateTable
CREATE TABLE "CryptoPrice" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,18) NOT NULL,
    "change24h" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CryptoPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkConfig" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "rpcUrl" TEXT NOT NULL,
    "explorerUrl" TEXT,
    "explorerApiUrl" TEXT,
    "explorerApiKey" TEXT,
    "tokenAddress" TEXT NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "tokenDecimals" INTEGER NOT NULL DEFAULT 18,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "withdrawEnabled" BOOLEAN NOT NULL DEFAULT false,
    "depositEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CryptoPrice_symbol_key" ON "CryptoPrice"("symbol");

-- CreateIndex
CREATE INDEX "CryptoPrice_symbol_idx" ON "CryptoPrice"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkConfig_network_key" ON "NetworkConfig"("network");

-- CreateIndex
CREATE INDEX "NetworkConfig_network_isActive_idx" ON "NetworkConfig"("network", "isActive");
