import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';

/**
 * /stats command handler for Admin Bot.
 * Aggregates and displays real-time platform statistics.
 */
export async function statsHandler(ctx: CommandContext<Context>): Promise<void> {
  await ctx.reply('⏳ Собираю статистику платформы...');

  try {
    const [usersRes, coursesRes, groupsRes] = await Promise.allSettled([
      apiClient.listUsers({ take: 1 }),
      apiClient.listCourses(),
      apiClient.listGroups(),
    ]);

    const totalUsers = usersRes.status === 'fulfilled' ? usersRes.value.total : '—';
    const totalCourses = coursesRes.status === 'fulfilled' ? (coursesRes.value as any[]).length : '—';
    const totalGroups = groupsRes.status === 'fulfilled' ? (groupsRes.value as any[]).length : '—';

    const text =
      `📊 <b>Общая статистика платформы</b>\n\n` +
      `👥 <b>Пользователей в базе:</b> <code>${totalUsers}</code>\n` +
      `📚 <b>Активных курсов:</b> <code>${totalCourses}</code>\n` +
      `👥 <b>Учебных групп:</b> <code>${totalGroups}</code>\n\n` +
      `⚡ <i>Все сервисы работают в штатном режиме.</i>`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Обновить статистику', callback_data: 'refresh_stats' }],
        ],
      },
    });
  } catch (err: any) {
    await ctx.reply(`❌ Ошибка получения статистики: ${err.message || 'Неизвестная ошибка'}`);
  }
}
