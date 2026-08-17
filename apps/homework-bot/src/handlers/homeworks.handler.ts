import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';
import { config } from '../config';

/**
 * /homeworks command handler for Homework Bot.
 * Lists active and submitted assignments for student.
 */
export async function homeworksHandler(ctx: CommandContext<Context>): Promise<void> {
  const tgUser = ctx.from;
  if (!tgUser) {
    await ctx.reply('❌ Не удалось определить пользователя.');
    return;
  }

  await ctx.reply('⏳ Загружаю список ваших заданий...');

  try {
    const { data: enrollmentsRes } = await apiClient.get('/enrollments', {
      params: { telegramId: tgUser.id },
    });

    const enrollments = enrollmentsRes?.data || [];

    if (enrollments.length === 0) {
      await ctx.reply(
        'ℹ️ Вы пока не привязаны ни к одной учебной группе.\nОбратитесь к куратору или зарегистрируйтесь на курс.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📚 Открыть Homework App', web_app: { url: config.miniAppUrl } }],
            ],
          },
        }
      );
      return;
    }

    let text = `📚 <b>Ваши домашние задания:</b>\n\n`;
    const buttons: any[] = [];

    for (const enr of enrollments) {
      const groupTitle = enr.group?.title || 'Группа';
      text += `👥 <b>${groupTitle}</b>\n`;

      if (enr.groupId) {
        try {
          const { data: assignments } = await apiClient.get(`/assignments/group/${enr.groupId}`);
          if (Array.isArray(assignments) && assignments.length > 0) {
            for (const hw of assignments.slice(0, 5)) {
              const deadline = hw.deadline ? new Date(hw.deadline).toLocaleDateString('ru-RU') : 'Бессрочно';
              text += `• <b>${hw.title}</b> (до ${deadline})\n`;
              buttons.push([{ text: `📝 Сдать: ${hw.title.slice(0, 25)}`, web_app: { url: `${config.miniAppUrl}/assignments/${hw.id}` } }]);
            }
          } else {
            text += `<i>Нет активных заданий</i>\n`;
          }
        } catch {
          text += `<i>Информация обновляется...</i>\n`;
        }
      }
      text += '\n';
    }

    buttons.push([{ text: '🚀 Открыть приложение домашних заданий', web_app: { url: config.miniAppUrl } }]);

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  } catch (err: any) {
    await ctx.reply('⚠️ Не удалось загрузить список заданий. Откройте приложение:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📚 Открыть ДЗ', web_app: { url: config.miniAppUrl } }],
        ],
      },
    });
  }
}
