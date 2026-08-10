import { CommandContext, Context } from 'grammy';

/**
 * /help command — shows all available commands and their descriptions.
 */
export async function helpHandler(ctx: Context): Promise<void> {
  const helpText = [
    '📖 <b>Admin Bot Commands</b>\n',
    '/start — Register &amp; show main menu',
    '/help — Show this help message',
    '/users — List registered users (latest 10)',
    '/user &lt;id&gt; — Get user info by Telegram ID',
    '/ban &lt;id&gt; — Ban a user',
    '/unban &lt;id&gt; — Restore a banned user',
    '\n<i>More commands coming in future stages (courses, groups, reports).</i>',
  ].join('\n');

  await ctx.reply(helpText, { parse_mode: 'HTML' });
}
