/*
  Warnings:

  - You are about to drop the column `chainId` on the `NetworkConfig` table. All the data in the column will be lost.
  - You are about to drop the column `explorerApiUrl` on the `NetworkConfig` table. All the data in the column will be lost.
  - You are about to drop the column `explorerUrl` on the `NetworkConfig` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `NetworkConfig` table. All the data in the column will be lost.
  - You are about to drop the column `poolAddress` on the `NetworkConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rpcUrl` on the `NetworkConfig` table. All the data in the column will be lost.
  - You are about to drop the column `tokenAddress` on the `NetworkConfig` table. All the data in the column will be lost.
  - You are about to drop the column `tokenDecimals` on the `NetworkConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NetworkConfig" DROP COLUMN "chainId",
DROP COLUMN "explorerApiUrl",
DROP COLUMN "explorerUrl",
DROP COLUMN "name",
DROP COLUMN "poolAddress",
DROP COLUMN "rpcUrl",
DROP COLUMN "tokenAddress",
DROP COLUMN "tokenDecimals";
