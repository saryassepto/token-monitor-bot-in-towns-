export interface TokenPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  volume: {
    h24: number;
  };
  priceChange: {
    h24: number;
  };
}

interface DexScreenerSearchResponse {
  pairs: TokenPair[];
}

// Use search API to find Base chain pairs
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/search?q=base';

export async function fetchTopBaseTokens(limit: number = 5): Promise<TokenPair[]> {
  try {
    const response = await fetch(DEXSCREENER_API, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TownsBot/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
    }

    const data: DexScreenerSearchResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return [];
    }

    // Filter for Base chain pairs and sort by 24h volume
    const basePairs = data.pairs
      .filter((pair) => pair.chainId === 'base' && pair.volume?.h24 > 0)
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, limit);

    return basePairs;
  } catch (error) {
    console.error('DexScreener fetch error:', error);
    throw error;
  }
}
