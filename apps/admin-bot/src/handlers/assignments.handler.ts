import { Context } from 'grammy';
import { apiClient } from '../api/api.client';

export const createAssignmentHandler = async (ctx: Context) => {
  const args = ctx.message?.text?.split(' ').slice(1);
  if (!args || args.length === 0) {
    return ctx.reply('Usage: /create_assignment <title>');
  }

  const title = args.join(' ');

  try {
    const assignment = await apiClient.createAssignment({
      title,
      description: 'Created by AdminBot',
    });
    
    await ctx.reply(
      `✅ Assignment created successfully!\n\nID: <code>${assignment.id}</code>\nTitle: <b>${assignment.title}</b>`,
      { parse_mode: 'HTML' }
    );
  } catch (err: any) {
    console.error('Failed to create assignment:', err);
    await ctx.reply(`⚠️ Failed to create assignment: ${err.message}`);
  }
};
