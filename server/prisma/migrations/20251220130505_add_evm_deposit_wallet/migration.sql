/*
  Warnings:

  - A unique constraint covering the columns `[depositWalletAddress]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "depositWalletAddress" TEXT,
ADD COLUMN     "depositWalletCreatedAt" TIMESTAMP(3),
ADD COLUMN     "depositWalletPrivateKey" TEXT;

-- CreateTable
CREATE TABLE "DepositWalletTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" DECIMAL(65,18) NOT NULL,
    "tokenSymbol" TEXT NOT NULL DEFAULT 'USDT',
    "blockNumber" BIGINT NOT NULL,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "credited" BOOLEAN NOT NULL DEFAULT false,
    "creditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepositWalletTransaction_txHash_key" ON "DepositWalletTransaction"("txHash");

-- CreateIndex
CREATE INDEX "DepositWalletTransaction_userId_idx" ON "DepositWalletTransaction"("userId");

-- CreateIndex
CREATE INDEX "DepositWalletTransaction_txHash_idx" ON "DepositWalletTransaction"("txHash");

-- CreateIndex
CREATE INDEX "DepositWalletTransaction_credited_idx" ON "DepositWalletTransaction"("credited");

-- CreateIndex
CREATE INDEX "DepositWalletTransaction_blockTimestamp_idx" ON "DepositWalletTransaction"("blockTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "User_depositWalletAddress_key" ON "User"("depositWalletAddress");

-- CreateIndex
CREATE INDEX "User_depositWalletAddress_idx" ON "User"("depositWalletAddress");

-- AddForeignKey
ALTER TABLE "DepositWalletTransaction" ADD CONSTRAINT "DepositWalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
