import { Module } from "@nestjs/common";
import { MaterialsService } from "./materials.service";
import { MaterialsController } from "./materials.controller";
import { DatabaseModule } from "../../database/database.module";
import { AuditLogModule } from "../audit/audit.module";

@Module({
  imports: [DatabaseModule, AuditLogModule],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
