import { Bot } from 'grammy';
import { config } from './config';
import { apiClient } from './api/api.client';
import { searchMaterialsHandler } from './handlers/materials.handler';
import {
  logRequestMiddleware,
  setupBotErrorHandler,
  setupBotCommands,
  upsertUserMiddleware,
  ExtendedContext,
} from '@bot/core';

const bot = new Bot<ExtendedContext>(config.telegramToken);

// ── Core Middlewares ──────────────────────────────────────────────────────────
bot.use(logRequestMiddleware('MaterialBot'));
bot.use(upsertUserMiddleware(apiClient));

// ── Commands ──────────────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const firstName = ctx.from?.first_name ?? 'Student';

  await ctx.api.setChatMenuButton({
    chat_id: ctx.chat.id,
    menu_button: {
      type: 'web_app',
      text: 'Материалы',
      web_app: { url: config.miniAppUrl },
    },
  });

  await ctx.reply(
    `👋 Добро пожаловать, <b>${firstName}</b>!\n\n` +
    `Здесь собраны все учебные материалы, лекции, конспекты и дополнительные файлы ваших курсов.`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: '📚 Открыть материалы', web_app: { url: config.miniAppUrl } }],
          [{ text: '🔍 Поиск материалов' }, { text: '❓ Помощь' }],
        ],
        resize_keyboard: true,
      },
    }
  );
});

bot.command('materials', searchMaterialsHandler);
bot.command('search', searchMaterialsHandler);
bot.hears('🔍 Поиск материалов', async (ctx) => {
  await ctx.reply('Используйте команду <code>/search &lt;тема&gt;</code>, например: <code>/search анатомия</code>', { parse_mode: 'HTML' });
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `ℹ️ <b>Справка Material Bot</b>\n\n` +
    `• <code>/start</code> — Главное меню и кнопка открытия материалов\n` +
    `• <code>/materials</code> — Список последних материалов\n` +
    `• <code>/search &lt;тема&gt;</code> — Поиск лекций и статей\n` +
    `• <code>/help</code> — Список команд\n\n` +
    `Нажмите «📚 Открыть материалы» ниже для перехода к интерактивной библиотеке.`,
    { parse_mode: 'HTML' }
  );
});

bot.hears('❓ Помощь', async (ctx) => {
  await ctx.reply('Нажмите кнопку «📚 Открыть материалы» ниже, чтобы просмотреть материалы по вашим предметам.');
});

// ── Global Error Handler ──────────────────────────────────────────────────────
setupBotErrorHandler(bot, 'MaterialBot');

// ── Start polling ─────────────────────────────────────────────────────────────
bot.start({
  onStart: async (botInfo) => {
    console.log(`Material bot started as @${botInfo.username}`);
    await setupBotCommands(bot, [
      { command: 'start', description: '📚 Открыть библиотеку материалов' },
      { command: 'materials', description: '📄 Список последних материалов' },
      { command: 'search', description: '🔍 Поиск учебных материалов по теме' },
      { command: 'help', description: '❓ Помощь и справка' },
    ]);
  },
});

process.once('SIGTERM', () => {
  console.log('SIGTERM received — stopping...');
  bot.stop();
});
process.once('SIGINT', () => {
  console.log('SIGINT received — stopping...');
  bot.stop();
});
