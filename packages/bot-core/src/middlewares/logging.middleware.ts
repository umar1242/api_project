import { NextFunction, Context } from 'grammy';

export function logRequestMiddleware(botName: string) {
  return async (ctx: Context, next: NextFunction) => {
    const start = Date.now();
    const updateId = ctx.update?.update_id;
    const fromId = ctx.from?.id;
    const username = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name || 'unknown');
    const text = ctx.message?.text || ctx.callbackQuery?.data || (ctx.inlineQuery ? `inline: ${ctx.inlineQuery.query}` : '<non-text>');

    console.log(`[${botName}] [Update #${updateId}] From: ${username} (${fromId}) | Payload: ${text}`);

    try {
      await next();
    } finally {
      const elapsed = Date.now() - start;
      console.log(`[${botName}] [Update #${updateId}] Processed in ${elapsed}ms`);
    }
  };
}
