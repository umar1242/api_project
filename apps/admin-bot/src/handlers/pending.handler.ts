import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';
import { config } from '../config';

/**
 * /pending command handler for Admin Bot.
 * Displays real student variant submissions awaiting grading.
 */
export async function pendingSubmissionsHandler(ctx: CommandContext<Context>): Promise<void> {
  await ctx.reply('⏳ Загружаю работы, ожидающие проверки...');

  try {
    const { data: submissionsRes } = await apiClient.get('/variants/submissions/pending');
    const submissions = Array.isArray(submissionsRes) ? submissionsRes : (submissionsRes?.data || []);

    if (!Array.isArray(submissions) || submissions.length === 0) {
      await ctx.reply('✅ <b>Все работы проверены!</b>\nНет заданий в статусе PENDING.', {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🖥 Открыть админ-панель', web_app: { url: config.webAppUrl } }],
          ],
        },
      });
      return;
    }

    let text = `📝 <b>Работы, ожидающие проверки (${submissions.length}):</b>\n\n`;
    const buttons: any[] = [];

    for (const s of submissions.slice(0, 10)) {
      const studentName = s.user?.fullName || 'Неизвестный студент';
      const variantTitle = s.variant?.title || 'Тест';
      text += `• <b>${variantTitle}</b> — 👤 ${studentName}\n`;
      buttons.push([
        { 
          text: `⭐ Проверить: ${variantTitle.slice(0, 20)}`, 
          web_app: { url: `${config.webAppUrl}/submissions/${s.id}` } 
        },
      ]);
    }

    buttons.push([{ text: '🖥 Открыть панель проверки', web_app: { url: `${config.webAppUrl}/submissions` } }]);

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (err: any) {
    await ctx.reply(`❌ Ошибка получения списка: ${err.message || 'Сбой API'}`);
  }
}
