import { Bot, session, GrammyError, HttpError, Context, SessionFlavor } from 'grammy';
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

  // ── Middleware ──────────────────────────────────────────────────────────────

  // Add session support (in-memory for Stage 1; replace with Redis in Stage 3)
  bot.use(session({ initial: (): SessionData => ({ awaitingMaterial: null }) }));
  
  // Add conversations support
  bot.use(conversations());
  bot.use(createConversation(createVariantConversation));

  // Request logging
  bot.use(async (ctx, next) => {
    const from = ctx.from
      ? `${ctx.from.id} (@${ctx.from.username ?? 'unknown'})`
      : 'unknown';
    const updateKeys = Object.keys(ctx.update).filter(k => k !== 'update_id');
    const update = updateKeys.length > 0 ? updateKeys[0] : 'unknown';
    const text = ctx.message?.text ?? '';
    console.log(`[AdminBot] [${update}] from=${from} text="${text}"`);
    await next();
  });

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

  // Catch all cancel
  bot.command('cancel', async (ctx) => {
    ctx.session.awaitingMaterial = null;
    await ctx.reply('Action canceled.');
  });

  // Handle incoming files
  bot.on(['message:document', 'message:video', 'message:photo'], handleMaterialUpload);

  // ── Keyboard button aliases ────────────────────────────────────────────────

  bot.hears('👥 Users', usersListHandler);
  bot.hears('❓ Help', helpHandler);

  // ── Error handling ─────────────────────────────────────────────────────────

  bot.catch((err) => {
    const { ctx, error } = err;
    if (error instanceof GrammyError) {
      console.error('[AdminBot] grammy error:', error.description);
    } else if (error instanceof HttpError) {
      console.error('[AdminBot] HTTP error:', error.error);
    } else {
      console.error('[AdminBot] Unexpected error:', error);
    }
    // Notify the user something went wrong (best-effort)
    void ctx.reply('⚠️ An unexpected error occurred. Please try again.').catch(() => {});
  });

  // ── Start polling ──────────────────────────────────────────────────────────

  // Graceful shutdown
  process.once('SIGTERM', () => {
    console.log('[AdminBot] SIGTERM received — stopping...');
    bot.stop();
  });
  process.once('SIGINT', () => {
    console.log('[AdminBot] SIGINT received — stopping...');
    bot.stop();
  });

  await bot.start({
    onStart: (info) => {
      console.log(`[AdminBot] Running as @${info.username} (${info.id})`);
      console.log('[AdminBot] Polling for updates...');
    },
  });
}

main().catch((err) => {
  console.error('[AdminBot] Fatal error:', err);
  process.exit(1);
});
