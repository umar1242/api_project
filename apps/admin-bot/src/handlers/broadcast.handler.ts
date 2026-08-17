import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';

/**
 * /broadcast command handler.
 * Usage:
 * /broadcast <текст сообщения> -> рассылка всем зарегистрированным студентам
 */
export async function broadcastHandler(ctx: CommandContext<Context>): Promise<void> {
  const text = ctx.match?.trim();

  if (!text) {
    await ctx.reply(
      `📢 <b>Массовая рассылка сообщений</b>\n\n` +
      `Использование:\n` +
      `<code>/broadcast &lt;текст сообщения&gt;</code>\n\n` +
      `<i>Пример:</i> <code>/broadcast Завтра в 18:00 состоится открытый вебинар!</code>`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  const statusMsg = await ctx.reply('⏳ Начинаю рассылку сообщений...');

  try {
    const { data: users } = await apiClient.listUsers({ take: 200 });
    const students = users.filter((u: any) => u.telegramId && u.status !== 'BANNED');

    let sent = 0;
    let failed = 0;

    for (const student of students) {
      try {
        await ctx.api.sendMessage(
          student.telegramId,
          `📢 <b>Объявление от администрации:</b>\n\n${text}`,
          { parse_mode: 'HTML' }
        );
        sent++;
        // Small rate limit delay
        await new Promise((r) => setTimeout(r, 60));
      } catch (err: any) {
        failed++;
      }
    }

    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      `✅ <b>Рассылка завершена!</b>\n\n` +
      `📬 Успешно доставлено: <b>${sent}</b>\n` +
      `❌ Ошибок / заблокировали бота: <b>${failed}</b>`,
      { parse_mode: 'HTML' }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Ошибка выполнения рассылки: ${err.message || 'Сбой API'}`);
  }
}
