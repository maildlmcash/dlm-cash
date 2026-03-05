-- Add network support to withdrawal and deposit tables
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "network" TEXT;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "network" TEXT;
ALTER TABLE "DepositWalletTransaction" ADD COLUMN IF NOT EXISTS "network" TEXT DEFAULT 'SEPOLIA';
ALTER TABLE "PendingDepositTransaction" ADD COLUMN IF NOT EXISTS "network" TEXT DEFAULT 'SEPOLIA';

-- Create NetworkConfig table for admin-managed networks
CREATE TABLE IF NOT EXISTS "NetworkConfig" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "network" TEXT NOT NULL UNIQUE,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default networks (Sepolia for testing)
INSERT INTO "NetworkConfig" ("network", "name", "chainId", "rpcUrl", "explorerUrl", "explorerApiUrl", "tokenAddress", "poolAddress", "tokenDecimals", "isActive", "withdrawEnabled", "depositEnabled")
VALUES 
  ('SEPOLIA', 'Sepolia Testnet', 11155111, 'https://ethereum-sepolia.publicnode.com', 'https://sepolia.etherscan.io', 'https://api-sepolia.etherscan.io/api', '0x379D44df8fd761B888693764EE83e38Fe2fAD988', '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79', 18, true, true, true),
  ('ETHEREUM', 'Ethereum Mainnet', 1, 'https://ethereum-rpc.publicnode.com', 'https://etherscan.io', 'https://api.etherscan.io/api', '0xdAC17F958D2ee523a2206206994597C13D831ec7', '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79', 6, false, false, false),
  ('BSC', 'BNB Smart Chain', 56, 'https://bsc-rpc.publicnode.com', 'https://bscscan.com', 'https://api.bscscan.com/api', '0x55d398326f99059fF775485246999027B3197955', '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79', 18, false, false, false)
ON CONFLICT ("network") DO NOTHING;

CREATE INDEX IF NOT EXISTS "NetworkConfig_network_isActive_idx" ON "NetworkConfig"("network", "isActive");
