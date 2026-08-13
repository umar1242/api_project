import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { TelegramAuthGuard } from "./telegram-auth.guard";

/**
 * Guards bot-facing internal API endpoints.
 * Bots authenticate using a shared SERVICE_TOKEN in the X-Service-Token header.
 *
 * It also falls back to TelegramAuthGuard so Mini Apps can call the same endpoints.
 */
@Injectable()
export class ServiceTokenGuard implements CanActivate {
  private telegramAuthGuard: TelegramAuthGuard;

  constructor(private readonly configService: ConfigService) {
    this.telegramAuthGuard = new TelegramAuthGuard(configService);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers["x-service-token"];
    const expectedToken = this.configService.get<string>("auth.serviceToken");

    if (token && token === expectedToken) {
      const adminId =
        request.headers["x-admin-telegram-id"] || request.body?.adminTelegramId;
      if (adminId) {
        (request as any).adminTelegramId = adminId;
      }
      return true;
    }

    try {
      return this.telegramAuthGuard.canActivate(context);
    } catch (e: any) {
      console.error(`[ServiceTokenGuard] auth failed: ${e.message}. Init data present? ${!!token}`);
      throw new UnauthorizedException(
        "Invalid or missing service token or Telegram auth",
      );
    }
  }
}
