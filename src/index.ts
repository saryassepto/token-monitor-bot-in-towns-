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
  timeFrame: TimeFrame
) {
  try {
    const tokens = await fetchTopBaseTokens(10);
    const sorted = sortByTimeFrame(tokens, timeFrame);
    const message = formatLeaderboard(sorted, timeFrame);
    await handler.sendMessage(channelId, message);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    await handler.sendMessage(
      channelId,
      '❌ Failed to fetch token data. Please try again later.'
    );
  }
}

// Register /trending command - 24h trending
bot.onSlashCommand('trending', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '24h');
});

// Register /hot command - 1h trending (hottest right now)
bot.onSlashCommand('hot', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '1h');
});

// Register /rising command - 6h trending
bot.onSlashCommand('rising', async (handler: BotHandler, { channelId }) => {
  await handleTrendingCommand(handler, channelId, '6h');
});

// Register /help command
bot.onSlashCommand('help', async (handler: BotHandler, { channelId }) => {
  await handler.sendMessage(
    channelId,
    '**📊 Base Token Tracker Commands**\n\n' +
      '• `/trending` - Top 10 trending tokens (24h volume)\n' +
      '• `/hot` - Top 10 hottest tokens (1h volume)\n' +
      '• `/rising` - Top 10 rising tokens (6h volume)\n' +
      '• `/help` - Show this help message\n\n' +
      '💡 *Contract addresses included for easy copying!*'
  );
});

// Respond to mentions
bot.onMessage(async (handler: BotHandler, { message, channelId, isMentioned }) => {
  if (isMentioned) {
    await handler.sendMessage(
      channelId,
      'Hey! Try `/trending`, `/hot`, or `/rising` to see Base tokens! 🚀'
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
