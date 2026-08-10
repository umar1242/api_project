import { Bot } from 'grammy';
import { config } from './config';
import { apiClient } from './api/api.client';

const bot = new Bot(config.telegramToken);

bot.command('start', async (ctx) => {
  const firstName = ctx.from?.first_name ?? 'Student';
  const lastName = ctx.from?.last_name ?? '';
  const telegramId = ctx.from?.id;

  if (telegramId) {
    try {
      await apiClient.post('/users/upsert', {
        telegramId,
        fullName: `${firstName} ${lastName}`.trim(),
      });
    } catch (err) {
      console.error(`[Material Bot] Failed to upsert user ${telegramId}:`, err);
    }
  }

  await ctx.reply(
    `Welcome, <b>${firstName}</b>! Click the button below to view course materials.`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📚 Open Materials',
              web_app: { url: config.miniAppUrl },
            },
          ],
        ],
      },
    }
  );
});

bot.catch((err) => {
  console.error('Bot Error:', err);
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Material bot started as @${botInfo.username}`);
  },
});

process.once('SIGTERM', () => {
  console.log('SIGTERM received — stopping...');
  bot.stop();
});
process.once('SIGINT', () => {
  console.log('SIGINT received — stopping...');
  bot.stop();
});
