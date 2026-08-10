import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Processor("material-publish")
export class MaterialPublishProcessor extends WorkerHost {
  private readonly logger = new Logger(MaterialPublishProcessor.name);

  constructor(
    private db: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { materialId } = job.data;
    this.logger.log(`Publishing material ${materialId}`);

    const material = await this.db.material.findUnique({
      where: { id: BigInt(materialId) },
    });

    if (!material) {
      this.logger.warn(`Material ${materialId} not found`);
      return;
    }

    // Update material status to PUBLISHED
    await this.db.material.update({
      where: { id: BigInt(materialId) },
      data: { status: "PUBLISHED" },
    });

    this.logger.log(
      `Material ${material.title} published for group ${material.groupId}`,
    );

    const enrollments = await this.db.enrollment.findMany({
      where: { groupId: material.groupId, status: "ACTIVE" },
    });

    for (const enrollment of enrollments) {
      await this.notificationsService.sendNotification(
        enrollment.userId,
        "New Material",
        `Material ${material.title} is now available!`,
        "MATERIAL_PUBLISHED",
      );
    }

    return { success: true };
  }
}
