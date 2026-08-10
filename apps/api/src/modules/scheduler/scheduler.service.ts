import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../../database/prisma.service";
import { Assignment } from "@prisma/client";
import { GamificationService } from "../gamification/gamification.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue("lesson-reminders") private lessonQueue: Queue,
    @InjectQueue("material-publish") private materialQueue: Queue,
    @InjectQueue("payment-reminders") private paymentQueue: Queue,
    private db: PrismaService,
    private gamificationService: GamificationService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingLessons() {
    this.logger.debug("Checking for upcoming lessons...");

    // Find lessons starting in the next 15 minutes that haven't been notified yet
    // In a real app we'd track if notification was sent.
    // Here we just find lessons starting exactly 15 minutes from now.
    const targetTimeMin = new Date();
    targetTimeMin.setMinutes(targetTimeMin.getMinutes() + 14);

    const targetTimeMax = new Date();
    targetTimeMax.setMinutes(targetTimeMax.getMinutes() + 15);

    const lessons = await this.db.lesson.findMany({
      where: {
        startsAt: {
          gt: targetTimeMin,
          lte: targetTimeMax,
        },
        status: "SCHEDULED",
      },
    });

    for (const lesson of lessons) {
      await this.lessonQueue.add("send-reminder", {
        lessonId: lesson.id.toString(),
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPendingMaterials() {
    this.logger.debug("Checking for materials to publish...");

    const materials = await this.db.material.findMany({
      where: {
        status: "PENDING",
        publishAt: {
          lte: new Date(),
        },
      },
    });

    for (const material of materials) {
      await this.materialQueue.add("publish-material", {
        materialId: material.id.toString(),
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPaymentDeadlines() {
    this.logger.debug("Checking for upcoming payment deadlines...");

    // Warn students 24 hours before their payment is due
    const targetTimeMin = new Date();
    targetTimeMin.setHours(targetTimeMin.getHours() + 23);
    targetTimeMin.setMinutes(targetTimeMin.getMinutes() + 59);

    const targetTimeMax = new Date();
    targetTimeMax.setHours(targetTimeMax.getHours() + 24);

    const upcomingPayments = await this.db.enrollment.findMany({
      where: {
        paymentPaidAt: null,
        paymentDueAt: {
          gt: targetTimeMin,
          lte: targetTimeMax,
        },
        status: "ACTIVE",
      },
    });

    for (const enrollment of upcomingPayments) {
      await this.paymentQueue.add("send-payment-reminder", {
        enrollmentId: enrollment.id.toString(),
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAssignmentDeadlines() {
    this.logger.debug("Checking for assignment deadlines...");

    // Find all assignments that are PUBLISHED and their deadline has passed
    const passedAssignments = await this.db.assignment.findMany({
      where: {
        status: "PUBLISHED",
        deadlineAt: {
          lte: new Date(),
        },
      },
      include: {
        group: true,
      },
    });

    if (passedAssignments.length > 0) {
      await this.db.assignment.updateMany({
        where: {
          id: {
            in: passedAssignments.map((a: Assignment) => a.id),
          },
        },
        data: {
          status: "CLOSED",
        },
      });
      this.logger.log(
        `Closed ${passedAssignments.length} assignments due to deadline`,
      );

      // Apply Gamification latePenalty
      for (const assignment of passedAssignments) {
        if (!assignment.group?.courseId) continue;

        const config = await this.db.gamificationConfig.findUnique({
          where: { courseId: assignment.group.courseId },
        });

        if (config && config.latePenalty > 0) {
          const missingEnrollments = await this.db.enrollment.findMany({
            where: {
              groupId: assignment.groupId,
              status: "ACTIVE",
              assignmentSubmissions: {
                none: { assignmentId: assignment.id },
              },
            },
          });

          for (const enr of missingEnrollments) {
            await this.gamificationService
              .addCoins(
                enr.userId.toString(),
                assignment.group.courseId.toString(),
                -config.latePenalty,
                `Late penalty for missed assignment ${assignment.id}`,
                true,
              )
              .catch((err) =>
                this.logger.error(
                  `Failed to apply late penalty for user ${enr.userId}`,
                  err,
                ),
              );

            await this.notificationsService
              .sendNotification(
                enr.userId,
                "Просроченное задание",
                `Вы просрочили сдачу домашнего задания "${assignment.title}"`,
                "ASSIGNMENT_MISSED",
              )
              .catch((err) =>
                this.logger.error(
                  `Failed to send notification to user ${enr.userId}`,
                  err,
                ),
              );
          }
        }
      }
    }
  }
}
