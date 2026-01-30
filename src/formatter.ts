import type { TokenData } from './dexscreener';

function formatVolume(num: number): string {
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

function formatPrice(price: number): string {
  if (price === 0) return '$0.00';
  if (price < 0.00000001) {
    return `$${price.toExponential(2)}`;
  }
  if (price < 0.0001) {
    return `$${price.toFixed(10).replace(/\.?0+$/, '')}`;
  }
  if (price < 1) {
    return `$${price.toFixed(6)}`;
  }
  if (price < 1000) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  const emoji = change >= 0 ? '🟢' : '🔴';
  return `${emoji} ${sign}${change.toFixed(2)}%`;
}

export function formatLeaderboard(tokens: TokenData[]): string {
  if (tokens.length === 0) {
    return '❌ No trending tokens found on Base chain.';
  }

  const header = '🔥 **Top Trending Tokens on Base Chain**\n\n';

  const rows = tokens.map((token, index) => {
    const rank = index + 1;
    const symbol = token.symbol;
    const price = formatPrice(token.priceUsd);
    const volume = formatVolume(token.volume24h);
    const change = formatPriceChange(token.priceChange24h);

    return `**${rank}. $${symbol}**\n   💵 ${price} | 📊 ${volume} | ${change}`;
  });

  return header + rows.join('\n\n');
}
