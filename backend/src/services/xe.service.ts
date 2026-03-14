import https from 'https';

// In-memory cache for exchange rates
interface CachedRate {
  rate: number;
  timestamp: number;
}

const rateCache = new Map<string, CachedRate>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// XE API configuration
const XE_API_HOST = 'xecdapi.xe.com';

function getCacheKey(from: string, to: string): string {
  return `${from.toUpperCase()}_${to.toUpperCase()}`;
}

function getCachedRate(from: string, to: string): number | null {
  const key = getCacheKey(from, to);
  const cached = rateCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.rate;
  }

  return null;
}

function setCachedRate(from: string, to: string, rate: number): void {
  const key = getCacheKey(from, to);
  rateCache.set(key, { rate, timestamp: Date.now() });
}

interface XEResponse {
  to: Array<{
    quotecurrency: string;
    mid: number;
  }>;
}

function makeRequest(accountId: string, apiKey: string, from: string, to: string): Promise<XEResponse> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${accountId}:${apiKey}`).toString('base64');
    const path = `/v1/convert_from.json?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=1`;

    const options: https.RequestOptions = {
      hostname: XE_API_HOST,
      port: 443,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 401) {
          reject(new Error('XE API authentication failed. Check your credentials.'));
          return;
        }
        if (res.statusCode === 429) {
          reject(new Error('XE API rate limit exceeded. Please try again later.'));
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`XE API error: HTTP ${res.statusCode}`));
          return;
        }

        try {
          const parsed = JSON.parse(data) as XEResponse;
          resolve(parsed);
        } catch {
          reject(new Error('Failed to parse XE API response'));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`XE API request failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('XE API request timeout'));
    });

    req.end();
  });
}

export interface ConversionResult {
  convertedAmount: number;
  exchangeRate: number;
}

export const xeService = {
  /**
   * Get exchange rate from one currency to another.
   * Uses XE API if credentials are available, throws error if not configured.
   * Results are cached for 1 hour.
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    // Same currency - no conversion needed
    if (fromUpper === toUpper) {
      return 1;
    }

    // Check cache first
    const cachedRate = getCachedRate(fromUpper, toUpper);
    if (cachedRate !== null) {
      return cachedRate;
    }

    // Check for XE API credentials
    const accountId = process.env.XE_ACCOUNT_ID;
    const apiKey = process.env.XE_API_KEY;

    if (!accountId || !apiKey) {
      throw new Error('XE API credentials not configured. Set XE_ACCOUNT_ID and XE_API_KEY environment variables.');
    }

    const response = await makeRequest(accountId, apiKey, fromUpper, toUpper);

    // XE API response format: { to: [{ quotecurrency: 'USD', mid: 1.23 }] }
    const toArray = response.to;
    if (!toArray || !toArray[0] || typeof toArray[0].mid !== 'number') {
      throw new Error(`Unexpected XE API response format for ${fromUpper} to ${toUpper}`);
    }

    const rate = toArray[0].mid;

    // Cache the rate
    setCachedRate(fromUpper, toUpper, rate);

    // Also cache the inverse rate for efficiency
    if (rate !== 0) {
      setCachedRate(toUpper, fromUpper, 1 / rate);
    }

    return rate;
  },

  /**
   * Convert an amount from one currency to another.
   * Returns the converted amount and the exchange rate used.
   */
  async convertAmount(amount: number, from: string, to: string): Promise<ConversionResult> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    // Same currency - no conversion needed
    if (fromUpper === toUpper) {
      return {
        convertedAmount: amount,
        exchangeRate: 1,
      };
    }

    const rate = await this.getExchangeRate(fromUpper, toUpper);
    const convertedAmount = Math.round(amount * rate * 100) / 100; // Round to 2 decimal places

    return {
      convertedAmount,
      exchangeRate: rate,
    };
  },

  /**
   * Clear the rate cache. Useful for testing or forcing fresh rates.
   */
  clearCache(): void {
    rateCache.clear();
  },

  /**
   * Check if XE API is configured (credentials are present).
   */
  isConfigured(): boolean {
    return !!(process.env.XE_ACCOUNT_ID && process.env.XE_API_KEY);
  },
};
