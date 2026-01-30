import { makeTownsBot, type BotHandler } from '@towns-protocol/bot';
import commands from './commands';
import { fetchTopBaseTokens, sortByTimeFrame, type TimeFrame } from './dexscreener';
import { formatLeaderboard } from './formatter';

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

// === 10 TOKEN COMMANDS ===

// /trending - 24h, 10 tokens
bot.onSlashCommand('trending', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '24h', 10);
});

// /hot - 1h, 10 tokens
bot.onSlashCommand('hot', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '1h', 10);
});

// /rising - 6h, 10 tokens
bot.onSlashCommand('rising', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '6h', 10);
});

// === 20 TOKEN COMMANDS ===

// /top20 - 24h, 20 tokens
bot.onSlashCommand('top20', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '24h', 20);
});

// /hot20 - 1h, 20 tokens
bot.onSlashCommand('hot20', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '1h', 20);
});

// === 50 TOKEN COMMANDS ===

// /top50 - 24h, 50 tokens
bot.onSlashCommand('top50', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '24h', 50);
});

// /hot50 - 1h, 50 tokens
bot.onSlashCommand('hot50', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '1h', 50);
});

// === HELP ===

bot.onSlashCommand('help', async (handler: BotHandler, { channelId }) => {
  await handler.sendMessage(
    channelId,
    '**📊 Base Token Tracker Commands**\n\n' +
      '**Top 10 Tokens:**\n' +
      '• `/trending` - 24h volume\n' +
      '• `/hot` - 1h volume (hottest now)\n' +
      '• `/rising` - 6h volume\n\n' +
      '**Top 20 Tokens:**\n' +
      '• `/top20` - 24h volume\n' +
      '• `/hot20` - 1h volume\n\n' +
      '**Top 50 Tokens:**\n' +
      '• `/top50` - 24h volume\n' +
      '• `/hot50` - 1h volume\n\n' +
      '💡 *All commands include contract addresses for copying!*'
  );
});

// Respond to mentions
bot.onMessage(async (handler: BotHandler, { message, channelId, isMentioned }) => {
  if (isMentioned) {
    await handler.sendMessage(
      channelId,
      'Hey! Try `/trending`, `/hot`, `/top20`, `/top50` or `/help` for all commands! 🚀'
    );
  }
});

// Start the bot and get the Hono app
const app = bot.start();

// Add bot discovery endpoint (required for bot directories)
app.get('/.well-known/agent-metadata.json', async (c) => {
  return c.json(await bot.getIdentityMetadata());
});

// Export for Bun
export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`Towns bot started on port ${PORT}`);
