import { Module } from "@nestjs/common";
import { VariantsController } from "./variants.controller";
import { VariantsService } from "./variants.service";
import { DatabaseModule } from "../../database/database.module";
import { AuditLogModule } from "../audit/audit.module";
import { GamificationModule } from "../gamification/gamification.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    DatabaseModule,
    AuditLogModule,
    GamificationModule,
    NotificationsModule,
  ],
  controllers: [VariantsController],
  providers: [VariantsService],
})
export class VariantsModule {}
