import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// Default network configurations (hardcoded)
const DEFAULT_NETWORKS = [
  {
    network: 'SEPOLIA',
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/v2/api',
    tokenAddress: '0xf37b0D267B05b16eA490134487fc4FAc2e3eD2a6',
    poolAddress: '0x2196f8f2129b241a6D44830302Ab5B1eCA1d0f79',
    tokenDecimals: 18,
    isActive: true,
    withdrawEnabled: true,
    depositEnabled: true,
  },
  {
    network: 'ETHEREUM',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/v2/api',
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    poolAddress: '0x0000000000000000000000000000000000000000',
    tokenDecimals: 6,
    isActive: false,
    withdrawEnabled: false,
    depositEnabled: false,
  },
  {
    network: 'BSC',
    name: 'Binance Smart Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    explorerApiUrl: 'https://api.bscscan.com/api',
    tokenAddress: '0x55d398326f99059fF775485246999027B3197955',
    poolAddress: '0x0000000000000000000000000000000000000000',
    tokenDecimals: 18,
    isActive: false,
    withdrawEnabled: false,
    depositEnabled: false,
  },
];

/**
 * Get all network configurations (merge defaults with database status)
 */
export const getNetworkConfigs = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    // Get status overrides from database
    const dbNetworks = await prisma.networkConfig.findMany();
    const dbNetworkMap = new Map(dbNetworks.map(n => [n.network, n]));

    // Merge defaults with database status
    const networks = DEFAULT_NETWORKS.map(defaultNet => {
      const dbNet = dbNetworkMap.get(defaultNet.network);
      if (dbNet) {
        // Use database status if exists
        return {
          id: dbNet.id,
          ...defaultNet,
          isActive: dbNet.isActive,
          withdrawEnabled: dbNet.withdrawEnabled,
          depositEnabled: dbNet.depositEnabled,
          explorerApiKey: dbNet.explorerApiKey || undefined,
        };
      }
      // Use defaults (no ID means not yet saved to DB)
      return { ...defaultNet, id: null };
    });

    successResponse(res, networks, 'Network configurations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get active networks (for user-facing endpoints)
 */
export const getActiveNetworks = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const dbNetworks = await prisma.networkConfig.findMany();
    const dbNetworkMap = new Map(dbNetworks.map(n => [n.network, n]));

    const networks = DEFAULT_NETWORKS
      .map(defaultNet => {
        const dbNet = dbNetworkMap.get(defaultNet.network);
        if (dbNet) {
          return {
            id: dbNet.id,
            ...defaultNet,
            isActive: dbNet.isActive,
            withdrawEnabled: dbNet.withdrawEnabled,
            depositEnabled: dbNet.depositEnabled,
            explorerApiKey: dbNet.explorerApiKey || undefined,
          };
        }
        return { ...defaultNet, id: null };
      })
      .filter(net => net.isActive);

    successResponse(res, networks, 'Active networks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get networks enabled for withdrawal
 */
export const getWithdrawEnabledNetworks = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const dbNetworks = await prisma.networkConfig.findMany();
    const dbNetworkMap = new Map(dbNetworks.map(n => [n.network, n]));

    const networks = DEFAULT_NETWORKS
      .map(defaultNet => {
        const dbNet = dbNetworkMap.get(defaultNet.network);
        if (dbNet) {
          return {
            id: dbNet.id,
            ...defaultNet,
            isActive: dbNet.isActive,
            withdrawEnabled: dbNet.withdrawEnabled,
            depositEnabled: dbNet.depositEnabled,
            explorerApiKey: dbNet.explorerApiKey || undefined,
          };
        }
        return { ...defaultNet, id: null };
      })
      .filter(net => net.isActive && net.withdrawEnabled);

    successResponse(res, networks, 'Withdraw-enabled networks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get networks enabled for deposits
 */
export const getDepositEnabledNetworks = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const dbNetworks = await prisma.networkConfig.findMany();
    const dbNetworkMap = new Map(dbNetworks.map(n => [n.network, n]));

    const networks = DEFAULT_NETWORKS
      .map(defaultNet => {
        const dbNet = dbNetworkMap.get(defaultNet.network);
        if (dbNet) {
          return {
            id: dbNet.id,
            ...defaultNet,
            isActive: dbNet.isActive,
            withdrawEnabled: dbNet.withdrawEnabled,
            depositEnabled: dbNet.depositEnabled,
            explorerApiKey: dbNet.explorerApiKey || undefined,
          };
        }
        return { ...defaultNet, id: null };
      })
      .filter(net => net.isActive && net.depositEnabled);

    successResponse(res, networks, 'Deposit-enabled networks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update network configuration (Admin only)
 * - Only updates status fields
 */
export const updateNetworkConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    const { 
      isActive,
      withdrawEnabled,
      depositEnabled,
      explorerApiKey
    } = req.body;

    // If ID is provided, update existing record
    if (id && id !== 'null') {
      const network = await prisma.networkConfig.update({
        where: { id },
        data: {
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
          ...(withdrawEnabled !== undefined && { withdrawEnabled: Boolean(withdrawEnabled) }),
          ...(depositEnabled !== undefined && { depositEnabled: Boolean(depositEnabled) }),
          ...(explorerApiKey !== undefined && { explorerApiKey }),
        },
      });

      successResponse(res, network, 'Network configuration updated successfully');
    } else {
      // No ID means this network hasn't been saved yet, extract network name from body
      const { network: networkName } = req.body;
      
      if (!networkName) {
        throw new AppError('Network name is required for new configurations', 400);
      }

      // Check if network exists in defaults
      const defaultNet = DEFAULT_NETWORKS.find(n => n.network === networkName);
      if (!defaultNet) {
        throw new AppError('Invalid network name', 400);
      }

      // Create new record with status
      const network = await prisma.networkConfig.create({
        data: {
          network: networkName,
          isActive: isActive !== undefined ? Boolean(isActive) : defaultNet.isActive,
          withdrawEnabled: withdrawEnabled !== undefined ? Boolean(withdrawEnabled) : defaultNet.withdrawEnabled,
          depositEnabled: depositEnabled !== undefined ? Boolean(depositEnabled) : defaultNet.depositEnabled,
          explorerApiKey: explorerApiKey || null,
        },
      });

      successResponse(res, network, 'Network configuration created successfully', 201);
    }
  } catch (error) {
    next(error);
  }
};
