import type { BotCommand } from '@towns-protocol/bot';

const commands = [
  {
    name: 'p',
    description: 'Get top 5 Base chain tokens by 24h volume',
  },
  {
    name: 'help',
    description: 'Show available commands',
  },
] as const satisfies BotCommand[];

export default commands;
