import { Bot } from 'grammy';
import { config } from './config';
import { apiClient } from './api/api.client';

const bot = new Bot(config.telegramToken);

bot.command('start', async (ctx) => {
  await ctx.api.setChatMenuButton({
    chat_id: ctx.chat.id,
    menu_button: {
      type: 'web_app',
      text: 'Homeworks',
      web_app: { url: config.miniAppUrl }
    }
  });

  await ctx.reply(
    `Welcome to the Homework Bot!\n\nClick the button below to view and submit your homework.`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: '📚 Open Homework App', web_app: { url: config.miniAppUrl } }],
        ],
        resize_keyboard: true,
      },
    },
  );
});

bot.catch((err) => {
  console.error('Bot Error:', err);
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Homework bot started as @${botInfo.username}`);
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
