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
  return `${emoji}${sign}${change.toFixed(1)}%`;
}

function getChartUrl(contractAddress: string): string {
  // DexScreener chart URL for Base chain
  return `https://dexscreener.com/base/${contractAddress}`;
}

function getGeckoTerminalUrl(poolAddress: string): string {
  return `https://www.geckoterminal.com/base/pools/${poolAddress}`;
}

export function formatLeaderboard(
  tokens: TokenData[],
  timeFrame: TimeFrame = '24h',
  count: number = 10
): string {
  if (tokens.length === 0) {
    return '❌ No trending tokens found on Base chain.';
  }

  const timeLabels: Record<TimeFrame, string> = {
    '1h': '1H',
    '6h': '6H',
    '24h': '24H',
  };

  const header = `🔥 **Top ${count} Base Tokens (${timeLabels[timeFrame]})**\n\n`;

  // For large lists (20+), use compact format
  const isCompact = count > 10;

  const rows = tokens.slice(0, count).map((token, index) => {
    const rank = index + 1;
    const symbol = token.symbol;
    const price = formatPrice(token.priceUsd);
    
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
    const chartUrl = getChartUrl(ca);

    if (isCompact) {
      // Compact format for 20+ tokens
      return `**${rank}.** $${symbol} | ${price} | ${volume} | ${change}\n` +
             `📋 \`${ca}\`\n` +
             `📈 [Chart](${chartUrl})`;
    } else {
      // Full format for 10 tokens
      return `**${rank}. $${symbol}**\n` +
             `   💵 ${price} | 📊 ${volume} | ${change}\n` +
             `   📋 \`${ca}\`\n` +
             `   📈 [View Chart](${chartUrl})`;
    }
  });

  const footer = '\n\n💡 *Tap CA to copy • Click chart to view*';

  return header + rows.join('\n\n') + footer;
}
