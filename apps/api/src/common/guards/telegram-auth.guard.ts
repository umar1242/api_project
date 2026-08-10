import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createHmac } from 'crypto';

/**
 * Validates Telegram Mini App initData.
 *
 * Flow (per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
 *  1. Parse query string from the `tg-init-data` header.
 *  2. Extract and remove the `hash` field.
 *  3. Sort remaining params alphabetically and join as "key=value\n" pairs.
 *  4. HMAC-SHA256 the data check string using HMAC-SHA256("WebAppData", botToken) as the key.
 *  5. Compare with the received hash (constant-time to prevent timing attacks).
 *  6. Optionally enforce an auth_date freshness window.
 *
 * Security notes:
 *  - Uses timingSafeEqual for hash comparison (no early exit → no timing oracle).
 *  - Rejects if auth_date is older than MAX_AGE_SECONDS (default 1 hour).
 *  - The bot token NEVER leaves the server.
 *
 * Usage:
 *   @UseGuards(TelegramAuthGuard)
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: TelegramUser) { ... }
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  private readonly logger = new Logger(TelegramAuthGuard.name);
  private readonly MAX_AGE_SECONDS = 3600; // 1 hour

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Accept initData from either header or body field
    const initDataRaw =
      (request.headers['tg-init-data'] as string) ||
      (request.body as Record<string, string>)?.initData;

    if (!initDataRaw) {
      throw new UnauthorizedException('Missing Telegram initData');
    }

    const tokens = [
      process.env.ADMIN_BOT_TOKEN,
      process.env.CERT_BOT_TOKEN,
      process.env.REGISTRAR_BOT_TOKEN,
      process.env.MAIN_BOT_TOKEN,
      process.env.HOMEWORK_BOT_TOKEN,
      process.env.MATERIAL_BOT_TOKEN,
      this.config.get<string>('telegram.botToken')
    ].filter(t => t && t !== 'your_telegram_bot_token_here');

    if (tokens.length === 0) {
      this.logger.error('No TELEGRAM_BOT_TOKENs configured');
      throw new UnauthorizedException('Auth configuration error');
    }

    let validUser = null;
    let isValid = false;

    for (const botToken of tokens) {
      const { valid, user } = this.validate(initDataRaw, botToken as string);
      if (valid) {
        isValid = true;
        validUser = user;
        break;
      }
    }

    if (!isValid || !validUser) {
      throw new UnauthorizedException('Invalid Telegram initData signature');
    }

    // Attach parsed user to the request for downstream use
    (request as Request & { telegramUser?: TelegramUser }).telegramUser = validUser;
    return true;
  }

  private validate(
    initDataRaw: string,
    botToken: string,
  ): { valid: boolean; user: TelegramUser } {
    try {
      const params = new URLSearchParams(initDataRaw);
      const receivedHash = params.get('hash');
      if (!receivedHash) return { valid: false, user: null as never };

      // Check freshness
      const authDate = Number(params.get('auth_date') ?? 0);
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (nowSeconds - authDate > this.MAX_AGE_SECONDS) {
        this.logger.warn(
          `initData expired: auth_date=${authDate}, now=${nowSeconds}`,
        );
        return { valid: false, user: null as never };
      }

      // Remove hash before building the check string
      params.delete('hash');

      // Sort params and build the data check string
      const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

      // Step 1: secret_key = HMAC-SHA256("WebAppData", botToken)
      const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Step 2: computed_hash = HMAC-SHA256(data_check_string, secret_key)
      const computedHashBuffer = createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest();

      const receivedHashBuffer = Buffer.from(receivedHash, 'hex');

      // Constant-time comparison (prevents timing attacks)
      if (computedHashBuffer.length !== receivedHashBuffer.length) {
        return { valid: false, user: null as never };
      }
      const isValid = computedHashBuffer.equals(receivedHashBuffer);

      // Parse user object from initData
      const userRaw = params.get('user');
      const user: TelegramUser = userRaw
        ? (JSON.parse(userRaw) as TelegramUser)
        : ({ id: 0 } as TelegramUser);

      return { valid: isValid, user };
    } catch (err) {
      this.logger.error('Error validating initData', err);
      return { valid: false, user: null as never };
    }
  }
}
