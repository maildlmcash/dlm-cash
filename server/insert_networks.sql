-- Insert default networks if they don't exist
INSERT INTO "NetworkConfig" ("id", "network", "name", "chainId", "rpcUrl", "explorerUrl", "explorerApiUrl", "tokenAddress", "poolAddress", "tokenDecimals", "isActive", "withdrawEnabled", "depositEnabled", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::TEXT, 'SEPOLIA', 'Sepolia Testnet', 11155111, 'https://ethereum-sepolia.publicnode.com', 'https://sepolia.etherscan.io', 'https://api-sepolia.etherscan.io/api', '0xf37b0D267B05b16eA490134487fc4FAc2e3eD2a6', '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79', 18, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'ETHEREUM', 'Ethereum Mainnet', 1, 'https://ethereum-rpc.publicnode.com', 'https://etherscan.io', 'https://api.etherscan.io/api', '0xdAC17F958D2ee523a2206206994597C13D831ec7', '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79', 6, false, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'BSC', 'BNB Smart Chain', 56, 'https://bsc-rpc.publicnode.com', 'https://bscscan.com', 'https://api.bscscan.com/api', '0x55d398326f99059fF775485246999027B3197955', '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79', 18, false, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("network") DO NOTHING;

-- Verify insertion
SELECT * FROM "NetworkConfig";
