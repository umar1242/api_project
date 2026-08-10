import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Processor("lesson-reminders")
export class LessonReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(LessonReminderProcessor.name);

  constructor(
    private db: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { lessonId } = job.data;
    this.logger.log(`Processing reminder for lesson ${lessonId}`);

    const lesson = await this.db.lesson.findUnique({
      where: { id: BigInt(lessonId) },
      include: { group: true },
    });

    if (!lesson) {
      this.logger.warn(`Lesson ${lessonId} not found`);
      return;
    }

    // Here we use the unified NotificationsService
    this.logger.log(
      `Sending reminder to group ${lesson.groupId} for lesson ${lesson.title}`,
    );

    const enrollments = await this.db.enrollment.findMany({
      where: { groupId: lesson.groupId, status: "ACTIVE" },
    });

    for (const enrollment of enrollments) {
      await this.notificationsService.sendNotification(
        enrollment.userId,
        "Upcoming Lesson",
        `Lesson ${lesson.title} starts soon!`,
        "LESSON_REMINDER",
      );
    }

    return { success: true };
  }
}
