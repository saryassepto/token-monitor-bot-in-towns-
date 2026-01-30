export interface TokenData {
  symbol: string;
  name: string;
  priceUsd: number;
  volume24h: number;
  priceChange24h: number;
}

interface GeckoTerminalPool {
  attributes: {
    name: string;
    base_token_price_usd: string;
    volume_usd: {
      h24: string;
    };
    price_change_percentage: {
      h24: string;
    };
  };
}

interface GeckoTerminalResponse {
  data: GeckoTerminalPool[];
}

// GeckoTerminal API - Trending pools on Base chain
const GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2/networks/base/trending_pools';

export async function fetchTopBaseTokens(limit: number = 10): Promise<TokenData[]> {
  try {
    const response = await fetch(GECKOTERMINAL_API, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }

    const data: GeckoTerminalResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('No trending pools found');
    }

    // Parse the pool data and extract token info
    const seen = new Set<string>();
    const tokens: TokenData[] = [];

    for (const pool of data.data) {
      const attr = pool.attributes;
      
      // Extract token name from pool name (e.g., "CLAWD / WETH" -> "CLAWD")
      const poolName = attr.name || '';
      const parts = poolName.split(' / ');
      if (parts.length < 2) continue;
      
      const tokenName = parts[0].trim();
      // Remove percentage from name if present (e.g., "CLAWD / WETH 838.861%")
      const symbol = tokenName.split(' ')[0];
      
      // Skip duplicates and stablecoins/wrapped tokens
      if (seen.has(symbol)) continue;
      if (['WETH', 'USDC', 'USDT', 'DAI', 'USDbC'].includes(symbol)) continue;
      
      seen.add(symbol);

      const priceUsd = parseFloat(attr.base_token_price_usd) || 0;
      const volume24h = parseFloat(attr.volume_usd?.h24) || 0;
      const priceChange24h = parseFloat(attr.price_change_percentage?.h24) || 0;

      tokens.push({
        symbol,
        name: symbol, // GeckoTerminal doesn't give full name, use symbol
        priceUsd,
        volume24h,
        priceChange24h,
      });

      if (tokens.length >= limit) break;
    }

    return tokens;

  } catch (error) {
    console.error('GeckoTerminal fetch error:', error);
    throw error;
  }
}
