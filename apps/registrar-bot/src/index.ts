import { Bot } from 'grammy';
import { config } from './config';
import { apiClient } from './api/api.client';
import {
  logRequestMiddleware,
  setupBotErrorHandler,
  setupBotCommands,
  upsertUserMiddleware,
  ExtendedContext,
} from '@bot/core';

const bot = new Bot<ExtendedContext>(config.telegramToken);

// ── Core Middlewares ──────────────────────────────────────────────────────────
bot.use(logRequestMiddleware('RegistrarBot'));
bot.use(upsertUserMiddleware(apiClient));

// ── Helper to resolve course and respond ──────────────────────────────────────
async function handleCourseCode(ctx: any, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (code.length === 5) {
    try {
      const { data: course } = await apiClient.get(`/courses/by-code/${code}`);
      await ctx.reply(
        `📚 Найден курс: <b>${course.title}</b>${course.description ? `\n${course.description}` : ''}\n\nНажмите кнопку ниже, чтобы завершить регистрацию:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📝 Записаться на курс', web_app: { url: `${config.miniAppUrl}/register/${course.refLink}` } }],
            ],
          },
        },
      );
    } catch (err: any) {
      await ctx.reply('❌ Неверный или неизвестный код курса. Проверьте правильность кода от куратора.');
    }
  } else {
    await ctx.reply('ℹ️ Отправьте 5-значный код курса (например: <code>MATH1</code>), чтобы начать регистрацию.', { parse_mode: 'HTML' });
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const match = ctx.match?.trim();

  // If started with deep link payload: /start MATH1
  if (match) {
    return handleCourseCode(ctx, match);
  }

  await ctx.reply(
    '👋 <b>Добро пожаловать в бот регистрации на курсы!</b>\n\n' +
    'Если у вас есть код курса от куратора — просто отправьте его сюда (5 символов), и я пришлю прямую ссылку для записи.',
    { parse_mode: 'HTML' }
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    'ℹ️ <b>Справка Registrar Bot</b>\n\n' +
    '• <code>/start</code> — Начать работу\n' +
    '• <code>/start &lt;КОД&gt;</code> — Быстрая регистрация по коду\n' +
    '• <code>/link_course &lt;group_id&gt; &lt;course_id&gt;</code> — Привязать группу к курсу (для админов)\n' +
    '• Отправьте 5-значный код в чат, чтобы получить форму записи на курс.',
    { parse_mode: 'HTML' }
  );
});

bot.command('link_course', async (ctx) => {
  const raw = ctx.match?.trim() ?? '';
  const [groupId, courseId] = raw.split(/\s+/);

  if (!groupId || !courseId) {
    await ctx.reply(
      'Использование: <code>/link_course &lt;group_id&gt; &lt;course_id&gt;</code>\nПример: <code>/link_course 1 2</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }

  try {
    const { data: group } = await apiClient.patch(`/groups/${groupId}/link`, { courseId });
    await ctx.reply(
      `✅ Группа <b>${group.title || groupId}</b> успешно привязана к курсу ID <code>${courseId}</code>!`,
      { parse_mode: 'HTML' }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Ошибка привязки группы: ${err.message || 'Сбой API'}`);
  }
});

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return;
  await handleCourseCode(ctx, text);
});

// ── Group Onboarding ─────────────────────────────────────────────────────────
bot.on('my_chat_member', async (ctx) => {
  const newMember = ctx.myChatMember.new_chat_member;
  const status = newMember.status;

  if (status === 'member' || status === 'administrator') {
    const chat = ctx.myChatMember.chat;
    if (chat.type === 'group' || chat.type === 'supergroup') {
      try {
        await apiClient.post('/groups', {
          courseId: null,
          telegramChatId: chat.id.toString(),
          title: chat.title || 'Unknown Group',
          description: 'Auto-registered by Registrar Bot',
        });
        await bot.api.sendMessage(
          chat.id,
          '👋 Здравствуйте! Бот регистрации успешно подключен к группе.\nАдминистратор может привязать эту группу к курсу через команду /link_course или в панели управления.',
        );
      } catch (err: any) {
        console.error('[Registrar Bot] Failed to register group:', err.message);
      }
    }
  }
});

// ── Global Error Handler ──────────────────────────────────────────────────────
setupBotErrorHandler(bot, 'RegistrarBot');

// ── Start polling ─────────────────────────────────────────────────────────────
bot.start({
  onStart: async (botInfo) => {
    console.log(`Registrar bot started as @${botInfo.username}`);
    await setupBotCommands(bot, [
      { command: 'start', description: '🚀 Начать регистрацию на курс' },
      { command: 'link_course', description: '🔗 Привязать группу к курсу (админ)' },
      { command: 'help', description: 'ℹ️ Справка и инструкция' },
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
