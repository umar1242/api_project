import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { GroupsModule } from './modules/groups/groups.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { FilesModule } from './modules/files/files.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AuditLogModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { VariantsModule } from './modules/variants/variants.module';
@Module({
  imports: [
    // ── Config (global, validates env on startup) ──────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      cache: true,
    }),

    // ── Database ───────────────────────────────────────────────────────────
    DatabaseModule,

    // ── Domain modules ─────────────────────────────────────────────────────
    HealthModule,
    UsersModule,
    CoursesModule,
    GroupsModule,
    EnrollmentsModule,
    LessonsModule,
    MaterialsModule,
    SchedulerModule,
    AssignmentsModule,
    FilesModule,
    // Stage 1+: AuthModule
    GamificationModule,
    AuditLogModule,
    NotificationsModule,
    VariantsModule,
    // Stage 8+: NotificationsModule, AuditModule
  ],
})
export class AppModule {}
