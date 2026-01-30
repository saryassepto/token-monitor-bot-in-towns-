import { makeTownsBot, type BotHandler } from '@towns-protocol/bot';
import commands from './commands';
import { fetchTopBaseTokens, sortByTimeFrame, type TimeFrame } from './dexscreener';
import { formatLeaderboard, formatSingleToken } from './formatter';

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
      '**📋 List Commands:**\n' +
      '• `/trending` - Top 10 tokens (24h)\n' +
      '• `/hot` - Top 10 hottest (1h)\n' +
      '• `/rising` - Top 10 rising (6h)\n' +
      '• `/top20` `/top50` - More tokens\n' +
      '• `/hot20` `/hot50` - More hot tokens\n\n' +
      '**📈 Chart Commands:**\n' +
      '• `/charts` - Top 5 with token cards (24h)\n' +
      '• `/hotcharts` - Top 5 with token cards (1h)\n\n' +
      '💡 *Chart commands show visual token info!*'
  );
});

// Respond to mentions
bot.onMessage(async (handler: BotHandler, { message, channelId, isMentioned }) => {
  if (isMentioned) {
    await handler.sendMessage(
      channelId,
      'Hey! Try `/charts` for visual token info, or `/help` for all commands! 🚀'
    );
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
