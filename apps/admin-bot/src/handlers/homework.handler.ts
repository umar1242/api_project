import { Context } from 'grammy';
import { apiClient } from '../api/api.client';

export async function linkHomeworkHandler(ctx: Context) {
  const text = ctx.message?.text || '';
  const parts = text.split(' ');
  if (parts.length !== 3) {
    return ctx.reply('Usage: /link_homework <assignment_id> <lesson_id>');
  }

  const assignmentId = parts[1];
  const lessonId = parts[2];

  try {
    await apiClient.linkHomework(assignmentId, lessonId);
    await ctx.reply(`✅ Assignment ${assignmentId} linked to lesson ${lessonId} successfully.`);
  } catch (err: any) {
    await ctx.reply(`❌ Failed to link homework:\n${err.message}`);
  }
}

export async function gradeHomeworkHandler(ctx: Context) {
  const text = ctx.message?.text || '';
  const parts = text.split(' ');
  if (parts.length !== 3) {
    return ctx.reply('Usage: /grade_homework <submission_id> <grade>');
  }

  const submissionId = parts[1];
  const grade = parts[2];

  try {
    await apiClient.gradeHomework(submissionId, grade);
    await ctx.reply(`✅ Submission ${submissionId} graded with ${grade} successfully.`);
  } catch (err: any) {
    await ctx.reply(`❌ Failed to grade homework:\n${err.message}`);
  }
}
