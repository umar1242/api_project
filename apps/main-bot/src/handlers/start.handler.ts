import { Bot, Context } from 'grammy';
import { config } from '../config';
import { apiClient } from '../api/api.client';

/**
 * Registers the /start command handler for the Main Bot.
 *
 * The Main Bot is the student's primary touchpoint:
 * - /start → Welcome message + "Open Dashboard" WebApp button
 * - /schedule → Upcoming lessons (see schedule.handler.ts)
 * - /help → Command list
 */
export function registerStartHandler(bot: Bot<Context>): void {
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
        console.error(`[Main Bot] Failed to upsert user ${telegramId}:`, err);
      }
    }

    await ctx.reply(
      `👋 Hello, <b>${firstName}</b>!\n\nWelcome to your <b>Student Dashboard</b>.\n\nUse the button below to access your schedule, progress, and profile — or type /schedule for a quick look at upcoming lessons.`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: '📱 Open Dashboard', web_app: { url: config.miniAppUrl } }],
            [{ text: '📅 My Schedule' }, { text: '❓ Help' }],
          ],
          resize_keyboard: true,
        },
      },
    );
  });

  bot.hears('📅 My Schedule', async (ctx) => {
    await ctx.reply('Use /schedule to view your upcoming lessons.');
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `<b>Available Commands</b>\n\n/start — Open the dashboard\n/schedule — View upcoming lessons\n/help — Show this message`,
      { parse_mode: 'HTML' },
    );
  });
}
