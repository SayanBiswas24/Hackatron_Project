import axios from 'axios';

interface PriceCache {
  rate: number;
  timestamp: number;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache
let globalCache: PriceCache | null = null;

/**
 * Fetches the live USD/INR exchange rate from CoinGecko.
 * USD-Coin (USDC) is used as the reference stablecoin.
 */
export async function getExchangeRate(): Promise<number> {
  const now = Date.now();

  // Return cached rate if still valid
  if (globalCache && now - globalCache.timestamp < CACHE_TTL) {
    console.log('📈 Using cached exchange rate:', globalCache.rate);
    return globalCache.rate;
  }

  try {
    console.log('🔄 Fetching live exchange rate from CoinGecko...');
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=inr'
    );

    const rate = response.data['usd-coin']?.inr;

    if (!rate || typeof rate !== 'number') {
      throw new Error('Invalid response from CoinGecko');
    }

    // Update stash
    globalCache = {
      rate,
      timestamp: now,
    };

    console.log('✅ Updated exchange rate:', rate);
    return rate;
  } catch (error: any) {
    console.error('❌ Failed to fetch exchange rate:', error.message);
    
    // Fallback if cache is totally empty
    if (globalCache) return globalCache.rate;
    
    // Hardcoded fallback for emergency/dev (average current rate)
    return 88.50;
  }
}
