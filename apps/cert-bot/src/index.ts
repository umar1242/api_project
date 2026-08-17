import { Bot } from 'grammy';
import { config } from './config';
import { apiClient } from './api/api.client';
import {
  logRequestMiddleware,
  setupBotErrorHandler,
  setupBotCommands,
  upsertUserMiddleware,
  ExtendedContext,
} from '../packages/bot-core/src';

const bot = new Bot<ExtendedContext>(config.telegramToken);

// ── Core Middlewares ──────────────────────────────────────────────────────────
bot.use(logRequestMiddleware('CertBot'));
bot.use(upsertUserMiddleware(apiClient));

// ── Helper to resolve variant and respond ────────────────────────────────────
async function handleVariantCode(ctx: any, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (code.length === 5) {
    try {
      const res = await apiClient.get(`/variants/by-code/${code}`);
      if (res.data && res.data.id) {
        await ctx.reply(
          `🎓 <b>Найден тест:</b> ${res.data.title}\n\nНажмите кнопку ниже, чтобы приступить к тестированию:`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📝 Начать тест', web_app: { url: `${config.webAppUrl}/tests/${res.data.id}` } }],
              ],
            },
          }
        );
      } else {
        await ctx.reply('❌ Тест по данному коду не найден.');
      }
    } catch (err) {
      await ctx.reply('❌ Неверный или неизвестный код теста.');
    }
  } else {
    await ctx.reply('ℹ️ Отправьте 5-значный код теста, чтобы открыть его.');
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const match = ctx.match?.trim();

  // Set chat menu button
  await ctx.api.setChatMenuButton({
    chat_id: ctx.chat.id,
    menu_button: {
      type: 'web_app',
      text: 'Тесты',
      web_app: { url: config.webAppUrl },
    },
  });

  // Deep linking: /start TEST1
  if (match) {
    return handleVariantCode(ctx, match);
  }

  await ctx.reply(
    '🎓 <b>Добро пожаловать в бот тестирования и сертификации!</b>\n\n' +
    'Откройте приложение для просмотра доступных тестов или отправьте мне 5-значный код доступа.',
    {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: '📝 Открыть тесты', web_app: { url: config.webAppUrl } }],
          [{ text: '❓ Помощь' }],
        ],
        resize_keyboard: true,
      },
    }
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    'ℹ️ <b>Справка Certification Bot</b>\n\n' +
    '• <code>/start</code> — Главное меню и запуск приложения тестов\n' +
    '• <code>/start &lt;КОД&gt;</code> — Прямой запуск теста по коду\n' +
    '• Отправьте 5-значный код прямо в чат для открытия конкретного теста.',
    { parse_mode: 'HTML' }
  );
});

bot.hears('❓ Помощь', async (ctx) => {
  await ctx.reply(
    'ℹ️ Чтобы пройти тест, нажмите кнопку «📝 Открыть тесты» или отправьте 5-значный код доступа от преподавателя.'
  );
});

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return;
  await handleVariantCode(ctx, text);
});

// ── Inline Queries ────────────────────────────────────────────────────────────
bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query.trim().toUpperCase();

  try {
    const results: any[] = [];

    if (query.length === 5) {
      try {
        const { data: variant } = await apiClient.get(`/variants/by-code/${query}`);
        if (variant && variant.id) {
          results.push({
            type: 'article',
            id: `variant_${variant.id}`,
            title: `🎓 Тест: ${variant.title}`,
            description: variant.description || 'Нажмите, чтобы поделиться тестом',
            input_message_content: {
              message_text: `🎓 <b>Тестирование:</b> ${variant.title}\n\nНажмите кнопку ниже для прохождения теста:`,
              parse_mode: 'HTML',
            },
            reply_markup: {
              inline_keyboard: [
                [{ text: '📝 Пройти тест', web_app: { url: `${config.webAppUrl}/tests/${variant.id}` } }],
              ],
            },
          });
        }
      } catch {}
    }

    // Also fetch public variants
    try {
      const { data: variantsRes } = await apiClient.get('/variants', { params: { take: 5 } });
      const variants = Array.isArray(variantsRes) ? variantsRes : variantsRes?.data || [];
      for (const v of variants) {
        if (!results.some((r) => r.id === `variant_${v.id}`)) {
          results.push({
            type: 'article',
            id: `variant_${v.id}`,
            title: `🎓 ${v.title}`,
            description: v.description || 'Онлайн-тест',
            input_message_content: {
              message_text: `🎓 <b>Тест:</b> ${v.title}\n\nПройдите тестирование по ссылке ниже:`,
              parse_mode: 'HTML',
            },
            reply_markup: {
              inline_keyboard: [
                [{ text: '📝 Начать тест', web_app: { url: `${config.webAppUrl}/tests/${v.id}` } }],
              ],
            },
          });
        }
      }
    } catch {}

    await ctx.answerInlineQuery(results, { cache_time: 10 });
  } catch (err) {
    await ctx.answerInlineQuery([], { cache_time: 5 });
  }
});

// ── Global Error Handler ──────────────────────────────────────────────────────
setupBotErrorHandler(bot, 'CertBot');

// ── Start polling ─────────────────────────────────────────────────────────────
bot.start({
  onStart: async (botInfo) => {
    console.log(`Certification bot started as @${botInfo.username}`);
    await setupBotCommands(bot, [
      { command: 'start', description: '🎓 Открыть тесты и сертификацию' },
      { command: 'help', description: '❓ Помощь и инструкция' },
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
