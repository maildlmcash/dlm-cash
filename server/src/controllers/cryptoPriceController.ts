import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Mapping of common symbols to CoinGecko IDs
const COIN_IDS: { [key: string]: string } = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ASTER: 'aster',
  USDT: 'tether',
  SOL: 'solana',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
  TRX: 'tron',
};

// Get crypto prices from CoinGecko and save to DB
export const getCryptoPrices = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const symbols = ['BTC', 'ETH', 'BNB', 'XRP', 'DOGE', 'SHIB'];
    const prices: any[] = [];

    // Get coin IDs for CoinGecko API
    const coinIds = symbols.map(symbol => COIN_IDS[symbol]).filter(Boolean);

    try {
      // Fetch from CoinGecko
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: coinIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
        },
        timeout: 5000,
      });

      // Process and save each price
      for (const symbol of symbols) {
        const coinId = COIN_IDS[symbol];
        const coinData = response.data[coinId];

        if (coinData) {
          // Save to database
          const savedPrice = await prisma.cryptoPrice.upsert({
            where: { symbol },
            update: {
              price: coinData.usd,
              change24h: coinData.usd_24h_change || 0,
              updatedAt: new Date(),
            },
            create: {
              symbol,
              name: symbol === 'BTC' ? 'Bitcoin' : 
                    symbol === 'ETH' ? 'Ethereum' :
                    symbol === 'BNB' ? 'BNB' :
                    symbol === 'XRP' ? 'XRP' :
                    symbol === 'DOGE' ? 'Dogecoin' :
                    symbol === 'SHIB' ? 'Shiba Inu' :
                    symbol === 'ASTER' ? 'Aster' : symbol,
              price: coinData.usd,
              change24h: coinData.usd_24h_change || 0,
            },
          });

          prices.push({
            symbol: savedPrice.symbol,
            name: savedPrice.name,
            price: savedPrice.price.toString(),
            change24h: savedPrice.change24h?.toString() || '0',
            updatedAt: savedPrice.updatedAt,
          });
        }
      }
    } catch (apiError) {
      console.error('CoinGecko API error:', apiError);
      
      // Fallback to last saved prices from database
      const savedPrices = await prisma.cryptoPrice.findMany({
        where: {
          symbol: {
            in: symbols,
          },
        },
      });

      if (savedPrices.length === 0) {
        throw new AppError('Unable to fetch crypto prices and no cached data available', 503);
      }

      prices.push(...savedPrices.map(p => ({
        symbol: p.symbol,
        name: p.name,
        price: p.price.toString(),
        change24h: p.change24h?.toString() || '0',
        updatedAt: p.updatedAt,
        cached: true,
      })));
    }

    return successResponse(res, prices, 'Crypto prices fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Get single crypto price
export const getCryptoPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { symbol } = req.params;
    
    const price = await prisma.cryptoPrice.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!price) {
      throw new AppError('Crypto price not found', 404);
    }

    return successResponse(res, {
      symbol: price.symbol,
      name: price.name,
      price: price.price.toString(),
      change24h: price.change24h?.toString() || '0',
      updatedAt: price.updatedAt,
    }, 'Price fetched successfully');
  } catch (error) {
    next(error);
  }
};
