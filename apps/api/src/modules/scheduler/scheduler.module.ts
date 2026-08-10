import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ScheduleModule } from "@nestjs/schedule";
import { SchedulerService } from "./scheduler.service";
import { LessonReminderProcessor } from "./lesson-reminder.processor";
import { MaterialPublishProcessor } from "./material-publish.processor";
import { PaymentReminderProcessor } from "./payment-reminder.processor";
import { DatabaseModule } from "../../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { GamificationModule } from "../gamification/gamification.module";

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    GamificationModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
      },
    }),
    BullModule.registerQueue({
      name: "lesson-reminders",
    }),
    BullModule.registerQueue({
      name: "material-publish",
    }),
    BullModule.registerQueue({
      name: "payment-reminders",
    }),
  ],
  providers: [
    SchedulerService,
    LessonReminderProcessor,
    MaterialPublishProcessor,
    PaymentReminderProcessor,
  ],
  exports: [SchedulerService],
})
export class SchedulerModule {}
