import axios from 'axios';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

interface MoralisTokenPriceResponse {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string;
  tokenDecimals: string;
  nativePrice: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
  };
  usdPrice: number;
  usdPriceFormatted: string;
  exchangeAddress: string;
  exchangeName: string;
  tokenAddress: string;
}

interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: {
    [key: string]: number;
    INR: number;
  };
}

interface INRUSDTRate {
  inrPerUsdt: number;
  source: string;
  timestamp: Date;
}

/**
 * Fetch USD/INR rate from multiple sources with fallback
 */
export async function fetchUSDToINRRate(): Promise<number> {
  try {
    // Try exchangerate-api.com first (free, no key required)
    try {
      const response = await axios.get<ExchangeRateResponse>(
        'https://api.exchangerate-api.com/v4/latest/USD',
        { timeout: 5000 }
      );

      if (response.data && response.data.conversion_rates && response.data.conversion_rates.INR) {
        return response.data.conversion_rates.INR;
      }
    } catch (err) {
      // Silent fallback
    }

    // Fallback: Try fixer.io alternative (no key for basic)
    try {
      const response = await axios.get(
        'https://open.er-api.com/v6/latest/USD',
        { timeout: 5000 }
      );

      if (response.data && response.data.rates && response.data.rates.INR) {
        return response.data.rates.INR;
      }
    } catch (err) {
      // Silent fallback
    }

    throw new Error('All forex APIs failed');
  } catch (error) {
    // Fallback to a default rate
    return 83.0;
  }
}

/**
 * Fetch INR/USDT rate from Moralis API
 * This uses the USDT token price in USD from Moralis and USD/INR from exchange rate API
 */
export async function fetchINRUSDTRateFromMoralis(): Promise<INRUSDTRate> {
  try {
    if (!MORALIS_API_KEY) {
      throw new Error('MORALIS_API_KEY is not configured');
    }

    // USDT contract address on BSC
    const USDT_BSC_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
    
    // Fetch both USDT price from Moralis and USD/INR rate in parallel
    const [moralisResponse, usdToInrRate] = await Promise.all([
      axios.get<MoralisTokenPriceResponse>(
        `${MORALIS_BASE_URL}/erc20/${USDT_BSC_ADDRESS}/price`,
        {
          params: {
            chain: 'bsc',
          },
          headers: {
            accept: 'application/json',
            'X-API-Key': MORALIS_API_KEY,
          },
          timeout: 10000,
        }
      ),
      fetchUSDToINRRate(),
    ]);

    const usdtPriceInUSD = moralisResponse.data.usdPrice;

    // Calculate INR per USDT
    // USDT is pegged to USD (approximately 1:1), so INR per USDT ≈ USD_TO_INR_RATE * USDT_USD_PRICE
    const inrPerUsdt = usdtPriceInUSD * usdToInrRate;

    return {
      inrPerUsdt: Math.round(inrPerUsdt * 100) / 100, // Round to 2 decimal places
      source: 'moralis',
      timestamp: new Date(),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Moralis API error: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}
