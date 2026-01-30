import type { TokenPair } from './dexscreener';

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (num < 0.0001) {
    return `$${num.toExponential(2)}`;
  }
  if (num < 1) {
    return `$${num.toFixed(6)}`;
  }
  return `$${num.toFixed(2)}`;
}

function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export function formatLeaderboard(tokens: TokenPair[]): string {
  if (tokens.length === 0) {
    return '❌ No tokens found on Base chain.';
  }

  const header = '🏆 **Top 5 Base Chain Tokens by 24h Volume**\n\n';

  const rows = tokens.map((token, index) => {
    const rank = index + 1;
    const symbol = token.baseToken.symbol;
    const price = formatPrice(token.priceUsd);
    const volume = formatNumber(token.volume.h24);
    const change = formatPriceChange(token.priceChange.h24);

    return `**${rank}.** ${symbol}\n   💵 ${price} | 📊 ${volume} | ${change}`;
  });

  return header + rows.join('\n\n');
}
