import { makeTownsBot, type BotHandler } from '@towns-protocol/bot';
import { serve } from '@hono/node-server';
import commands from './commands';
import { fetchTopBaseTokens } from './dexscreener';
import { formatLeaderboard } from './formatter';
import { startHealthServer } from './server';

const APP_PRIVATE_DATA = process.env.APP_PRIVATE_DATA;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = parseInt(process.env.PORT || '3000', 10);

if (!APP_PRIVATE_DATA || !JWT_SECRET) {
  console.error('Missing required environment variables: APP_PRIVATE_DATA, JWT_SECRET');
  process.exit(1);
}

// Start health check server for Render
startHealthServer(PORT);

// Initialize bot
const bot = await makeTownsBot(APP_PRIVATE_DATA, JWT_SECRET, {
  commands,
});

// Register /p command
bot.onSlashCommand('p', async (handler: BotHandler, { channelId }) => {
  try {
    const tokens = await fetchTopBaseTokens(5);
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

// Start the bot webhook server
const app = bot.start();
serve({
  fetch: app.fetch,
  port: PORT + 1,
});
console.log(`Towns bot started successfully on port ${PORT + 1}`);
