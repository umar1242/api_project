import { Conversation } from '@grammyjs/conversations';
import { InlineKeyboard } from 'grammy';
import { MyContext } from '../index';
import { apiClient } from '../api/api.client';
import { config } from '../config';

export type MyConversation = Conversation<MyContext>;

export async function createVariantConversation(conversation: MyConversation, ctx: MyContext) {
  // 1. Ask for Title
  await ctx.reply('📝 Введите название варианта (например, "Тест по математике №1"):');
  const titleCtx = await conversation.wait();
  if (titleCtx.message?.text === '/cancel') return ctx.reply('Отменено.');
  const title = titleCtx.message?.text || 'Без названия';

  // 2. Ask for File
  await ctx.reply('📎 Отправьте файл задания (PDF, Word или Изображение) или нажмите /skip, чтобы пропустить:');
  const fileCtx = await conversation.wait();
  if (fileCtx.message?.text === '/cancel') return ctx.reply('Отменено.');
  
  let fileUrl = '';
  if (fileCtx.message?.document) {
    fileUrl = fileCtx.message.document.file_id;
  } else if (fileCtx.message?.photo) {
    fileUrl = fileCtx.message.photo[fileCtx.message.photo.length - 1].file_id;
  } else if (fileCtx.message?.text === '/skip') {
    fileUrl = '';
  } else {
    fileUrl = '';
  }

  // 3. Ask for Description
  await ctx.reply('✍️ Введите описание варианта (или /skip):');
  const descCtx = await conversation.wait();
  if (descCtx.message?.text === '/cancel') return ctx.reply('Отменено.');
  const description = descCtx.message?.text === '/skip' ? undefined : descCtx.message?.text;

  // 4. Ask for Deadline
  await ctx.reply('⏳ Введите дедлайн (Формат: YYYY-MM-DD HH:mm) или /skip:');
  const deadlineCtx = await conversation.wait();
  if (deadlineCtx.message?.text === '/cancel') return ctx.reply('Отменено.');
  let deadlineAt: string | undefined = undefined;
  if (deadlineCtx.message?.text && deadlineCtx.message?.text !== '/skip') {
    const d = new Date(deadlineCtx.message.text);
    if (!isNaN(d.getTime())) {
      deadlineAt = d.toISOString();
    } else {
      await ctx.reply('Неверный формат даты. Дедлайн не установлен.');
    }
  }

  // 5. Ask for Type 1 Count
  await ctx.reply('🔢 Введите количество заданий ТИП 1 (С выбором ответа, 4 или 6 вариантов):');
  const t1Ctx = await conversation.wait();
  if (t1Ctx.message?.text === '/cancel') return ctx.reply('Отменено.');
  const type1Count = parseInt(t1Ctx.message?.text || '0') || 0;

  // 6. Ask for Type 2 Count
  await ctx.reply('🔢 Введите количество заданий ТИП 2 (С вводом точного ответа/формулы, используется MathKeyboard):');
  const t2Ctx = await conversation.wait();
  if (t2Ctx.message?.text === '/cancel') return ctx.reply('Отменено.');
  const type2Count = parseInt(t2Ctx.message?.text || '0') || 0;

  // 7. Ask for Type 3 Count
  await ctx.reply('🔢 Введите количество заданий ТИП 3 (Письменная работа, с прикреплением фото-решения):');
  const t3Ctx = await conversation.wait();
  if (t3Ctx.message?.text === '/cancel') return ctx.reply('Отменено.');
  const type3Count = parseInt(t3Ctx.message?.text || '0') || 0;

  // 8. Create Variant via API
  await ctx.reply('Создаю шаблон варианта в системе...');
  
  try {
    const tasks = [];
    let orderIndex = 1;

    for (let i = 0; i < type1Count; i++) {
      tasks.push({ type: 'MULTIPLE_CHOICE', orderIndex: orderIndex++, optionsCount: 4 });
    }
    for (let i = 0; i < type2Count; i++) {
      tasks.push({ type: 'SPECIFIC_ANSWER', orderIndex: orderIndex++ });
    }
    for (let i = 0; i < type3Count; i++) {
      tasks.push({ type: 'WRITTEN_WORK', orderIndex: orderIndex++, requiresAdmin: true });
    }

    const { data: variant } = await conversation.external(() => apiClient.post('/variants', {
      title,
      description,
      fileUrl,
      deadlineAt,
      type: 'CERTIFICATION',
      tasks
    }));

    const webAppUrl = `${config.webAppUrl}/variants/${variant.id}/edit`;
    const kb = new InlineKeyboard().webApp('Ввести ответы заданий', webAppUrl);

    await ctx.reply(
      `✅ Шаблон варианта <b>${title}</b> создан.\n\n` +
      `Количество заданий:\n` +
      `Тип 1: ${type1Count}\n` +
      `Тип 2: ${type2Count}\n` +
      `Тип 3: ${type3Count}\n\n` +
      `Нажмите на кнопку ниже, чтобы ввести правильные ответы для проверки.`,
      { parse_mode: 'HTML', reply_markup: kb }
    );
  } catch (err: any) {
    console.error('Create variant error:', err.response?.data || err.message);
    await ctx.reply('❌ Ошибка при создании варианта.');
  }
}

export async function createVariantHandler(ctx: MyContext) {
  await ctx.conversation.enter('createVariantConversation');
}
