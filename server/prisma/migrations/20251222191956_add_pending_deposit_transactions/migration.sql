-- CreateTable
CREATE TABLE "PendingDepositTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amount" DECIMAL(65,18) NOT NULL,
    "tokenSymbol" TEXT NOT NULL DEFAULT 'USDT',
    "network" TEXT NOT NULL DEFAULT 'SEPOLIA',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingDepositTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingDepositTransaction_txHash_key" ON "PendingDepositTransaction"("txHash");

-- CreateIndex
CREATE INDEX "PendingDepositTransaction_userId_idx" ON "PendingDepositTransaction"("userId");

-- CreateIndex
CREATE INDEX "PendingDepositTransaction_txHash_idx" ON "PendingDepositTransaction"("txHash");

-- CreateIndex
CREATE INDEX "PendingDepositTransaction_expiresAt_idx" ON "PendingDepositTransaction"("expiresAt");

-- CreateIndex
CREATE INDEX "PendingDepositTransaction_status_idx" ON "PendingDepositTransaction"("status");

-- AddForeignKey
ALTER TABLE "PendingDepositTransaction" ADD CONSTRAINT "PendingDepositTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
