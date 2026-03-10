import { ethers } from 'ethers';
import crypto from 'crypto';

// Must be 64 hex characters (32 bytes) for AES-256-CBC
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || '8657d95fa4feff11958cd2db254dc1797a3b2c4d5e6f7a8b9c0d1e2f3a4b5c6d';
const ALGORITHM = 'aes-256-cbc';

// Convert hex string to 32-byte buffer
const getKeyBuffer = (): Buffer => {
  return Buffer.from(ENCRYPTION_KEY, 'hex');
};

/**
 * Generate a new EVM wallet
 */
export const generateEvmWallet = (): { address: string; privateKey: string } => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

/**
 * Encrypt private key before storing in database
 */
export const encryptPrivateKey = (privateKey: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKeyBuffer(), iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt private key from database
 */
export const decryptPrivateKey = (encryptedKey: string): string => {
  const parts = encryptedKey.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, getKeyBuffer(), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Get wallet from private key
 */
export const getWalletFromPrivateKey = (privateKey: string): ethers.Wallet => {
  return new ethers.Wallet(privateKey);
};

/**
 * Transfer tokens from deposit wallet to cold wallet
 * @param privateKey - Decrypted private key of deposit wallet
 * @param toAddress - Cold wallet address
 * @param amount - Amount to transfer
 * @param provider - Ethereum provider
 */
export const transferToddWallet = async (
  privateKey: string,
  coldWalletAddress: string,
  amount: string,
  tokenAddress: string,
  provider: ethers.Provider
): Promise<string> => {
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // ERC20 ABI for transfer function
  const erc20Abi = [
    'function transfer(address to, uint amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint)',
  ];
  
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
  
  // Convert amount to token decimals (USDT has 6 decimals)
  const amountInWei = ethers.parseUnits(amount, 6);
  
  // Send transaction with explicit gas limit (avoids "gas limit too high" from strict RPCs)
  const gasLimit = Number(process.env.ERC20_TRANSFER_GAS_LIMIT) || 100_000;
  const tx = await tokenContract.transfer(coldWalletAddress, amountInWei, {
    gasLimit,
  });
  await tx.wait();
  
  return tx.hash;
};

/**
 * Get USDT balance of a wallet
 */
export const getUsdtBalance = async (
  address: string,
  tokenAddress: string,
  provider: ethers.Provider
): Promise<string> => {
  const erc20Abi = ['function balanceOf(address owner) view returns (uint)'];
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
  const balance = await tokenContract.balanceOf(address);
  return ethers.formatUnits(balance, 6); // USDT has 6 decimals
};
