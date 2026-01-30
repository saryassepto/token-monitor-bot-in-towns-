export interface TokenData {
  symbol: string;
  name: string;
  priceUsd: number;
  volume24h: number;
  priceChange24h: number;
}

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

// CoinGecko API for Base chain tokens (chain id: base)
const COINGECKO_API = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=base-ecosystem&order=volume_desc&per_page=5&page=1&sparkline=false';

export async function fetchTopBaseTokens(limit: number = 5): Promise<TokenData[]> {
  try {
    const response = await fetch(COINGECKO_API, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // Fallback to hardcoded popular Base tokens if CoinGecko fails
      return await fetchFallbackTokens();
    }

    const data: CoinGeckoToken[] = await response.json();

    if (!data || data.length === 0) {
      return await fetchFallbackTokens();
    }

    return data.slice(0, limit).map((token) => ({
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      priceUsd: token.current_price,
      volume24h: token.total_volume,
      priceChange24h: token.price_change_percentage_24h || 0,
    }));
  } catch (error) {
    console.error('CoinGecko fetch error:', error);
    return await fetchFallbackTokens();
  }
}

// Fallback: Fetch specific well-known Base tokens from DexScreener
async function fetchFallbackTokens(): Promise<TokenData[]> {
  const baseTokens = [
    '0x4200000000000000000000000000000000000006', // WETH
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
    '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', // cbETH
    '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC
  ];

  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${baseTokens.join(',')}`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error('DexScreener fallback failed');
    }

    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      throw new Error('No pairs found');
    }

    // Get unique tokens and sort by volume
    const tokenMap = new Map<string, TokenData>();
    
    for (const pair of data.pairs) {
      if (pair.chainId === 'base' && pair.baseToken) {
        const symbol = pair.baseToken.symbol;
        if (!tokenMap.has(symbol) || (pair.volume?.h24 || 0) > (tokenMap.get(symbol)?.volume24h || 0)) {
          tokenMap.set(symbol, {
            symbol: symbol,
            name: pair.baseToken.name,
            priceUsd: parseFloat(pair.priceUsd) || 0,
            volume24h: pair.volume?.h24 || 0,
            priceChange24h: pair.priceChange?.h24 || 0,
          });
        }
      }
    }

    return Array.from(tokenMap.values())
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 5);
  } catch (error) {
    console.error('Fallback fetch error:', error);
    throw new Error('Unable to fetch token data');
  }
}
