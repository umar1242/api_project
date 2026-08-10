import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { DatabaseModule } from "../../database/database.module";

/**
 * HealthModule — exposes GET /health.
 * Imports DatabaseModule to make PrismaService available for DB ping.
 * Redis is checked via raw TCP socket (no additional provider needed).
 */
@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
})
export class HealthModule {}
