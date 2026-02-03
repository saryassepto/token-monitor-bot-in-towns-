import { encodeFunctionData, parseEther } from 'viem';

const BASE_CHAIN_ID = '8453';
const BASE_WETH = '0x4200000000000000000000000000000000000006' as const;
// Uniswap V2–style router on Base
const ROUTER_ADDRESS = '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24' as const;

const ROUTER_ABI = [
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256[]' }],
  },
] as const;

/** Fetch ETH price in USD (simple fallback). */
export async function getEthPriceUsd(): Promise<number> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) throw new Error('ETH price fetch failed');
  const data = (await res.json()) as { ethereum?: { usd?: number } };
  const price = data.ethereum?.usd;
  if (typeof price !== 'number' || price <= 0) throw new Error('Invalid ETH price');
  return price;
}

/** Build swap tx: spend ~amountUsd worth of ETH, receive token to recipient. */
export function buildSwapTx(params: {
  amountUsd: number;
  ethPriceUsd: number;
  tokenCa: `0x${string}`;
  recipientAddress: `0x${string}`;
  slippagePercent?: number;
}): { to: `0x${string}`; value: bigint; data: `0x${string}`; chainId: string } {
  const {
    amountUsd,
    ethPriceUsd,
    tokenCa,
    recipientAddress,
    slippagePercent = 2,
  } = params;

  const ethAmount = amountUsd / ethPriceUsd;
  const valueWei = parseEther(ethAmount.toFixed(18));

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 min
  const amountOutMin = BigInt(0); // Allow high slippage for unknown pools; user sees amount in wallet

  const path = [BASE_WETH, tokenCa] as readonly [`0x${string}`, `0x${string}`];

  const data = encodeFunctionData({
    abi: ROUTER_ABI,
    functionName: 'swapExactETHForTokens',
    args: [amountOutMin, path, recipientAddress, deadline],
  });

  return {
    to: ROUTER_ADDRESS,
    value: valueWei,
    data,
    chainId: BASE_CHAIN_ID,
  };
}
