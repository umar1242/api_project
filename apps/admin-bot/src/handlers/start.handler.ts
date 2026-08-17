import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';
import { config } from '../config';

/**
 * /start command handler for Admin Bot.
 *
 * Securely verifies role (ADMIN / CURATOR) before granting access.
 */
export async function startHandler(ctx: CommandContext<Context>): Promise<void> {
  const tgUser = ctx.from;
  if (!tgUser) {
    await ctx.reply('❌ Не удалось определить пользователя.');
    return;
  }

  try {
    let user = await apiClient.getUserByTelegramId(tgUser.id);

    // Bootstrap first administrator if database has no users yet
    if (!user) {
      const allUsers = await apiClient.listUsers({ take: 1 });
      if (allUsers.total === 0) {
        user = await apiClient.upsertUser({
          telegramId: tgUser.id,
          fullName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Admin',
          role: 'ADMIN',
        });
      }
    }

    if (!user || (user.role !== 'ADMIN' && user.role !== 'CURATOR')) {
      await ctx.reply(
        '⛔ <b>Доступ ограничен.</b>\n\nЭтот бот предназначен исключительно для администраторов и кураторов системы.\nОбратитесь к администратору для выдачи прав.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    if (user.status === 'BANNED') {
      await ctx.reply('🚫 Ваш аккаунт заблокирован в системе.');
      return;
    }

    await ctx.api.setChatMenuButton({
      chat_id: ctx.chat.id,
      menu_button: {
        type: 'web_app',
        text: 'Админ-панель',
        web_app: { url: config.webAppUrl },
      },
    });

    await ctx.reply(
      `👋 Здравствуйте, <b>${user.fullName}</b>!\n\n` +
        `🔑 Роль: <code>${user.role}</code>\n` +
        `🆔 ID: <code>${user.id}</code>\n\n` +
        `Используйте /help для просмотра команд или откройте панель управления кнопкой ниже:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: '🖥 Открыть админ-панель', web_app: { url: config.webAppUrl } }],
            [{ text: '👥 Пользователи' }, { text: '📊 Статистика' }],
            [{ text: '❓ Помощь' }],
          ],
          resize_keyboard: true,
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await ctx.reply(`❌ Ошибка подключения к API:\n<code>${message}</code>`, {
      parse_mode: 'HTML',
    });
  }
}
