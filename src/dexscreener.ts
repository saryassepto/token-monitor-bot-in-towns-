export interface TokenData {
  symbol: string;
  name: string;
  priceUsd: number;
  volume24h: number;
  volume6h: number;
  volume1h: number;
  priceChange24h: number;
  priceChange6h: number;
  priceChange1h: number;
  contractAddress: string;
}

interface GeckoTerminalPool {
  attributes: {
    name: string;
    base_token_price_usd: string;
    volume_usd: {
      h1: string;
      h6: string;
      h24: string;
    };
    price_change_percentage: {
      h1: string;
      h6: string;
      h24: string;
    };
  };
  relationships: {
    base_token: {
      data: {
        id: string;
      };
    };
  };
}

interface GeckoTerminalResponse {
  data: GeckoTerminalPool[];
}

export type TimeFrame = '1h' | '6h' | '24h';

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
      const symbol = tokenName.split(' ')[0];
      
      // Skip duplicates and stablecoins/wrapped tokens
      if (seen.has(symbol)) continue;
      if (['WETH', 'USDC', 'USDT', 'DAI', 'USDbC'].includes(symbol)) continue;
      
      seen.add(symbol);

      // Extract contract address from base_token id (e.g., "base_0x1234..." -> "0x1234...")
      const tokenId = pool.relationships?.base_token?.data?.id || '';
      const contractAddress = tokenId.replace('base_', '');

      const priceUsd = parseFloat(attr.base_token_price_usd) || 0;
      const volume24h = parseFloat(attr.volume_usd?.h24) || 0;
      const volume6h = parseFloat(attr.volume_usd?.h6) || 0;
      const volume1h = parseFloat(attr.volume_usd?.h1) || 0;
      const priceChange24h = parseFloat(attr.price_change_percentage?.h24) || 0;
      const priceChange6h = parseFloat(attr.price_change_percentage?.h6) || 0;
      const priceChange1h = parseFloat(attr.price_change_percentage?.h1) || 0;

      tokens.push({
        symbol,
        name: symbol,
        priceUsd,
        volume24h,
        volume6h,
        volume1h,
        priceChange24h,
        priceChange6h,
        priceChange1h,
        contractAddress,
      });

      if (tokens.length >= limit) break;
    }

    return tokens;

  } catch (error) {
    console.error('GeckoTerminal fetch error:', error);
    throw error;
  }
}

// Sort tokens by volume for specific timeframe
export function sortByTimeFrame(tokens: TokenData[], timeFrame: TimeFrame): TokenData[] {
  const sorted = [...tokens];
  
  switch (timeFrame) {
    case '1h':
      return sorted.sort((a, b) => b.volume1h - a.volume1h);
    case '6h':
      return sorted.sort((a, b) => b.volume6h - a.volume6h);
    case '24h':
    default:
      return sorted.sort((a, b) => b.volume24h - a.volume24h);
  }
}
