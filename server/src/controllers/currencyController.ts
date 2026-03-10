import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';
import { fetchINRUSDTRateFromMoralis } from '../utils/moralis';
import { AppError } from '../middleware/errorHandler';

// Validation for currency rate update
export const updateCurrencyRateValidation = [
  body('rate').isDecimal().withMessage('Rate must be a valid decimal number'),
  body('source').optional().isString().withMessage('Source must be a string'),
];

// Get current currency rate
export const getCurrentCurrencyRate = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const rate = await prisma.currencyRate.findFirst({
      where: {
        pair: 'INR/USDT',
      },
      orderBy: { fetchedAt: 'desc' },
    });

    if (!rate) {
      successResponse(
        res,
        {
          pair: 'INR/USDT',
          rate: '83.0',
          source: 'default',
          fetchedAt: new Date(),
        },
        'Currency rate retrieved successfully'
      );
      return;
    }

    successResponse(
      res,
      {
        id: rate.id,
        pair: rate.pair,
        rate: rate.rate.toString(),
        source: rate.source || 'manual',
        fetchedAt: rate.fetchedAt,
        createdAt: rate.createdAt,
      },
      'Currency rate retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Update currency rate (manual override)
export const updateCurrencyRate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rate, source = 'manual' } = req.body;
    const adminId = req.user?.id;

    // Create new currency rate entry
    const newRate = await prisma.currencyRate.create({
      data: {
        pair: 'INR/USDT',
        rate: rate.toString(),
        source,
        fetchedAt: new Date(),
      },
    });

    // Log the currency rate change
    await prisma.currencyRateLog.create({
      data: {
        currencyRateId: newRate.id,
        previousRate: null, // Get previous rate if exists
        newRate: rate.toString(),
        changedBy: adminId || 'system',
        source,
      },
    });

    successResponse(
      res,
      {
        id: newRate.id,
        pair: newRate.pair,
        rate: newRate.rate.toString(),
        source: newRate.source,
        fetchedAt: newRate.fetchedAt,
      },
      'Currency rate updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get currency rate change logs
export const getCurrencyRateLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.currencyRateLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          currencyRate: {
            select: {
              pair: true,
            },
          },
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.currencyRateLog.count(),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      pair: log.currencyRate.pair,
      previousRate: log.previousRate?.toString() || null,
      newRate: log.newRate.toString(),
      source: log.source,
      changedBy: log.admin?.name || log.changedBy,
      changedByEmail: log.admin?.email || null,
      createdAt: log.createdAt,
    }));

    successResponse(
      res,
      {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Currency rate logs retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Fetch INR/USDT rate from public exchange-rate API (no key; uses USD/INR as proxy for USDT)
export const fetchRateFromApi = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fetchUSDToINRRate } = await import('../utils/moralis');
    const rate = await fetchUSDToINRRate();

    const previousRate = await prisma.currencyRate.findFirst({
      where: { pair: 'INR/USDT' },
      orderBy: { fetchedAt: 'desc' },
    });

    const newRate = await prisma.currencyRate.create({
      data: {
        pair: 'INR/USDT',
        rate: rate.toString(),
        source: 'exchangerate-api',
        fetchedAt: new Date(),
      },
    });

    await prisma.currencyRateLog.create({
      data: {
        currencyRateId: newRate.id,
        previousRate: previousRate ? previousRate.rate.toString() : null,
        newRate: rate.toString(),
        changedBy: req.user?.id || 'system',
        source: 'exchangerate-api',
      },
    });

    successResponse(
      res,
      {
        id: newRate.id,
        pair: newRate.pair,
        rate: newRate.rate.toString(),
        source: newRate.source,
        fetchedAt: newRate.fetchedAt,
      },
      'Currency rate fetched from API successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(`Failed to fetch rate from API: ${error.message}`, 500);
    }
    next(error);
  }
};

// Fetch currency rate from Moralis API
export const fetchMoralisRate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.user?.id;

    // Fetch rate from Moralis
    const moralisData = await fetchINRUSDTRateFromMoralis();

    // Get the previous rate for logging
    const previousRate = await prisma.currencyRate.findFirst({
      where: { pair: 'INR/USDT' },
      orderBy: { fetchedAt: 'desc' },
    });

    // Create new currency rate entry
    const newRate = await prisma.currencyRate.create({
      data: {
        pair: 'INR/USDT',
        rate: moralisData.inrPerUsdt.toString(),
        source: 'moralis',
        fetchedAt: moralisData.timestamp,
      },
    });

    // Log the currency rate change
    await prisma.currencyRateLog.create({
      data: {
        currencyRateId: newRate.id,
        previousRate: previousRate ? previousRate.rate.toString() : null,
        newRate: moralisData.inrPerUsdt.toString(),
        changedBy: adminId || 'system',
        source: 'moralis',
      },
    });

    successResponse(
      res,
      {
        id: newRate.id,
        pair: newRate.pair,
        rate: newRate.rate.toString(),
        source: newRate.source,
        fetchedAt: newRate.fetchedAt,
      },
      'Currency rate fetched from Moralis successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(`Failed to fetch rate from Moralis: ${error.message}`, 500);
    }
    next(error);
  }
};
