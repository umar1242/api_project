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
    `🆔 DB ID: <code>${user.id}</code>\n` +
    `📱 Telegram: <code>${user.telegramId}</code>\n` +
    `📞 Phone: ${user.phone ?? '—'}\n` +
    `🔑 Role: ${role}\n` +
    `📌 Status: ${status}\n` +
    `📅 Registered: ${new Date(user.createdAt).toLocaleDateString('ru-RU')}`
  );
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * /users — List the latest 10 registered users.
 */
export async function usersListHandler(ctx: Context): Promise<void> {
  await ctx.reply('⏳ Loading users...');

  try {
    const { data, total } = await apiClient.listUsers({ take: 10 });

    if (data.length === 0) {
      await ctx.reply('📭 No users registered yet.');
      return;
    }

    const header = `👥 <b>Users</b> (showing ${data.length} of ${total})\n${'─'.repeat(30)}\n`;
    const lines = data.map(formatUser).join('\n\n');

    await ctx.reply(header + lines, { parse_mode: 'HTML' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await ctx.reply(`❌ ${message}`, { parse_mode: 'HTML' });
  }
}

/**
 * /user <telegramId> — Show a specific user by their Telegram ID.
 */
export async function userLookupHandler(ctx: CommandContext<Context>): Promise<void> {
  const args = ctx.message?.text?.split(' ').slice(1) ?? [];
  const telegramIdStr = args[0];

  if (!telegramIdStr || isNaN(Number(telegramIdStr))) {
    await ctx.reply('Usage: /user <telegramId>\nExample: /user 123456789');
    return;
  }

  try {
    const user = await apiClient.getUserByTelegramId(Number(telegramIdStr));

    if (!user) {
      await ctx.reply(`❌ User with Telegram ID <code>${telegramIdStr}</code> not found.`, {
        parse_mode: 'HTML',
      });
      return;
    }

    await ctx.reply(formatUser(user), { parse_mode: 'HTML' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await ctx.reply(`❌ ${message}`);
  }
}

/**
 * /ban <telegramId> — Set user status to BANNED.
 */
export async function banUserHandler(ctx: CommandContext<Context>): Promise<void> {
  const args = ctx.message?.text?.split(' ').slice(1) ?? [];
  const telegramIdStr = args[0];

  if (!telegramIdStr || isNaN(Number(telegramIdStr))) {
    await ctx.reply('Usage: /ban <telegramId>');
    return;
  }

  try {
    const user = await apiClient.getUserByTelegramId(Number(telegramIdStr));
    if (!user) {
      await ctx.reply(`❌ User <code>${telegramIdStr}</code> not found.`, { parse_mode: 'HTML' });
      return;
    }

    const updated = await apiClient.updateUser(user.id, { status: 'BANNED' });
    await ctx.reply(
      `🚫 User <b>${updated.fullName}</b> (<code>${updated.telegramId}</code>) has been banned.`,
      { parse_mode: 'HTML' },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await ctx.reply(`❌ ${message}`);
  }
}

/**
 * /unban <telegramId> — Restore a banned user to ACTIVE status.
 */
export async function unbanUserHandler(ctx: CommandContext<Context>): Promise<void> {
  const args = ctx.message?.text?.split(' ').slice(1) ?? [];
  const telegramIdStr = args[0];

  if (!telegramIdStr || isNaN(Number(telegramIdStr))) {
    await ctx.reply('Usage: /unban <telegramId>');
    return;
  }

  try {
    const user = await apiClient.getUserByTelegramId(Number(telegramIdStr));
    if (!user) {
      await ctx.reply(`❌ User <code>${telegramIdStr}</code> not found.`, { parse_mode: 'HTML' });
      return;
    }

    const updated = await apiClient.updateUser(user.id, { status: 'ACTIVE' });
    await ctx.reply(
      `✅ User <b>${updated.fullName}</b> (<code>${updated.telegramId}</code>) has been restored.`,
      { parse_mode: 'HTML' },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await ctx.reply(`❌ ${message}`);
  }
}
