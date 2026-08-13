import { Bot } from 'grammy';
import { config } from './config';
import { apiClient } from './api/api.client';

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

  await ctx.reply('🎓 Welcome to the Certification Bot!\n\nOpen the app to browse public tests, or if your teacher gave you a code, tap "Enter Code" inside the app to jump straight to your test.', {
    reply_markup: {
      keyboard: [
        [{ text: '📝 Open App', web_app: { url: config.webAppUrl } }],
      ],
      resize_keyboard: true,
    }
  });
});

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim().toUpperCase();
  
  if (text.length === 5) {
    try {
      const res = await apiClient.get(`/variants/by-code/${text}`);
      if (res.data && res.data.id) {
        await ctx.reply(`🎓 Found test: ${res.data.title}\n\nTap the button below to open it.`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: `📝 Open Test`, web_app: { url: `${config.webAppUrl}/tests/${res.data.id}` } }]
            ]
          }
        });
      }
    } catch (err) {
      await ctx.reply('❌ Invalid or unknown access code.');
    }
  } else {
    await ctx.reply('Send me a 5-character access code to open a test.');
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
