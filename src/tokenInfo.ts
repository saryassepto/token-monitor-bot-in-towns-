/**
 * Fetch token symbol and name by contract address on Base (GeckoTerminal).
 */
const GECKO_TOKEN_URL = 'https://api.geckoterminal.com/api/v2/networks/base/tokens';

export interface TokenInfo {
  symbol: string;
  name: string;
}

export async function getTokenInfoByAddress(
  contractAddress: string
): Promise<TokenInfo | null> {
  const address = contractAddress.toLowerCase();
  try {
    const res = await fetch(`${GECKO_TOKEN_URL}/${address}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: { attributes?: { symbol?: string; name?: string } };
    };
    const attrs = data.data?.attributes;
    if (!attrs?.symbol || !attrs?.name) return null;
    return { symbol: attrs.symbol, name: attrs.name };
  } catch {
    return null;
  }
}
