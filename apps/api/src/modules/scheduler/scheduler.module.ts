import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { LessonReminderProcessor } from './lesson-reminder.processor';
import { MaterialPublishProcessor } from './material-publish.processor';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'lesson-reminders',
    }),
    BullModule.registerQueue({
      name: 'material-publish',
    }),
  ],
  providers: [SchedulerService, LessonReminderProcessor, MaterialPublishProcessor],
  exports: [SchedulerService],
})
export class SchedulerModule {}
