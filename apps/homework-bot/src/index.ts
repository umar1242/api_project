import { Bot } from 'grammy';
import { config } from './config';
import { apiClient } from './api/api.client';
import { homeworksHandler } from './handlers/homeworks.handler';
import {
  logRequestMiddleware,
  setupBotErrorHandler,
  setupBotCommands,
  upsertUserMiddleware,
  ExtendedContext,
} from '../packages/bot-core/src';

const bot = new Bot<ExtendedContext>(config.telegramToken);

// ── Core Middlewares ──────────────────────────────────────────────────────────
bot.use(logRequestMiddleware('HomeworkBot'));
bot.use(upsertUserMiddleware(apiClient));

// ── Commands ──────────────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  await ctx.api.setChatMenuButton({
    chat_id: ctx.chat.id,
    menu_button: {
      type: 'web_app',
      text: 'Домашки',
      web_app: { url: config.miniAppUrl },
    },
  });

  await ctx.reply(
    `📚 <b>Добро пожаловать в бот домашних заданий!</b>\n\n` +
    `Здесь вы можете просматривать активные задания, сдавать решения и следить за оценками куратора.`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: '📚 Открыть домашние задания', web_app: { url: config.miniAppUrl } }],
          [{ text: '📋 Мои задания' }, { text: '❓ Помощь' }],
        ],
        resize_keyboard: true,
      },
    },
  );
});

bot.command('homeworks', homeworksHandler);
bot.hears('📋 Мои задания', homeworksHandler);

bot.command('help', async (ctx) => {
  await ctx.reply(
    `ℹ️ <b>Справка Homework Bot</b>\n\n` +
    `• <code>/start</code> — Главное меню и запуск приложения\n` +
    `• <code>/homeworks</code> — Список активных заданий и дедлайнов\n` +
    `• <code>/help</code> — Список команд\n\n` +
    `Нажмите «📚 Открыть домашние задания» для перехода в личный кабинет сдачи ДЗ.`,
    { parse_mode: 'HTML' }
  );
});

bot.hears('❓ Помощь', async (ctx) => {
  await ctx.reply('Нажмите кнопку «📚 Открыть домашние задания» ниже для перехода к списку ваших ДЗ.');
});

// Handle direct photo / document upload in chat
bot.on(['message:document', 'message:photo'], async (ctx) => {
  await ctx.reply(
    '📎 Файл получен! Чтобы прикрепить его к конкретному заданию, пожалуйста, откройте домашнее задание по кнопке ниже и нажмите «Сдать работу»:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Сдать решение в приложении', web_app: { url: config.miniAppUrl } }],
        ],
      },
    }
  );
});

// ── Global Error Handler ──────────────────────────────────────────────────────
setupBotErrorHandler(bot, 'HomeworkBot');

// ── Start polling ─────────────────────────────────────────────────────────────
bot.start({
  onStart: async (botInfo) => {
    console.log(`Homework bot started as @${botInfo.username}`);
    await setupBotCommands(bot, [
      { command: 'start', description: '📚 Открыть домашние задания' },
      { command: 'homeworks', description: '📋 Список актуальных заданий' },
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
