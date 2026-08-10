import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';

/**
 * /start command handler.
 *
 * Actions:
 * 1. Upsert the user in the database via the API (idempotent).
 * 2. Show the main admin menu.
 */
export async function startHandler(ctx: CommandContext<Context>): Promise<void> {
  const tgUser = ctx.from;
  if (!tgUser) {
    await ctx.reply('❌ Could not identify user.');
    return;
  }

  try {
    const user = await apiClient.upsertUser({
      telegramId: tgUser.id,
      fullName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
      role: 'ADMIN', // Admin bot only accessible to admins
    });

    await ctx.api.setChatMenuButton({
      chat_id: ctx.chat.id,
      menu_button: {
        type: 'web_app',
        text: 'Admin Panel',
        web_app: { url: require('../config').config.webAppUrl }
      }
    });

    await ctx.reply(
      `👋 Welcome, <b>${user.fullName}</b>!\n\n` +
        `🔑 Role: <code>${user.role}</code>\n` +
        `🆔 Internal ID: <code>${user.id}</code>\n\n` +
        `Use /help to see available commands or click the "Admin Panel" button below!`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: '🖥 Open Admin Panel', web_app: { url: require('../config').config.webAppUrl } }],
            [{ text: '👥 Users' }, { text: '📊 Stats' }],
            [{ text: '❓ Help' }],
          ],
          resize_keyboard: true,
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await ctx.reply(`❌ Failed to connect to API:\n<code>${message}</code>`, {
      parse_mode: 'HTML',
    });
  }
}
