import { makeTownsBot, type BotHandler } from '@towns-protocol/bot';
import commands from './commands';
import { fetchTopBaseTokens } from './dexscreener';
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

// Register /p command - Get trending Base chain tokens
bot.onSlashCommand('p', async (handler: BotHandler, { channelId }) => {
  try {
    const tokens = await fetchTopBaseTokens(10);
    const message = formatLeaderboard(tokens);
    await handler.sendMessage(channelId, message);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    await handler.sendMessage(
      channelId,
      '❌ Failed to fetch token data. Please try again later.'
    );
  }
});

// Register /help command
bot.onSlashCommand('help', async (handler: BotHandler, { channelId }) => {
  await handler.sendMessage(
    channelId,
    '**Available Commands:**\n\n' +
      '• `/p` - Get top 5 Base chain tokens by 24h volume\n' +
      '• `/help` - Show this help message\n'
  );
});

// Respond to mentions
bot.onMessage(async (handler: BotHandler, { message, channelId, isMentioned }) => {
  if (isMentioned) {
    await handler.sendMessage(channelId, 'Hey! Use `/p` to see the top Base chain tokens! 🚀');
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
