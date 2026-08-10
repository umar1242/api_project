import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { GamificationService } from "./gamification.service";
import { ServiceTokenGuard } from "../../common/guards/service-token.guard";
import { ApiTags, ApiSecurity } from "@nestjs/swagger";
import { AuditService } from "../audit/audit.service";

@ApiTags("Gamification")
@ApiSecurity("service-token")
@UseGuards(ServiceTokenGuard)
@Controller("gamification")
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly auditService: AuditService,
  ) {}

  @Get("stats/:courseId")
  async getStats(
    @Param("courseId") courseId: string,
    @Query("userId") userId: string,
  ) {
    return this.gamificationService.getStudentStats(userId, courseId);
  }

  @Get("shop/:courseId")
  async getShopItems(@Param("courseId") courseId: string) {
    return this.gamificationService.getActiveShopItems(courseId);
  }

  @Post("shop/:courseId/purchase/:itemId")
  async purchaseItem(
    @Param("courseId") courseId: string,
    @Param("itemId") itemId: string,
    @Query("userId") userId: string,
  ) {
    return this.gamificationService.purchaseItem(userId, courseId, itemId);
  }

  @Post("manual-adjust")
  async manualAdjust(
    @Req() req: any,
    @Body("userId") userId: string,
    @Body("courseId") courseId: string,
    @Body("amount") amount: number,
    @Body("reason") reason: string,
  ) {
    const result = await this.gamificationService.addCoins(
      userId,
      courseId,
      amount,
      reason,
    );
    const adminId = req.telegramUser?.id || req.adminTelegramId;
    if (adminId) {
      this.auditService.logAction(
        BigInt(adminId),
        "MANUAL_COIN_ADJUSTMENT",
        BigInt(userId),
        "StudentStats",
        { courseId, amount, reason },
      );
    }
    return result;
  }
}
