import { Bot } from 'grammy';
import { config } from './config';

const bot = new Bot(config.telegramToken);

bot.command('start', async (ctx) => {
  await ctx.api.setChatMenuButton({
    chat_id: ctx.chat.id,
    menu_button: {
      type: 'web_app',
      text: 'Cert App',
      web_app: { url: config.webAppUrl }
    }
  });

  await ctx.reply('🎓 Welcome to the Certification Bot!\n\nHere you can take certification tests and view your results.', {
    reply_markup: {
      keyboard: [
        [{ text: '📝 Take Test', web_app: { url: config.webAppUrl } }],
      ],
      resize_keyboard: true,
    }
  });
});

bot.catch((err) => {
  console.error('Bot Error:', err);
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Certification bot started as @${botInfo.username}`);
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
