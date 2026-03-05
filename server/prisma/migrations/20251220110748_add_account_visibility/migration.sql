-- CreateEnum
CREATE TYPE "AccountVisibility" AS ENUM ('ALL_USERS', 'KYC_VERIFIED', 'SPECIFIC_USERS');

-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN     "assignedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "visibilityType" "AccountVisibility" NOT NULL DEFAULT 'ALL_USERS';

-- AlterTable
ALTER TABLE "UpiAccount" ADD COLUMN     "assignedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "visibilityType" "AccountVisibility" NOT NULL DEFAULT 'ALL_USERS';
