# Run the Towns bot with Bun in a container (Render Docker / Railway / Fly.io).
# Using Docker can avoid the SIGTERM issue some see with Render's Node runtime.
FROM oven/bun:1-alpine

WORKDIR /app

# Install deps first for better cache
COPY package.json ./
RUN bun install

COPY tsconfig.json ./
COPY src ./src

EXPOSE 5123

ENV PORT=5123
# Bun runs the script and keeps the process alive
CMD ["bun", "run", "src/index.ts"]
