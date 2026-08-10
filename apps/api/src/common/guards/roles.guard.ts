import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { PrismaService } from "../../database/prisma.service";
import { TelegramUser } from "./telegram-auth.guard";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const telegramUser: TelegramUser = request.telegramUser;

    if (!telegramUser) {
      // If authenticating via ServiceTokenGuard, we require an explicit admin ID
      const adminId = request.adminTelegramId;
      if (!adminId) {
        throw new ForbiddenException(
          "Admin telegram ID is required for service calls to roles-protected endpoints",
        );
      }

      const dbUser = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(adminId) },
      });

      if (!dbUser) {
        throw new ForbiddenException("Admin user not found in database");
      }

      if (!requiredRoles.includes(dbUser.role)) {
        throw new ForbiddenException("Insufficient permissions");
      }

      return true;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUser.id) },
    });

    if (!dbUser) {
      throw new ForbiddenException("User not found in database");
    }

    if (!requiredRoles.includes(dbUser.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
