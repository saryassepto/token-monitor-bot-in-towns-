import { makeTownsBot, type BotHandler, getSmartAccountFromUserId } from '@towns-protocol/bot';
import commands from './commands';
import { fetchTopBaseTokens, sortByTimeFrame, type TimeFrame } from './dexscreener';
import { formatLeaderboard, formatSingleToken } from './formatter';
import { parseBuyIntent } from './buyParser';
import { getEthPriceUsd, buildSwapTx } from './swap';

const APP_PRIVATE_DATA = process.env.APP_PRIVATE_DATA;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = parseInt(process.env.PORT || '5123', 10);

if (!APP_PRIVATE_DATA || !JWT_SECRET) {
  console.error('Missing required environment variables: APP_PRIVATE_DATA, JWT_SECRET');
  process.exit(1);
}

// Initialize bot
const bot = await makeTownsBot(APP_PRIVATE_DATA, JWT_SECRET, {
  commands,
});

// Pending buy confirmations: formId -> { userId, channelId, amountUsd, tokenCa }
const pendingBuys = new Map<
  string,
  { userId: string; channelId: string; amountUsd: number; tokenCa: `0x${string}` }
>();

// Helper function to handle token fetch and response
async function handleTrendingCommand(
  handler: BotHandler,
  channelId: string,
  timeFrame: TimeFrame,
  count: number
) {
  try {
    const tokens = await fetchTopBaseTokens(count);
    const sorted = sortByTimeFrame(tokens, timeFrame);
    const message = formatLeaderboard(sorted, timeFrame, count);
    await handler.sendMessage(channelId, message);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    await handler.sendMessage(
      channelId,
      '❌ Failed to fetch token data. Please try again later.'
    );
  }
}

// Handler for single token with chart
async function handleChartCommand(
  handler: BotHandler,
  channelId: string,
  timeFrame: TimeFrame
) {
  try {
    const tokens = await fetchTopBaseTokens(5);
    const sorted = sortByTimeFrame(tokens, timeFrame);
    
    // Send top 5 tokens with chart images
    for (let i = 0; i < Math.min(5, sorted.length); i++) {
      const token = sorted[i];
      const message = formatSingleToken(token, i + 1, timeFrame);
      const chartUrl = `https://www.dextools.io/resources/tokens/logos/base/${token.contractAddress}.png`;
      const dexScreenerChart = `https://dexscreener.com/base/${token.contractAddress}?embed=1&theme=dark&info=0`;
      
      // Send message with ticker attachment (shows token info card)
      await handler.sendMessage(channelId, message, {
        attachments: [
          {
            type: 'ticker',
            address: token.contractAddress,
            chainId: '8453', // Base chain ID
          },
        ],
      });
    }
  } catch (error) {
    console.error('Error fetching tokens:', error);
    await handler.sendMessage(
      channelId,
      '❌ Failed to fetch token data. Please try again later.'
    );
  }
}

// === 10 TOKEN COMMANDS ===

bot.onSlashCommand('trending', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '24h', 10);
});

bot.onSlashCommand('hot', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '1h', 10);
});

bot.onSlashCommand('rising', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '6h', 10);
});

// === CHART COMMANDS (with visual charts) ===

bot.onSlashCommand('charts', async (handler: BotHandler, { channelId }) => {
  await handleChartCommand(handler, channelId, '24h');
});

bot.onSlashCommand('hotcharts', async (handler: BotHandler, { channelId }) => {
  await handleChartCommand(handler, channelId, '1h');
});

// === 20 TOKEN COMMANDS ===

bot.onSlashCommand('top20', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '24h', 20);
});

bot.onSlashCommand('hot20', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '1h', 20);
});

// === 50 TOKEN COMMANDS ===

bot.onSlashCommand('top50', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '24h', 50);
});

bot.onSlashCommand('hot50', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '1h', 50);
});

// === HELP ===

bot.onSlashCommand('help', async (handler: BotHandler, { channelId }) => {
  await handler.sendMessage(
    channelId,
    '**📊 Base Token Tracker Commands**\n\n' +
      '**📋 List:** `/trending` `/hot` `/rising` `/top20` `/top50` `/hot20` `/hot50`\n\n' +
      '**📈 Charts:** `/charts` `/hotcharts` – token cards\n\n' +
      '**💰 Buy (with confirmation):**\n' +
      'Mention the bot and say: *buy $50 of 0x...*\n' +
      'You’ll get a confirmation form, then sign the swap in your Towns wallet.'
  );
});

// Respond to mentions (including "buy $X of [CA]")
bot.onMessage(async (handler: BotHandler, event) => {
  const { message, channelId, isMentioned } = event;
  const userId = (event as { userId?: string }).userId ?? (event as { creatorAddress?: string }).creatorAddress;
  if (!isMentioned) return;

  const buy = parseBuyIntent(message ?? '');
  if (buy && userId) {
    const formId = `buy-${Date.now()}-${userId}`;
    pendingBuys.set(formId, {
      userId,
      channelId,
      amountUsd: buy.amountUsd,
      tokenCa: buy.tokenCa,
    });
    await (handler as { sendInteractionRequest?: (ch: string, payload: unknown) => Promise<unknown> }).sendInteractionRequest?.(
      channelId,
      {
        type: 'form',
        id: formId,
        components: [
          { id: 'confirm', type: 'button', label: '✅ Confirm' },
          { id: 'cancel', type: 'button', label: '❌ Cancel' },
        ],
        recipient: userId,
      }
    );
    await handler.sendMessage(
      channelId,
      `**Confirm buy**\nSpend **$${buy.amountUsd}** (in ETH) to buy token:\n\`${buy.tokenCa}\`\n\nReact to the form above: **Confirm** to sign the swap in your wallet, or **Cancel** to abort.`
    );
    return;
  }

  await handler.sendMessage(
    channelId,
    'Hey! Try `/charts` or `/help`. To buy a token: *@me buy $50 of 0x...* (then confirm in the form). 🚀'
  );
});

// Handle confirmation form and transaction result
bot.onInteractionResponse?.(async (handler: BotHandler, event: unknown) => {
  const ev = event as {
    userId: string;
    channelId: string;
    response?: { payload?: { content?: { case?: string; value?: unknown } } };
  };
  const content = ev.response?.payload?.content;
  const caseType = content?.case;
  const value = content?.value;

  if (caseType === 'form' && value && typeof value === 'object' && 'id' in value) {
    const form = value as { id: string; components?: Array<{ id: string; component?: { case?: string } }> };
    const pending = pendingBuys.get(form.id);
    if (!pending) return;
    pendingBuys.delete(form.id);

    const confirmed = form.components?.some((c) => c.id === 'confirm');
    if (!confirmed) {
      await handler.sendMessage(ev.channelId, '❌ Buy cancelled.');
      return;
    }

    const walletRaw = await getSmartAccountFromUserId(bot, {
      userId: ev.userId as `0x${string}`,
    });
    if (!walletRaw) {
      await handler.sendMessage(
        ev.channelId,
        '❌ Link a wallet in Towns first (Settings → Wallet), then try again.'
      );
      return;
    }
    const wallet = walletRaw as `0x${string}`;

    try {
      const ethPriceUsd = await getEthPriceUsd();
      const tx = buildSwapTx({
        amountUsd: pending.amountUsd,
        ethPriceUsd,
        tokenCa: pending.tokenCa,
        recipientAddress: wallet,
      });
      await (handler as { sendInteractionRequest?: (ch: string, payload: unknown) => Promise<unknown> }).sendInteractionRequest?.(
        ev.channelId,
        {
          type: 'transaction',
          id: `swap-${form.id}`,
          title: 'Swap ETH for token',
          subtitle: `Spend ~$${pending.amountUsd} in ETH → token ${pending.tokenCa.slice(0, 10)}...`,
          tx: {
            chainId: tx.chainId,
            to: tx.to,
            value: '0x' + tx.value.toString(16),
            data: tx.data,
            signerWallet: wallet,
          },
          recipient: ev.userId,
        }
      );
      await handler.sendMessage(
        ev.channelId,
        '📤 **Sign the transaction** in your wallet to complete the buy. You’ll receive the tokens to your linked wallet.'
      );
    } catch (err) {
      console.error('Buy flow error:', err);
      await handler.sendMessage(
        ev.channelId,
        '❌ Could not prepare swap (e.g. ETH price fetch failed). Try again in a moment.'
      );
    }
    return;
  }

  if (caseType === 'transaction' && value && typeof value === 'object') {
    const txResult = value as { txHash?: string; error?: string };
    if (txResult.txHash) {
      await handler.sendMessage(
        ev.channelId,
        `✅ **Swap completed!**\nTx: \`${txResult.txHash}\``
      );
    } else if (txResult.error) {
      await handler.sendMessage(
        ev.channelId,
        `❌ Swap failed: ${txResult.error}`
      );
    }
  }
});

// Start the bot
const app = bot.start();

app.get('/.well-known/agent-metadata.json', async (c) => {
  return c.json(await bot.getIdentityMetadata());
});

export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`Towns bot started on port ${PORT}`);
