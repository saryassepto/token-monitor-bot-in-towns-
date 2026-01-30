# Towns Bot - Base Token Tracker

A production-ready Towns Protocol bot that tracks top Base chain tokens.

## Commands

- `/p` - Get top 5 Base chain tokens by 24h volume

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.sample .env
   ```
   
   Edit `.env` with your credentials:
   - `APP_PRIVATE_DATA` - Your Towns app private data
   - `JWT_SECRET` - Your JWT secret
   - `PORT` - HTTP server port (default: 3000)

3. Run the bot:
   ```bash
   npm start
   ```

## Development

```bash
npm run dev
```

## Deploy on Render

1. Create a new Web Service
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables in Render dashboard:
   - `APP_PRIVATE_DATA`
   - `JWT_SECRET`
   - `PORT` (optional, Render provides this)
5. The health check endpoint is available at `/health`

## Requirements

- Node.js 20+
