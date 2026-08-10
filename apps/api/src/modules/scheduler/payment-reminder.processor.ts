import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Processor("payment-reminders")
export class PaymentReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentReminderProcessor.name);

  constructor(
    private db: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { enrollmentId } = job.data;
    this.logger.log(
      `Processing payment reminder for enrollment ${enrollmentId}`,
    );

    const enrollment = await this.db.enrollment.findUnique({
      where: { id: BigInt(enrollmentId) },
      include: { group: { include: { course: true } } },
    });

    if (!enrollment) {
      this.logger.warn(`Enrollment ${enrollmentId} not found`);
      return;
    }

    // Double check it's still unpaid
    if (enrollment.paymentPaidAt) {
      this.logger.log(
        `Enrollment ${enrollmentId} is already paid. Skipping reminder.`,
      );
      return;
    }

    const courseTitle =
      enrollment.group?.course?.title || `Группа ${enrollment.groupId}`;

    this.logger.log(
      `Sending payment reminder to user ${enrollment.userId} for course ${courseTitle}`,
    );

    await this.notificationsService.sendNotification(
      enrollment.userId,
      "Напоминание об оплате",
      `Не забудьте оплатить курс ${courseTitle} до ${enrollment.paymentDueAt?.toLocaleDateString()}`,
      "PAYMENT_REMINDER",
    );

    return { success: true };
  }
}
