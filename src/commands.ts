import type { BotCommand } from '@towns-protocol/bot';

const commands = [
  {
    name: 'p',
    description: 'Top 10 trending tokens on Base (24h)',
  },
  {
    name: 'p1h',
    description: 'Top 10 trending tokens on Base (1 hour)',
  },
  {
    name: 'p6h',
    description: 'Top 10 trending tokens on Base (6 hours)',
  },
  {
    name: 'help',
    description: 'Show available commands',
  },
] as const satisfies BotCommand[];

export default commands;
