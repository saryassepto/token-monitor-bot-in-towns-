import type { BotCommand } from '@towns-protocol/bot';

const commands = [
  {
    name: 'trending',
    description: 'Top 10 trending tokens on Base (24h)',
  },
  {
    name: 'hot',
    description: 'Top 10 hottest tokens on Base (1 hour)',
  },
  {
    name: 'rising',
    description: 'Top 10 rising tokens on Base (6 hours)',
  },
  {
    name: 'help',
    description: 'Show available commands',
  },
] as const satisfies BotCommand[];

export default commands;
