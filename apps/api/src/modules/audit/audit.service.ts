import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    adminTelegramId: bigint,
    action: string,
    entityId?: bigint,
    entityType?: string,
    details?: any,
  ) {
    try {
      const admin = await this.prisma.user.findUnique({
        where: { telegramId: adminTelegramId },
      });
      if (!admin) {
        this.logger.warn(
          `Cannot create audit log: Admin with telegramId ${adminTelegramId} not found`,
        );
        return;
      }
      await this.prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action,
          entityId,
          entityType,
          details,
        },
      });
      this.logger.log(
        `Audit log created: ${action} by admin ${admin.id} (TG: ${adminTelegramId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
    }
  }
}
