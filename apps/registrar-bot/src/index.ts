import { Bot } from 'grammy';
import { config } from './config';
import { apiClient } from './api/api.client';

const bot = new Bot(config.telegramToken);

bot.command('start', async (ctx) => {
  await ctx.reply(
    '👋 Добро пожаловать!\n\nЕсли у вас есть код курса от куратора — просто отправьте его сюда (5 символов), и я пришлю кнопку для регистрации.'
  );
});

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim().toUpperCase();

  if (text.length === 5) {
    try {
      const { data: course } = await apiClient.get(`/courses/by-code/${text}`);
      await ctx.reply(
        `📚 Найден курс: <b>${course.title}</b>${course.description ? `\n${course.description}` : ''}\n\nНажмите кнопку ниже, чтобы зарегистрироваться.`,
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
      await ctx.reply('❌ Неверный или неизвестный код курса.');
    }
  } else {
    await ctx.reply('Отправьте мне 5-значный код курса, чтобы начать регистрацию.');
  }
});

bot.on('my_chat_member', async (ctx) => {
  const newStatus = ctx.myChatMember.new_chat_member.status;

  if (newStatus === 'member' || newStatus === 'administrator') {
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
          'Hello! I am ready to manage this group. An admin must now link it to a course in the system.',
        );
      } catch (err: any) {
        console.error('Failed to register group:', err.message);
      }
    }
  }
});

bot.catch((err) => {
  console.error('Bot Error:', err);
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Registrar bot started as @${botInfo.username}`);
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
