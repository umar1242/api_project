import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { TelegramUser } from '../guards/telegram-auth.guard';

/**
 * Extracts the parsed Telegram user from the request.
 * Must be used on endpoints protected by TelegramAuthGuard.
 *
 * @example
 * @UseGuards(TelegramAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: TelegramUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TelegramUser => {
    const request = ctx.switchToHttp().getRequest<
      Request & { telegramUser?: TelegramUser }
    >();
    return request.telegramUser as TelegramUser;
  },
);
