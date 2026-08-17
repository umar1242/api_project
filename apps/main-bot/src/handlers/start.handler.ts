import { Bot, Context } from 'grammy';
import { config } from '../config';

/**
 * Registers the /start command handler for the Main Bot.
 */
export function registerStartHandler(bot: Bot<Context>): void {
  bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name ?? 'Студент';

    await ctx.api.setChatMenuButton({
      chat_id: ctx.chat.id,
      menu_button: {
        type: 'web_app',
        text: 'Кабинет',
        web_app: { url: config.miniAppUrl },
      },
    });

    await ctx.reply(
      `👋 Здравствуйте, <b>${firstName}</b>!\n\n` +
      `Добро пожаловать в <b>личный кабинет студента</b>.\n\n` +
      `Используйте кнопку ниже для перехода к расписанию, успеваемости и курсам:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: '📱 Открыть личный кабинет', web_app: { url: config.miniAppUrl } }],
            [{ text: '🏆 Прогресс' }, { text: '🪙 Монеты' }],
            [{ text: '📅 Расписание' }, { text: '🌐 Язык / Til' }],
          ],
          resize_keyboard: true,
        },
      },
    );
  });

  bot.hears('📅 Расписание', async (ctx) => {
    await ctx.reply('Используйте команду /schedule для просмотра расписания ближайших занятий.');
  });

  bot.hears('🌐 Язык / Til', async (ctx) => {
    await ctx.reply('🌐 <b>Выберите язык интерфейса / Tilni tanlang:</b>', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇷🇺 Русский', callback_data: 'set_lang:ru' },
            { text: "🇺🇿 O'zbekcha", callback_data: 'set_lang:uz' },
          ],
        ],
      },
    });
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 <b>Справка Main Bot</b>\n\n` +
      `• <code>/start</code> — Главное меню и запуск кабинета\n` +
      `• <code>/progress</code> — Учебный прогресс и успеваемость\n` +
      `• <code>/coins</code> — Баланс монет и магазин наград\n` +
      `• <code>/schedule</code> — Расписание ближайших уроков\n` +
      `• <code>/lang</code> — Смена языка (RU / UZ)\n` +
      `• <code>/help</code> — Это справочное сообщение`,
      { parse_mode: 'HTML' },
    );
  });
}
