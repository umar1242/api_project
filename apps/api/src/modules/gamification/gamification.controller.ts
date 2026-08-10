import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Gamification')
@ApiSecurity('service-token')
@UseGuards(ServiceTokenGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('stats/:courseId')
  async getStats(@Param('courseId') courseId: string, @Query('userId') userId: string) {
    return this.gamificationService.getStudentStats(userId, courseId);
  }

  @Get('shop/:courseId')
  async getShopItems(@Param('courseId') courseId: string) {
    return this.gamificationService.getActiveShopItems(courseId);
  }

  @Post('shop/:courseId/purchase/:itemId')
  async purchaseItem(
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Query('userId') userId: string,
  ) {
    return this.gamificationService.purchaseItem(userId, courseId, itemId);
  }
}
