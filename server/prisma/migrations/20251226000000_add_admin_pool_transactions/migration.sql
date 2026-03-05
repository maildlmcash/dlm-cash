-- CreateTable
CREATE TABLE "AdminPoolTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,18) NOT NULL,
    "address" TEXT,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "adminId" TEXT NOT NULL,
    "adminRemarks" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPoolTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminPoolTransaction_type_status_idx" ON "AdminPoolTransaction"("type", "status");

-- CreateIndex
CREATE INDEX "AdminPoolTransaction_createdAt_idx" ON "AdminPoolTransaction"("createdAt");
