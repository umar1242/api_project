import { Bot, session, Context, SessionFlavor, InlineKeyboard } from 'grammy';
import { conversations, createConversation, ConversationFlavor, Conversation } from '@grammyjs/conversations';
import { config } from './config';
import { apiClient } from './api/api.client';

interface SessionData {
  refLink?: string;
}

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>(config.telegramToken);

bot.use(session({ initial: () => ({ conversation: {} }) }));
bot.use(conversations());

async function registrationConversation(conversation: MyConversation, ctx: MyContext) {
  const refLink = ctx.match as string;
  if (!refLink || typeof refLink !== 'string') return;

  try {
    const { data: course } = await conversation.external(() => apiClient.get(`/courses/${refLink}`));
    
    await ctx.reply(`Добро пожаловать! Вы регистрируетесь на курс <b>${course.title}</b>.\n\nВведите ваше ФИО:`, { parse_mode: 'HTML' });
    const nameCtx = await conversation.wait();
    if (nameCtx.message?.text === '/cancel') return ctx.reply('Регистрация отменена.');
    const fullName = nameCtx.message?.text || 'Без имени';

    await ctx.reply('Введите ваш номер телефона (или нажмите /skip, если хотите пропустить):');
    const phoneCtx = await conversation.wait();
    if (phoneCtx.message?.text === '/cancel') return ctx.reply('Регистрация отменена.');
    const phone = phoneCtx.message?.text === '/skip' ? undefined : phoneCtx.message?.text;

    await ctx.reply('Создаю вашу анкету ученика...');

    const { data: enrollment } = await conversation.external(() => apiClient.post('/enrollments', {
      refLink,
      fullName,
      phone,
      metadata: { registeredVia: 'BotConversation' }
    }));

    const kb = new InlineKeyboard()
      .text('Да, хочу зайти', `join_${enrollment.inviteLink}`)
      .text('Нет, позже', 'join_later');

    await ctx.reply(
      `Резюме успешно создано!\n\nВаше имя: ${fullName}\nВаш телефон: ${phone || 'Не указан'}\n\nХотите ли вы сейчас зайти в приватную группу курса?`,
      { reply_markup: kb }
    );
  } catch (err: any) {
    if (err.response?.status === 404) {
      await ctx.reply('Извините, курс не найден или ссылка недействительна.');
    } else {
      console.error('API Error:', err.message);
      await ctx.reply('Произошла ошибка при регистрации. Возможно, вы уже зарегистрированы.');
    }
  }
}

bot.use(createConversation(registrationConversation));

bot.command('start', async (ctx) => {
  const refLink = ctx.match;
  if (!refLink) {
    return ctx.reply('Добро пожаловать! Пожалуйста, перейдите по правильной реферальной ссылке курса для регистрации.');
  }

  await ctx.conversation.enter('registrationConversation');
});

bot.callbackQuery(/^join_(.+)$/, async (ctx) => {
  const action = ctx.match[1];
  if (action === 'later') {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('Хорошо! Вы сможете зайти в группу позже. Свяжитесь с куратором, когда будете готовы.');
    return;
  }

  // It's an invite link
  const inviteLink = action;
  
  const kb = new InlineKeyboard().url('Перейти в группу', inviteLink);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('Отлично! Вот ваша одноразовая ссылка для входа в группу (она работает только один раз):', {
    reply_markup: kb
  });
});

// Listen for when the bot is added to a group
bot.on('my_chat_member', async (ctx) => {
  const newStatus = ctx.myChatMember.new_chat_member.status;

  if (newStatus === 'member' || newStatus === 'administrator') {
    const chat = ctx.myChatMember.chat;
    if (chat.type === 'group' || chat.type === 'supergroup') {
      try {
        await apiClient.post('/groups', {
          courseId: null, // Unlinked
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
