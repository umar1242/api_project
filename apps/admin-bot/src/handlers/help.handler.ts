import { Context } from 'grammy';

/**
 * /help command — shows all available commands for Admin Bot.
 */
export async function helpHandler(ctx: Context): Promise<void> {
  const helpText = [
    '📖 <b>Панель управления Admin Bot</b>\n',
    '📊 <b>Аналитика и рассылки:</b>',
    '• <code>/stats</code> — Сводка платформы в реальном времени',
    '• <code>/pending</code> — Домашние задания на проверке',
    '• <code>/broadcast &lt;текст&gt;</code> — Массовая рассылка студентам\n',
    '👥 <b>Управление пользователями:</b>',
    '• <code>/users</code> — Список пользователей с постраничной навигацией',
    '• <code>/user &lt;telegram_id&gt;</code> — Карточка и быстрые действия',
    '• <code>/enroll &lt;telegram_id&gt; &lt;group_id&gt;</code> — Зачислить в группу',
    '• <code>/ban &lt;telegram_id&gt; [причина]</code> — Заблокировать',
    '• <code>/unban &lt;telegram_id&gt;</code> — Разблокировать\n',
    '📚 <b>Контент и обучение:</b>',
    '• <code>/create_assignment</code> — Создать домашнее задание',
    '• <code>/link_homework</code> — Привязать ДЗ к уроку',
    '• <code>/grade_homework</code> — Оценить работу студента',
    '• <code>/add_material</code> — Загрузить лекцию / файл',
    '• <code>/create_variant</code> — Мастер создания тестов\n',
    '• <code>/help</code> — Это справочное меню',
  ].join('\n');

  await ctx.reply(helpText, { parse_mode: 'HTML' });
}
