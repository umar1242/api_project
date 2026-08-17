import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';

/**
 * /enroll command handler.
 * Usage:
 * /enroll <telegram_id> <group_id>
 */
export async function enrollHandler(ctx: CommandContext<Context>): Promise<void> {
  const raw = ctx.match?.trim() ?? '';
  const [tgIdStr, groupIdStr] = raw.split(/\s+/);

  if (!tgIdStr || !groupIdStr) {
    await ctx.reply(
      `ℹ️ <b>Ручное зачисление студента в группу</b>\n\n` +
      `Использование:\n` +
      `<code>/enroll &lt;telegram_id&gt; &lt;group_id&gt;</code>\n\n` +
      `<i>Пример:</i> <code>/enroll 123456789 2</code>`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  const telegramId = parseInt(tgIdStr, 10);
  const groupId = parseInt(groupIdStr, 10);

  if (isNaN(telegramId) || isNaN(groupId)) {
    await ctx.reply('❌ Telegram ID и Group ID должны быть числами.');
    return;
  }

  await ctx.reply('⏳ Зачисляю студента в группу...');

  try {
    const user = await apiClient.getUserByTelegramId(telegramId);
    if (!user) {
      await ctx.reply(`❌ Пользователь с Telegram ID <code>${telegramId}</code> не найден в базе. Студент должен сначала запустить бота.`, {
        parse_mode: 'HTML',
      });
      return;
    }

    const { data: enrollment } = await apiClient.post('/enrollments', {
      userId: user.id,
      groupId: groupId.toString(),
      status: 'ACTIVE',
    });

    await ctx.reply(
      `✅ <b>Студент успешно зачислен!</b>\n\n` +
      `👤 Студент: <b>${user.fullName}</b> (<code>${user.telegramId}</code>)\n` +
      `👥 ID группы: <code>${groupId}</code>\n` +
      `🆔 Номер записи: <code>${enrollment?.id || 'OK'}</code>`,
      { parse_mode: 'HTML' }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Ошибка зачисления: ${err.message || 'Сбой запроса к API'}`);
  }
}
