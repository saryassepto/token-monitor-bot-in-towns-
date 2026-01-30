export interface TokenData {
  symbol: string;
  name: string;
  priceUsd: number;
  volume24h: number;
  priceChange24h: number;
}

interface DexScreenerPair {
  chainId: string;
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
  pairs: DexScreenerPair[];
}

// Popular Base chain token addresses
const BASE_TOKENS = [
  '0x4200000000000000000000000000000000000006', // WETH
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
  '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', // cbETH
  '0x0000000000000000000000000000000000000000', // ETH
  '0x532f27101965dd16442E59d40670FaF5eBB142E4', // BRETT
  '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4', // TOSHI
  '0x9a26F5433671751C3276a065f57e5a02D2817973', // DEGEN
];

export async function fetchTopBaseTokens(limit: number = 5): Promise<TokenData[]> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${BASE_TOKENS.join(',')}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TownsBot/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      throw new Error('No pairs found');
    }

    // Get unique tokens from Base chain, pick highest volume pair for each
    const tokenMap = new Map<string, TokenData>();

    for (const pair of data.pairs) {
      if (pair.chainId === 'base' && pair.baseToken && pair.priceUsd) {
        const symbol = pair.baseToken.symbol;
        const volume = pair.volume?.h24 || 0;
        
        // Only keep the pair with highest volume for each token
        const existing = tokenMap.get(symbol);
        if (!existing || volume > existing.volume24h) {
          tokenMap.set(symbol, {
            symbol: symbol,
            name: pair.baseToken.name,
            priceUsd: parseFloat(pair.priceUsd) || 0,
            volume24h: volume,
            priceChange24h: pair.priceChange?.h24 || 0,
          });
        }
      }
    }

    // Sort by volume and return top N
    return Array.from(tokenMap.values())
      .filter(t => t.volume24h > 0)
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, limit);

  } catch (error) {
    console.error('DexScreener fetch error:', error);
    throw error;
  }
}
