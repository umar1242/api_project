import { Bot } from 'grammy';
import { config } from './config';

const bot = new Bot(config.telegramToken);

bot.command('start', async (ctx) => {
  // ctx.match содержит payload после /start, например "variant_123"
  const payload = ctx.match?.toString().trim();
  let targetUrl = config.webAppUrl;
  let buttonText = '📝 Take Test';

  if (payload && payload.startsWith('variant_')) {
    const variantId = payload.replace('variant_', '');
    if (variantId) {
      targetUrl = `${config.webAppUrl}/tests/${variantId}`;
      buttonText = '📝 Open This Test';
    }
  }

  await ctx.api.setChatMenuButton({
    chat_id: ctx.chat.id,
    menu_button: {
      type: 'web_app',
      text: 'Cert App',
      web_app: { url: config.webAppUrl }
    }
  });

  if (payload && payload.startsWith('variant_')) {
    await ctx.reply('🎓 You were invited to take a certification test!\n\nTap the button below to open it.', {
      reply_markup: {
        keyboard: [
          [{ text: buttonText, web_app: { url: targetUrl } }],
        ],
        resize_keyboard: true,
      }
    });
  } else {
    await ctx.reply('🎓 Welcome to the Certification Bot!\n\nHere you can take certification tests and view your results.', {
      reply_markup: {
        keyboard: [
          [{ text: buttonText, web_app: { url: targetUrl } }],
        ],
        resize_keyboard: true,
      }
    });
  }
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
