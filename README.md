# Towns Bot - Base Token Tracker

A Towns Protocol bot that tracks top Base chain tokens using the DexScreener API.

## Commands

- `/p` - Get top 5 Base chain tokens by 24h volume
- `/help` - Show available commands
- Mention the bot - Get a quick response

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Configure environment variables:
   ```bash
   cp .env.sample .env
   ```
   
   Edit `.env` with your credentials from [Towns Developer Portal](https://towns.com/developer):
   - `APP_PRIVATE_DATA` - Your bot's private key
   - `JWT_SECRET` - For webhook verification
   - `PORT` - Server port (default: 5123)

3. Run the bot:
   ```bash
   bun run start
   ```

## Development

```bash
bun run dev
```

## Deploy on Render

1. Push code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `bun install`
   - **Start Command:** `bun run start`
5. Add environment variables:
   - `APP_PRIVATE_DATA`
   - `JWT_SECRET`
   - `PORT` = `5123`
6. Deploy!

## Configure Webhook

After deployment, go to [Towns Developer Portal](https://towns.com/developer):
1. Find your bot and click "Edit"
2. Set webhook URL: `https://your-app.onrender.com/webhook`
3. Save changes

## Bot Discovery

This bot includes the `/.well-known/agent-metadata.json` endpoint required for bot directories. After deploying, visit your bot's developer dashboard and click "Boost" to submit for indexing.

## Learn More

- [Towns Academy - Vibe Bot Guide](https://www.towns.com/academy/vibebot)
- [Towns Developer Portal](https://towns.com/developer)
