/**
 * Parse "buy $X of [CA]" from a message.
 * Matches patterns like:
 *   buy $50 of 0x...
 *   buy $100 of 0x...
 *   hey @bot buy $25 of 0x1234...
 */
const BUY_PATTERN =
  /buy\s+\$?\s*([\d.,]+)\s+of\s+(0x[a-fA-F0-9]{40})\b/i;

export interface BuyIntent {
  amountUsd: number;
  tokenCa: `0x${string}`;
}

export function parseBuyIntent(message: string): BuyIntent | null {
  const trimmed = message.trim();
  const match = trimmed.match(BUY_PATTERN);
  if (!match) return null;

  const amountStr = match[1].replace(/,/g, '');
  const amountUsd = parseFloat(amountStr);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || amountUsd > 1_000_000) {
    return null;
  }

  const tokenCa = match[2].toLowerCase() as `0x${string}`;
  if (!/^0x[a-f0-9]{40}$/.test(tokenCa)) return null;

  return { amountUsd, tokenCa };
}
