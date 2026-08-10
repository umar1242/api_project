import { Bot } from 'grammy';
import { config } from './config';
import { registerStartHandler } from './handlers/start.handler';
import { registerScheduleHandler } from './handlers/schedule.handler';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const bot = new Bot(config.telegramToken);

// Register command handlers
registerStartHandler(bot);
registerScheduleHandler(bot);

// Global error handler — never let an unhandled error crash the process
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[Main Bot] Error while handling update ${ctx.update.update_id}:`);
  console.error(err.error);
});

// Start polling
bot.start({
  onStart: (botInfo) => {
    console.log(`[Main Bot] Started as @${botInfo.username} (env=${config.nodeEnv})`);
    console.log(`[Main Bot] API → ${config.apiBaseUrl}`);
    console.log(`[Main Bot] Mini App → ${config.miniAppUrl}`);
  },
});

// Graceful shutdown
process.once('SIGTERM', () => {
  console.log('[Main Bot] SIGTERM received — stopping...');
  bot.stop();
});

process.once('SIGINT', () => {
  console.log('[Main Bot] SIGINT received — stopping...');
  bot.stop();
});
