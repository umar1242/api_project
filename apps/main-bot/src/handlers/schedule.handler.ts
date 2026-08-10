import { Bot, Context } from 'grammy';
import { config } from '../config';
import { getUpcomingLessons } from '../api/schedule.api';

/**
 * Registers the /schedule command handler.
 *
 * Fetches the student's group from their enrollment and
 * sends the next 3 upcoming lessons as a formatted message.
 */
export function registerScheduleHandler(bot: Bot<Context>): void {
  bot.command('schedule', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    await ctx.replyWithChatAction('typing');

    try {
      // Step 1: Look up the user's profile and active enrollment
      const { apiClient } = await import('../api/api.client');
      const userRes = await apiClient.get(`/users/by-telegram/${telegramId}`);
      const user = userRes.data;

      if (!user) {
        return ctx.reply('⚠️ Your account was not found. Please register first using the registration bot.');
      }

      const enrollRes = await apiClient.get('/enrollments', {
        params: { userId: user.id },
      });
      const enrollments: Array<{ groupId: string; status: string }> = enrollRes.data?.data ?? [];
      const active = enrollments.find((e) => e.status === 'ACTIVE');

      if (!active) {
        return ctx.reply('ℹ️ You are not currently enrolled in any active course.');
      }

      // Step 2: Fetch upcoming lessons for this group
      const lessons = await getUpcomingLessons(active.groupId, 3);

      if (lessons.length === 0) {
        return ctx.reply('📅 No upcoming lessons scheduled for your group yet.');
      }

      // Step 3: Format and send
      const lines = lessons.map((lesson, i) => {
        const date = new Date(lesson.startsAt).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const typeIcon = lesson.type === 'ONLINE' ? '📹' : '🎥';
        const link = lesson.meetingUrl ? `\n   <a href="${lesson.meetingUrl}">Join Link</a>` : '';
        return `${i + 1}. ${typeIcon} <b>${lesson.title}</b>\n   📅 ${date} (${lesson.durationMin} min)${link}`;
      });

      await ctx.reply(`🗓 <b>Your Upcoming Lessons</b>\n\n${lines.join('\n\n')}`, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Open Dashboard', web_app: { url: config.miniAppUrl } }],
          ],
        },
      });
    } catch (err: unknown) {
      console.error('[schedule handler] Error:', err);
      await ctx.reply('⚠️ An error occurred. Please try again later.');
    }
  });
}
