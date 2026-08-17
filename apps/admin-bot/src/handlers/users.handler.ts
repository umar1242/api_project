import { CommandContext, Context } from 'grammy';
import { apiClient, ApiUser } from '../api/api.client';

// ─── Formatters ───────────────────────────────────────────────────────────────

const roleEmoji: Record<string, string> = {
  STUDENT: '🎓',
  CURATOR: '👨‍🏫',
  ADMIN: '⚙️',
};

const statusEmoji: Record<string, string> = {
  ACTIVE: '✅',
  PAUSED: '⏸',
  BANNED: '🚫',
};

function formatUser(user: ApiUser): string {
  const role = `${roleEmoji[user.role] ?? '?'} ${user.role}`;
  const status = `${statusEmoji[user.status] ?? '?'} ${user.status}`;
  return (
    `👤 <b>${user.fullName}</b>\n` +
    `🆔 ID: <code>${user.id}</code> | TG: <code>${user.telegramId}</code>\n` +
    `🔑 Роль: ${role} | Статус: ${status}\n` +
    `📅 Регистрация: ${new Date(user.createdAt).toLocaleDateString('ru-RU')}`
  );
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

/**
 * /users — List registered users with interactive pagination.
 */
export async function usersListHandler(ctx: Context, page = 1): Promise<void> {
  const isCallback = Boolean(ctx.callbackQuery);

  try {
    const skip = (page - 1) * PAGE_SIZE;
    const { data, total } = await apiClient.listUsers({ skip, take: PAGE_SIZE });

    if (data.length === 0 && total === 0) {
      if (isCallback) {
        await ctx.editMessageText('📭 Пользователей в базе пока нет.');
      } else {
        await ctx.reply('📭 Пользователей в базе пока нет.');
      }
      return;
    }

    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    const header = `👥 <b>Список пользователей</b> (Страница ${page} из ${totalPages} | Всего: ${total})\n${'─'.repeat(32)}\n\n`;
    const lines = data.map(formatUser).join('\n\n');
    const text = header + lines;

    const navButtons = [];
    if (page > 1) {
      navButtons.push({ text: '◀ Назад', callback_data: `users_page:${page - 1}` });
    }
    navButtons.push({ text: `· ${page} / ${totalPages} ·`, callback_data: 'noop' });
    if (page < totalPages) {
      navButtons.push({ text: 'Вперёд ▶', callback_data: `users_page:${page + 1}` });
    }

    const inline_keyboard = [navButtons];

    if (isCallback) {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard },
      });
    } else {
      await ctx.reply(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard },
      });
    }
  } catch (err: any) {
    const message = err.message || 'Ошибка загрузки пользователей';
    if (isCallback) {
      await ctx.editMessageText(`❌ ${message}`);
    } else {
      await ctx.reply(`❌ ${message}`);
    }
  }
}

/**
 * /user <telegramId> — Show a specific user by their Telegram ID.
 */
export async function userLookupHandler(ctx: CommandContext<Context>): Promise<void> {
  const arg = ctx.match?.trim();

  if (!arg) {
    await ctx.reply('Использование: <code>/user &lt;telegram_id&gt;</code>\nПример: <code>/user 123456789</code>', {
      parse_mode: 'HTML',
    });
    return;
  }

  const telegramId = parseInt(arg, 10);
  if (isNaN(telegramId)) {
    await ctx.reply('❌ Неверный формат Telegram ID. Ожидается число.');
    return;
  }

  try {
    const user = await apiClient.getUserByTelegramId(telegramId);
    if (!user) {
      await ctx.reply(`❌ Пользователь с Telegram ID <code>${telegramId}</code> не найден.`, {
        parse_mode: 'HTML',
      });
      return;
    }

    const actionButtons = [];
    if (user.status === 'BANNED') {
      actionButtons.push([{ text: '✅ Разблокировать', callback_data: `unban_user:${user.telegramId}` }]);
    } else {
      actionButtons.push([{ text: '🚫 Заблокировать', callback_data: `ban_user:${user.telegramId}` }]);
    }

    await ctx.reply(formatUser(user), {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: actionButtons },
    });
  } catch (err: any) {
    await ctx.reply(`❌ ${err.message || 'Ошибка поиска'}`);
  }
}

/**
 * /ban <telegramId> [reason] — Ban a user.
 */
export async function banUserHandler(ctx: CommandContext<Context>): Promise<void> {
  const raw = ctx.match?.trim() ?? '';
  const [tgIdStr, ...reasonParts] = raw.split(/\s+/);

  if (!tgIdStr) {
    await ctx.reply(
      'Использование: <code>/ban &lt;telegram_id&gt; [причина]</code>\nПример: <code>/ban 123456789 Нарушение правил</code>',
      { parse_mode: 'HTML' },
    );
    return;
  }

  const telegramId = parseInt(tgIdStr, 10);
  if (isNaN(telegramId)) {
    await ctx.reply('❌ Неверный формат Telegram ID.');
    return;
  }

  const reason = reasonParts.join(' ') || undefined;

  try {
    const user = await apiClient.banUser(telegramId, reason);
    await ctx.reply(
      `🚫 Пользователь <b>${user.fullName}</b> (<code>${user.telegramId}</code>) заблокирован.${reason ? `\nПричина: <i>${reason}</i>` : ''}`,
      { parse_mode: 'HTML' },
    );
  } catch (err: any) {
    await ctx.reply(`❌ Ошибка блокировки: ${err.message}`);
  }
}

/**
 * /unban <telegramId> — Unban a user.
 */
export async function unbanUserHandler(ctx: CommandContext<Context>): Promise<void> {
  const raw = ctx.match?.trim() ?? '';
  const telegramId = parseInt(raw, 10);

  if (!raw || isNaN(telegramId)) {
    await ctx.reply(
      'Использование: <code>/unban &lt;telegram_id&gt;</code>\nПример: <code>/unban 123456789</code>',
      { parse_mode: 'HTML' },
    );
    return;
  }

  try {
    const user = await apiClient.unbanUser(telegramId);
    await ctx.reply(
      `✅ Пользователь <b>${user.fullName}</b> (<code>${user.telegramId}</code>) успешно разблокирован.`,
      { parse_mode: 'HTML' },
    );
  } catch (err: any) {
    await ctx.reply(`❌ Ошибка разблокировки: ${err.message}`);
  }
}
