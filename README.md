# Towns Bot - Base Token Tracker

A Towns Protocol bot that tracks top Base chain tokens (GeckoTerminal) and lets users **buy tokens with confirmation** using their Towns wallet.

## Commands

- **Lists:** `/trending` `/hot` `/rising` – top 10; `/top20` `/top50` `/hot20` `/hot50` – more
- **Charts:** `/charts` `/hotcharts` – token cards
- **Help:** `/help`

## Buy with confirmation

Mention the bot and say: **buy $50 of 0x…** (token contract address on Base).

1. The bot replies with a **confirmation form** (Confirm / Cancel).
2. You click **Confirm**.
3. The bot sends a **transaction request** to your Towns wallet.
4. You sign the swap in your wallet; tokens go to your linked wallet.

Uses your **Towns in-app wallet** – you sign and pay; the bot never holds your funds.

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
   - **Health Check Path:** `/` (or leave default; `render.yaml` sets it)
5. Add environment variables:
   - `APP_PRIVATE_DATA`
   - `JWT_SECRET`
   - `PORT` = `5123`
6. Deploy!

**Free tier:** The service may spin down after ~15 min of no traffic; the first request after that can take 30–60 s. To keep it warm, use an uptime monitor (e.g. [UptimeRobot](https://uptimerobot.com)) to ping `https://your-app.onrender.com/` every 5 minutes.

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
