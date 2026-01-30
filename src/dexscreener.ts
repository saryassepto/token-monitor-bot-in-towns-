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

interface DexScreenerResponse {
  pairs: TokenPair[];
}

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/pairs/base';

export async function fetchTopBaseTokens(limit: number = 5): Promise<TokenPair[]> {
  const response = await fetch(DEXSCREENER_API);

  if (!response.ok) {
    throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
  }

  const data: DexScreenerResponse = await response.json();

  if (!data.pairs || data.pairs.length === 0) {
    return [];
  }

  // Sort by 24h volume (highest first) and take top N
  const sorted = data.pairs
    .filter((pair) => pair.volume?.h24 > 0)
    .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
    .slice(0, limit);

  return sorted;
}
