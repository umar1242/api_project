import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * PrismaService wraps the Prisma client and integrates it with
 * the NestJS lifecycle — connecting on module init and disconnecting on destroy.
 *
 * Exported by DatabaseModule so all other modules can inject it.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "warn", "error"]
          : ["warn", "error"],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log("Database connected");
    } catch (err) {
      this.logger.error("Failed to connect to database", err);
      throw err; // Prevent app from booting with a broken DB connection
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }
}
