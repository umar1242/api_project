import { Bot, session, Context, SessionFlavor } from 'grammy';
import { conversations, createConversation, ConversationFlavor } from '@grammyjs/conversations';
import { config } from './config';
import { apiClient } from './api/api.client';
import { startHandler } from './handlers/start.handler';
import { helpHandler } from './handlers/help.handler';
import {
  usersListHandler,
  userLookupHandler,
  banUserHandler,
  unbanUserHandler,
} from './handlers/users.handler';
import { createAssignmentHandler } from './handlers/assignments.handler';
import { linkHomeworkHandler, gradeHomeworkHandler } from './handlers/homework.handler';
import { addMaterialHandler, handleMaterialUpload } from './handlers/materials.handler';
import { createVariantConversation, createVariantHandler } from './handlers/variant.handler';
import { statsHandler } from './handlers/stats.handler';
import { broadcastHandler } from './handlers/broadcast.handler';
import { pendingSubmissionsHandler } from './handlers/pending.handler';
import { enrollHandler } from './handlers/enroll.handler';
import {
  logRequestMiddleware,
  setupBotErrorHandler,
  setupBotCommands,
} from '../packages/bot-core/src';

export interface SessionData {
  awaitingMaterial?: {
    groupId: string;
    lessonId?: string;
  } | null;
}

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[AdminBot] Starting...');

  // Verify API connectivity before accepting Telegram updates
  try {
    const health = await apiClient.ping();
    console.log(`[AdminBot] API health: ${health.status}`);
  } catch (err) {
    console.error('[AdminBot] Cannot reach API — continuing anyway.', err);
  }

  const bot = new Bot<MyContext>(config.telegramToken);

  // ── Core Middlewares ────────────────────────────────────────────────────────
  bot.use(logRequestMiddleware('AdminBot'));

  // Session & conversations
  bot.use(session({ initial: (): SessionData => ({ awaitingMaterial: null }) }));
  bot.use(conversations());
  bot.use(createConversation(createVariantConversation));

  // ── Commands ───────────────────────────────────────────────────────────────
  bot.command('start', startHandler);
  bot.command('help', helpHandler);
  bot.command('users', usersListHandler);
  bot.command('user', userLookupHandler);
  bot.command('ban', banUserHandler);
  bot.command('unban', unbanUserHandler);
  bot.command('create_assignment', createAssignmentHandler);
  bot.command('link_homework', linkHomeworkHandler);
  bot.command('grade_homework', gradeHomeworkHandler);
  bot.command('add_material', addMaterialHandler);
  bot.command('create_variant', createVariantHandler);
  bot.command('stats', statsHandler);
  bot.command('broadcast', broadcastHandler);
  bot.command('pending', pendingSubmissionsHandler);
  bot.command('enroll', enrollHandler);

  // Catch all cancel
  bot.command('cancel', async (ctx) => {
    ctx.session.awaitingMaterial = null;
    await ctx.reply('Действие отменено.');
  });

  // Handle incoming files
  bot.on(['message:document', 'message:video', 'message:photo'], handleMaterialUpload);

  // ── Keyboard button aliases ────────────────────────────────────────────────
  bot.hears('👥 Users', usersListHandler);
  bot.hears('👥 Пользователи', usersListHandler);
  bot.hears('📊 Stats', statsHandler);
  bot.hears('📊 Статистика', statsHandler);
  bot.hears('📝 Проверка', pendingSubmissionsHandler);
  bot.hears('❓ Help', helpHandler);
  bot.hears('❓ Помощь', helpHandler);
  bot.callbackQuery('refresh_stats', async (ctx) => {
    await ctx.answerCallbackQuery({ text: 'Обновлено!' });
    return statsHandler(ctx as any);
  });
  bot.callbackQuery(/^users_page:(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10) || 1;
    await ctx.answerCallbackQuery();
    return usersListHandler(ctx, page);
  });
  bot.callbackQuery(/^ban_user:(\d+)$/, async (ctx) => {
    const tgId = parseInt(ctx.match[1], 10);
    await ctx.answerCallbackQuery({ text: 'Блокировка...' });
    try {
      const user = await apiClient.banUser(tgId);
      await ctx.editMessageText(`🚫 Пользователь <b>${user.fullName}</b> заблокирован.`, { parse_mode: 'HTML' });
    } catch (e: any) {
      await ctx.reply(`❌ Ошибка: ${e.message}`);
    }
  });
  bot.callbackQuery(/^unban_user:(\d+)$/, async (ctx) => {
    const tgId = parseInt(ctx.match[1], 10);
    await ctx.answerCallbackQuery({ text: 'Разблокировка...' });
    try {
      const user = await apiClient.unbanUser(tgId);
      await ctx.editMessageText(`✅ Пользователь <b>${user.fullName}</b> разблокирован.`, { parse_mode: 'HTML' });
    } catch (e: any) {
      await ctx.reply(`❌ Ошибка: ${e.message}`);
    }
  });
  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery();
  });

  // ── Error handling ─────────────────────────────────────────────────────────
  setupBotErrorHandler(bot, 'AdminBot');

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  process.once('SIGTERM', () => {
    console.log('[AdminBot] SIGTERM received — stopping...');
    bot.stop();
  });
  process.once('SIGINT', () => {
    console.log('[AdminBot] SIGINT received — stopping...');
    bot.stop();
  });

  // ── Start polling ──────────────────────────────────────────────────────────
  await bot.start({
    onStart: async (info) => {
      console.log(`[AdminBot] Running as @${info.username} (${info.id})`);
      console.log('[AdminBot] Polling for updates...');

      await setupBotCommands(bot, [
        { command: 'start', description: '🔑 Авторизация и главное меню' },
        { command: 'stats', description: '📊 Общая статистика платформы' },
        { command: 'pending', description: '📝 Работы на проверке' },
        { command: 'broadcast', description: '📢 Массовая рассылка студентам' },
        { command: 'enroll', description: '➕ Зачислить студента в группу' },
        { command: 'users', description: '👥 Список пользователей' },
        { command: 'user', description: '🔍 Поиск пользователя' },
        { command: 'ban', description: '🚫 Заблокировать пользователя' },
        { command: 'unban', description: '✅ Разблокировать пользователя' },
        { command: 'create_assignment', description: '📝 Создать домашнее задание' },
        { command: 'link_homework', description: '🔗 Привязать ДЗ к уроку' },
        { command: 'grade_homework', description: '⭐ Оценить работу студента' },
        { command: 'add_material', description: '📚 Добавить учебный материал' },
        { command: 'create_variant', description: '🎓 Создать тест / вариант' },
        { command: 'help', description: '❓ Список всех команд' },
      ]);
    },
  });
}

main().catch((err) => {
  console.error('[AdminBot] Fatal error:', err);
  process.exit(1);
});
