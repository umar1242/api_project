import { Bot } from 'grammy';
import { config } from './config';
import { apiClient } from './api/api.client';
import { registerStartHandler } from './handlers/start.handler';
import { registerScheduleHandler } from './handlers/schedule.handler';
import { progressHandler, coinsHandler } from './handlers/progress.handler';
import {
  logRequestMiddleware,
  setupBotErrorHandler,
  setupBotCommands,
  upsertUserMiddleware,
  ExtendedContext,
} from '../packages/bot-core/src';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const bot = new Bot<ExtendedContext>(config.telegramToken);

// ── Core Middlewares ──────────────────────────────────────────────────────────
bot.use(logRequestMiddleware('MainBot'));
bot.use(upsertUserMiddleware(apiClient));

// ── Register command handlers ────────────────────────────────────────────────
registerStartHandler(bot as any);
registerScheduleHandler(bot as any);
bot.command('progress', progressHandler);
bot.command('coins', coinsHandler);
bot.hears('🏆 Прогресс', progressHandler);
bot.hears('🪙 Монеты', coinsHandler);

// ── Language Selector ────────────────────────────────────────────────────────
bot.command('lang', async (ctx) => {
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

bot.callbackQuery(/^set_lang:(ru|uz)$/, async (ctx) => {
  const lang = ctx.match[1];
  await ctx.answerCallbackQuery();
  if (lang === 'ru') {
    await ctx.editMessageText('🇷🇺 <b>Язык успешно изменён на Русский!</b>', { parse_mode: 'HTML' });
  } else {
    await ctx.editMessageText("🇺🇿 <b>Til muvaffaqiyatli O'zbekchaga o'zgartirildi!</b>", { parse_mode: 'HTML' });
  }
});

// ── Global error handler ─────────────────────────────────────────────────────
setupBotErrorHandler(bot, 'MainBot');

// ── Start polling & set commands ─────────────────────────────────────────────
bot.start({
  onStart: async (botInfo) => {
    console.log(`[Main Bot] Started as @${botInfo.username} (env=${config.nodeEnv})`);
    console.log(`[Main Bot] API → ${config.apiBaseUrl}`);
    console.log(`[Main Bot] Mini App → ${config.miniAppUrl}`);

    // Register /setMyCommands
    await setupBotCommands(bot, [
      { command: 'start', description: '📱 Открыть личный кабинет' },
      { command: 'progress', description: '🏆 Мой учебный прогресс и успеваемость' },
      { command: 'coins', description: '🪙 Баланс монет и магазин' },
      { command: 'schedule', description: '📅 Расписание занятий' },
      { command: 'lang', description: '🌐 Язык интерфейса / Tilni tanlash' },
      { command: 'help', description: '❓ Справка и помощь' },
    ]);
  },
});

// Graceful shutdown
process.once('SIGTERM', () => {
  console.log('[Main Bot] SIGTERM received — stopping...');
  bot.stop();
});

process.once('SIGINT', () => {
  console.log('[Main Bot] SIGINT received — stopping...');
  bot.stop();
});
