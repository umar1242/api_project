import { Bot, BotError } from 'grammy';
import { AxiosError } from 'axios';

/**
 * Extracts a clean, human-readable error message from API / network errors
 */
export function handleApiError(error: unknown, fallbackMessage = 'Произошла ошибка при обработке запроса.'): string {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosErr = error as AxiosError<any>;
    if (axiosErr.response?.data) {
      const data = axiosErr.response.data;
      if (typeof data.message === 'string') return data.message;
      if (Array.isArray(data.message)) return data.message.join(', ');
      if (typeof data.error === 'string') return data.error;
    }
    if (axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ETIMEDOUT') {
      return 'Сервер временно недоступен. Пожалуйста, повторите попытку позже.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * Sets up global error handling for a grammY Bot instance
 */
export function setupBotErrorHandler(bot: Bot<any>, botName: string): void {
  bot.catch((err: BotError) => {
    const ctx = err.ctx;
    console.error(`[${botName}] Unhandled error while processing update ${ctx?.update?.update_id}:`, err.error);
    
    // Attempt to inform user if context allows replying
    try {
      if (ctx.chat?.id) {
        ctx.reply('⚠️ Произошла внутренняя ошибка. Мы уже работаем над исправлением.').catch(() => {});
      }
    } catch {
      // Ignore reply failure during error handling
    }
  });
}
