import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CoinShopItem } from "@prisma/client";

@Injectable()
export class GamificationService {
  constructor(private readonly db: PrismaService) {}

  async getStudentStats(userId: string, courseId: string) {
    const enrollment = await this.db.enrollment.findFirst({
      where: {
        userId: BigInt(userId),
        group: { courseId: BigInt(courseId) },
      },
      include: { studentStats: true },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found for this course");
    }

    const stats = await this.db.studentStats.upsert({
      where: { enrollmentId: enrollment.id },
      create: { enrollmentId: enrollment.id },
      update: {},
    });

    return {
      ...stats,
      id: stats.id.toString(),
      enrollmentId: stats.enrollmentId.toString(),
    };
  }

  async addCoins(
    userId: string,
    courseId: string,
    amount: number,
    reason: string,
    checkIdempotency: boolean = false,
  ) {
    const enrollment = await this.db.enrollment.findFirst({
      where: {
        userId: BigInt(userId),
        group: { courseId: BigInt(courseId) },
      },
      include: { studentStats: true },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found for this course");
    }

    const stats = await this.db.studentStats.upsert({
      where: { enrollmentId: enrollment.id },
      create: { enrollmentId: enrollment.id },
      update: {},
    });

    if (checkIdempotency) {
      const existing = await this.db.coinTransaction.findFirst({
        where: { statsId: stats.id, reason },
      });
      if (existing) {
        return {
          ...stats,
          id: stats.id.toString(),
          enrollmentId: stats.enrollmentId.toString(),
        };
      }
    }

    const [updatedStats] = await this.db.$transaction([
      this.db.studentStats.update({
        where: { id: stats.id },
        data: {
          coins: { increment: amount },
        },
      }),
      this.db.coinTransaction.create({
        data: {
          statsId: stats.id,
          amount,
          type: amount >= 0 ? "EARNED" : "PENALTY",
          reason,
        },
      }),
    ]);

    return {
      ...updatedStats,
      id: updatedStats.id.toString(),
      enrollmentId: updatedStats.enrollmentId.toString(),
    };
  }

  async getActiveShopItems(courseId: string) {
    const items = await this.db.coinShopItem.findMany({
      where: { status: "ACTIVE" },
    });
    return items.map((item: CoinShopItem) => ({
      ...item,
      id: item.id.toString(),
    }));
  }

  async purchaseItem(userId: string, courseId: string, itemId: string) {
    const enrollment = await this.db.enrollment.findFirst({
      where: {
        userId: BigInt(userId),
        group: { courseId: BigInt(courseId) },
      },
      include: { studentStats: true },
    });

    if (!enrollment || !enrollment.studentStats) {
      throw new NotFoundException("Student stats not found (must be enrolled)");
    }

    const item = await this.db.coinShopItem.findUnique({
      where: { id: BigInt(itemId) },
    });

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    if (item.status !== "ACTIVE") {
      throw new BadRequestException("Item is not active");
    }

    if (item.stock !== null && item.stock <= 0) {
      throw new BadRequestException("Item is out of stock");
    }

    if (enrollment.studentStats.coins < item.cost) {
      throw new BadRequestException("Not enough coins");
    }

    const txs: any[] = [
      this.db.studentStats.update({
        where: { id: enrollment.studentStats.id },
        data: { coins: { decrement: item.cost } },
      }),
      this.db.coinTransaction.create({
        data: {
          statsId: enrollment.studentStats.id,
          amount: -item.cost,
          type: "SPENT",
          reason: `Purchased item: ${item.title}`,
        },
      }),
      this.db.coinShopPurchase.create({
        data: {
          itemId: item.id,
          enrollmentId: enrollment.id,
          cost: item.cost,
          status: "PENDING",
        },
      }),
    ];

    if (item.stock !== null) {
      txs.push(
        this.db.coinShopItem.update({
          where: { id: item.id },
          data: { stock: { decrement: 1 } },
        }),
      );
    }

    const results = await this.db.$transaction(txs);
    const purchase = results[2];

    return {
      ...purchase,
      id: purchase.id.toString(),
      itemId: purchase.itemId.toString(),
      enrollmentId: purchase.enrollmentId.toString(),
    };
  }
}
