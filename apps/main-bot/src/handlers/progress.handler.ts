import { CommandContext, Context } from 'grammy';
import { apiClient } from '../api/api.client';
import { config } from '../config';

/**
 * /progress command handler for Main Bot.
 * Displays student achievements, XP, level, and completed assignments.
 */
export async function progressHandler(ctx: CommandContext<Context>): Promise<void> {
  const tgUser = ctx.from;
  if (!tgUser) {
    await ctx.reply('❌ Не удалось определить пользователя.');
    return;
  }

  await ctx.reply('⏳ Загружаю ваш учебный прогресс...');

  try {
    const { data: enrollmentsRes } = await apiClient.get('/enrollments', {
      params: { telegramId: tgUser.id },
    });

    const enrollments = enrollmentsRes?.data || [];

    if (enrollments.length === 0) {
      await ctx.reply(
        'ℹ️ Вы пока не записаны ни на один курс.\n\nИспользуйте бота регистрации для записи на курс по коду.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📱 Открыть личный кабинет', web_app: { url: config.miniAppUrl } }],
            ],
          },
        }
      );
      return;
    }

    let progressReport = `🏆 <b>Ваш учебный профиль</b>\n\n`;
    progressReport += `👤 <b>Студент:</b> ${tgUser.first_name} ${tgUser.last_name || ''}\n\n`;

    for (const enr of enrollments) {
      const courseTitle = enr.group?.course?.title || enr.group?.title || 'Курс';
      const status = enr.status === 'ACTIVE' ? '🟢 Активен' : '🟡 В ожидании';
      progressReport += `📖 <b>${courseTitle}</b>\n`;
      progressReport += `• Статус: ${status}\n`;
      progressReport += `• Группа: ${enr.group?.title || 'Не назначена'}\n\n`;
    }

    progressReport += `💡 <i>Подробную динамику успеваемости, рейтинг и баллы смотрите в Mini App:</i>`;

    await ctx.reply(progressReport, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Открыть полную статистику', web_app: { url: config.miniAppUrl } }],
        ],
      },
    });
  } catch (err: any) {
    await ctx.reply(
      '⚠️ Не удалось загрузить данные прогресса из API. Попробуйте открыть приложение:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Открыть Dashboard', web_app: { url: config.miniAppUrl } }],
          ],
        },
      }
    );
  }
}

/**
 * /coins command handler
 */
export async function coinsHandler(ctx: CommandContext<Context>): Promise<void> {
  await ctx.reply(
    `🪙 <b>Баланс монет и магазин наград</b>\n\n` +
    `За каждое вовремя сданное домашнее задание и пройденный тест вы получаете учебные монеты!\n\n` +
    `Тратить монеты на стикерпаки, мерч и бонусы можно в разделе магазина Mini App.`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍 Открыть магазин наград', web_app: { url: `${config.miniAppUrl}/shop` } }],
        ],
      },
    }
  );
}
