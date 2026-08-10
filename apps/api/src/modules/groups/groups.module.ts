import { Module } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";
import { DatabaseModule } from "../../database/database.module";
import { AuditLogModule } from "../audit/audit.module";

@Module({
  imports: [DatabaseModule, AuditLogModule],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
