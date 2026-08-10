import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendNotification(userId: bigint, title: string, message: string, type: string) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
        },
      });
      this.logger.log(`Notification sent to user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUnread(userId: bigint) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
