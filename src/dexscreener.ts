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
  poolAddress: string;
  dexId: string;
}

interface GeckoTerminalPool {
  attributes: {
    name: string;
    address: string;
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
    dex: {
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

export async function fetchTopBaseTokens(limit: number = 10): Promise<TokenData[]> {
  try {
    // Fetch multiple pages if needed for larger requests
    const pages = Math.ceil(limit / 20);
    const allPools: GeckoTerminalPool[] = [];

    for (let page = 1; page <= pages; page++) {
      const url = `https://api.geckoterminal.com/api/v2/networks/base/trending_pools?page=${page}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (page === 1) {
          throw new Error(`GeckoTerminal API error: ${response.status}`);
        }
        break;
      }

      const data: GeckoTerminalResponse = await response.json();
      if (data.data && data.data.length > 0) {
        allPools.push(...data.data);
      } else {
        break;
      }
    }

    if (allPools.length === 0) {
      throw new Error('No trending pools found');
    }

    // Parse the pool data and extract token info
    const seen = new Set<string>();
    const tokens: TokenData[] = [];

    for (const pool of allPools) {
      const attr = pool.attributes;
      
      // Extract token name from pool name
      const poolName = attr.name || '';
      const parts = poolName.split(' / ');
      if (parts.length < 2) continue;
      
      const tokenName = parts[0].trim();
      const symbol = tokenName.split(' ')[0];
      
      // Skip duplicates and stablecoins/wrapped tokens
      if (seen.has(symbol)) continue;
      if (['WETH', 'USDC', 'USDT', 'DAI', 'USDbC', 'cbETH'].includes(symbol)) continue;
      
      seen.add(symbol);

      // Extract contract address and pool address
      const tokenId = pool.relationships?.base_token?.data?.id || '';
      const contractAddress = tokenId.replace('base_', '');
      const poolAddress = attr.address || '';
      const dexId = pool.relationships?.dex?.data?.id || '';

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
        poolAddress,
        dexId,
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
