-- DropIndex
DROP INDEX "CurrencyRate_pair_key";

-- CreateTable
CREATE TABLE "CurrencyRateLog" (
    "id" TEXT NOT NULL,
    "currencyRateId" TEXT NOT NULL,
    "previousRate" DECIMAL(65,18),
    "newRate" DECIMAL(65,18) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyRateLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CurrencyRateLog" ADD CONSTRAINT "CurrencyRateLog_currencyRateId_fkey" FOREIGN KEY ("currencyRateId") REFERENCES "CurrencyRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencyRateLog" ADD CONSTRAINT "CurrencyRateLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
