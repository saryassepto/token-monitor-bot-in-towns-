import type { BotCommand } from '@towns-protocol/bot';

const commands = [
  {
    name: 'p',
    description: 'Get top 10 trending tokens on Base chain',
  },
  {
    name: 'help',
    description: 'Show available commands',
  },
] as const satisfies BotCommand[];

export default commands;
