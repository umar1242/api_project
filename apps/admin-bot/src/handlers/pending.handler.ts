import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';
import { config } from '../config';

/**
 * /pending command handler for Admin Bot.
 * Shows pending submissions awaiting grading.
 */
export async function pendingSubmissionsHandler(ctx: CommandContext<Context>): Promise<void> {
  await ctx.reply('⏳ Проверяю работы, ожидающие проверки...');

  try {
    const { data: groups } = await apiClient.listGroups();

    if (!Array.isArray(groups) || groups.length === 0) {
      await ctx.reply('📭 В системе пока нет созданных учебных групп.');
      return;
    }

    let text = `📝 <b>Работы, ожидающие проверки:</b>\n\n`;
    const buttons: any[] = [];
    let foundCount = 0;

    for (const g of groups.slice(0, 5)) {
      try {
        const { data: assignments } = await apiClient.get(`/assignments/group/${g.id}`);
        if (Array.isArray(assignments)) {
          for (const a of assignments) {
            text += `👥 <b>${g.title}</b> → <i>${a.title}</i>\n`;
            buttons.push([
              { text: `⭐ Проверить: ${a.title.slice(0, 20)}`, web_app: { url: `${config.webAppUrl}/assignments/${a.id}` } },
            ]);
            foundCount++;
          }
        }
      } catch {}
    }

    if (foundCount === 0) {
      await ctx.reply('✅ <b>Все сданные работы проверены!</b>\nНепроверенных заданий нет.', {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🖥 Открыть админ-панель', web_app: { url: config.webAppUrl } }],
          ],
        },
      });
      return;
    }

    buttons.push([{ text: '🖥 Открыть панель проверки', web_app: { url: config.webAppUrl } }]);

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  } catch (err: any) {
    await ctx.reply(`❌ Ошибка получения списка заданий: ${err.message || 'Сбой API'}`);
  }
}
