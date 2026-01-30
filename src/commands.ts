import type { BotCommand } from '@towns-protocol/bot';

const commands = [
  // Default commands (10 tokens)
  {
    name: 'trending',
    description: 'Top 10 trending tokens (24h)',
  },
  {
    name: 'hot',
    description: 'Top 10 hottest tokens (1h)',
  },
  {
    name: 'rising',
    description: 'Top 10 rising tokens (6h)',
  },
  // Extended lists (20 tokens)
  {
    name: 'top20',
    description: 'Top 20 trending tokens (24h)',
  },
  {
    name: 'hot20',
    description: 'Top 20 hottest tokens (1h)',
  },
  // Large lists (50 tokens)
  {
    name: 'top50',
    description: 'Top 50 trending tokens (24h)',
  },
  {
    name: 'hot50',
    description: 'Top 50 hottest tokens (1h)',
  },
  // Help
  {
    name: 'help',
    description: 'Show available commands',
  },
] as const satisfies BotCommand[];

export default commands;
