import type { TokenData, TimeFrame } from './dexscreener';

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

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatLeaderboard(tokens: TokenData[], timeFrame: TimeFrame = '24h'): string {
  if (tokens.length === 0) {
    return '❌ No trending tokens found on Base chain.';
  }

  const timeLabels: Record<TimeFrame, string> = {
    '1h': '1 Hour',
    '6h': '6 Hours',
    '24h': '24 Hours',
  };

  const header = `🔥 **Top Trending Base Tokens (${timeLabels[timeFrame]})**\n\n`;

  const rows = tokens.map((token, index) => {
    const rank = index + 1;
    const symbol = token.symbol;
    const price = formatPrice(token.priceUsd);
    
    // Select volume and change based on timeframe
    let volume: string;
    let change: string;
    
    switch (timeFrame) {
      case '1h':
        volume = formatVolume(token.volume1h);
        change = formatPriceChange(token.priceChange1h);
        break;
      case '6h':
        volume = formatVolume(token.volume6h);
        change = formatPriceChange(token.priceChange6h);
        break;
      case '24h':
      default:
        volume = formatVolume(token.volume24h);
        change = formatPriceChange(token.priceChange24h);
    }

    const ca = token.contractAddress;
    const shortCA = shortenAddress(ca);

    return `**${rank}. $${symbol}**\n` +
           `   💵 ${price} | 📊 ${volume} | ${change}\n` +
           `   📋 \`${ca}\``;
  });

  const footer = '\n\n💡 *Tap CA to copy*';

  return header + rows.join('\n\n') + footer;
}
