import { Context } from 'grammy';

export type ChatAction =
  | 'typing'
  | 'upload_photo'
  | 'record_video'
  | 'upload_video'
  | 'record_voice'
  | 'upload_voice'
  | 'upload_document'
  | 'choose_sticker'
  | 'find_location'
  | 'record_video_note'
  | 'upload_video_note';

/**
 * Executes an async task while maintaining a periodic chat action (e.g. typing)
 * so the Telegram user sees a continuous indicator until the result is ready.
 */
export async function withChatAction<T>(
  ctx: Context,
  action: ChatAction,
  task: () => Promise<T>
): Promise<T> {
  if (!ctx.chat?.id) {
    return task();
  }

  const chatId = ctx.chat.id;

  // Send immediate action
  ctx.api.sendChatAction(chatId, action).catch(() => {});

  // Set interval to re-send action every 4.5 seconds (Telegram actions expire in 5s)
  const interval = setInterval(() => {
    ctx.api.sendChatAction(chatId, action).catch(() => {});
  }, 4500);

  try {
    return await task();
  } finally {
    clearInterval(interval);
  }
}
