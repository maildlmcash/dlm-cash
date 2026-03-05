-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "upiAccountId" TEXT;

-- CreateTable
CREATE TABLE "UpiAccount" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpiAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_upiAccountId_fkey" FOREIGN KEY ("upiAccountId") REFERENCES "UpiAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
