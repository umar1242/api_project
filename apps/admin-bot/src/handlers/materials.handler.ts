import { NextFunction } from 'grammy';
import { MyContext } from '../index';
import { apiClient } from '../api/api.client';

export async function addMaterialHandler(ctx: MyContext) {
  const text = ctx.message?.text || '';
  const parts = text.split(' ');
  if (parts.length < 2) {
    return ctx.reply('Usage: /add_material <group_id> [lesson_id]');
  }

  const groupId = parts[1];
  const lessonId = parts[2] || undefined;

  ctx.session.awaitingMaterial = { groupId, lessonId };
  await ctx.reply('Please send the file (document, video, or photo) for the material now. Or type /cancel to cancel.');
}

export async function handleMaterialUpload(ctx: MyContext, next: NextFunction) {
  if (!ctx.session?.awaitingMaterial) {
    return next();
  }

  const message = ctx.message;
  if (!message || (!message.document && !message.video && !message.photo)) {
    return next();
  }

  const { groupId, lessonId } = ctx.session.awaitingMaterial;
  
  let telegramFileId = '';
  let title = 'Uploaded Material';
  let type = 'DOCUMENT';

  if (message.document) {
    telegramFileId = message.document.file_id;
    title = message.document.file_name || title;
    type = 'DOCUMENT';
  } else if (message.video) {
    telegramFileId = message.video.file_id;
    title = message.video.file_name || 'Video Material';
    type = 'VIDEO';
  } else if (message.photo) {
    // Get the highest resolution photo
    const photo = message.photo[message.photo.length - 1];
    telegramFileId = photo.file_id;
    title = 'Photo Material';
    type = 'PHOTO';
  }

  try {
    await apiClient.createMaterial({
      groupId,
      lessonId,
      telegramFileId,
      title,
      type
    });
    
    ctx.session.awaitingMaterial = null;
    await ctx.reply('✅ Material uploaded and added successfully.');
  } catch (err: any) {
    await ctx.reply(`❌ Failed to add material:\n${err.message}`);
  }
}
