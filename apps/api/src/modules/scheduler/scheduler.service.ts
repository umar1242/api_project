import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue('lesson-reminders') private lessonQueue: Queue,
    @InjectQueue('material-publish') private materialQueue: Queue,
    private db: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingLessons() {
    this.logger.debug('Checking for upcoming lessons...');
    
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
        status: 'SCHEDULED',
      },
    });

    for (const lesson of lessons) {
      await this.lessonQueue.add('send-reminder', {
        lessonId: lesson.id.toString(),
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPendingMaterials() {
    this.logger.debug('Checking for materials to publish...');
    
    const materials = await this.db.material.findMany({
      where: {
        status: 'PENDING',
        publishAt: {
          lte: new Date(),
        },
      },
    });

    for (const material of materials) {
      await this.materialQueue.add('publish-material', {
        materialId: material.id.toString(),
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAssignmentDeadlines() {
    this.logger.debug('Checking for assignment deadlines...');
    
    // Find all assignments that are PUBLISHED and their deadline has passed
    const passedAssignments = await this.db.assignment.findMany({
      where: {
        status: 'PUBLISHED',
        deadlineAt: {
          lte: new Date(),
        },
      },
    });

    if (passedAssignments.length > 0) {
      await this.db.assignment.updateMany({
        where: {
          id: {
            in: passedAssignments.map(a => a.id),
          },
        },
        data: {
          status: 'CLOSED',
        },
      });
      this.logger.log(`Closed ${passedAssignments.length} assignments due to deadline`);
    }
  }
}
