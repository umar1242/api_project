import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";
import { EnrollmentsService } from "./enrollments.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { EnrollmentResponseDto } from "./dto/enrollment-response.dto";
import {
  TelegramAuthGuard,
  TelegramUser,
} from "../../common/guards/telegram-auth.guard";
import { ServiceTokenGuard } from "../../common/guards/service-token.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Request } from "express";
import { EnrollmentStatus, UserRole } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma.service";

@ApiTags("Enrollments")
@Controller("enrollments")
export class EnrollmentsController {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({
    summary: "Submit registration questionnaire and enroll in course",
  })
  @ApiResponse({
    status: 201,
    description: "Successfully enrolled",
    type: EnrollmentResponseDto,
  })
  @ApiHeader({ name: "tg-init-data", description: "Telegram Web App initData" })
  @UseGuards(TelegramAuthGuard)
  @Post()
  async enroll(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @Req() request: Request & { telegramUser?: TelegramUser },
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.enroll(
      createEnrollmentDto,
      request.telegramUser!,
    );
  }

  @ApiOperation({
    summary: "Get or regenerate group invite link for enrollment",
  })
  @ApiResponse({
    status: 200,
    description: "Invite link successfully generated",
  })
  @ApiHeader({ name: "tg-init-data", description: "Telegram Web App initData" })
  @UseGuards(TelegramAuthGuard)
  @Get(":id/invite-link")
  async getInviteLink(
    @Param("id") id: string,
    @Req() request: Request & { telegramUser?: TelegramUser },
  ): Promise<{ inviteLink: string }> {
    return this.enrollmentsService.getInviteLink(id, request.telegramUser!);
  }

  @ApiOperation({ summary: "Update enrollment status" })
  @ApiResponse({ status: 200, type: EnrollmentResponseDto })
  @ApiHeader({
    name: "x-service-token",
    description: "Service authentication token",
  })
  @UseGuards(ServiceTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(":id/status")
  async updateStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body("status") status: EnrollmentStatus,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.enrollmentsService.updateStatus(id, status);
    const userId = req.telegramUser?.id || req.adminTelegramId;
    if (userId) {
      this.auditService.logAction(
        BigInt(userId),
        "UPDATE_ENROLLMENT_STATUS",
        BigInt(id),
        "Enrollment",
        { status },
      );
    }
    return enrollment;
  }

  @ApiOperation({
    summary: "Get enrollments (filtered by userId or telegramId)",
  })
  @ApiResponse({ status: 200 })
  @ApiHeader({
    name: "x-service-token",
    description: "Service authentication token",
    required: false,
  })
  @ApiHeader({
    name: "tg-init-data",
    description: "Telegram Web App initData",
    required: false,
  })
  @UseGuards(ServiceTokenGuard)
  @Get()
  async findAll(
    @Req() req: any,
    @Query("userId") userId?: string,
    @Query("telegramId") telegramId?: string,
  ): Promise<{ data: EnrollmentResponseDto[]; total: number }> {
    const isService = !!req.headers["x-service-token"];
    const isAdmin = !!req.adminTelegramId;

    if (!isService && !isAdmin && req.telegramUser?.id) {
      const dbUser = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(req.telegramUser.id) },
      });

      const isPrivileged =
        dbUser && (dbUser.role === UserRole.ADMIN || dbUser.role === UserRole.CURATOR);

      if (!isPrivileged) {
        // If student passed userId, verify it belongs to their own DB record
        if (userId && dbUser && dbUser.id.toString() !== userId) {
          throw new ForbiddenException("You cannot view other users' enrollments");
        }
        // Force filter to only this student's telegramId/userId
        telegramId = req.telegramUser.id.toString();
        if (dbUser) {
          userId = dbUser.id.toString();
        }
      }
    }

    return this.enrollmentsService.findAll({ userId, telegramId });
  }

  @ApiOperation({ summary: "Confirm enrollment payment" })
  @ApiResponse({ status: 200, type: EnrollmentResponseDto })
  @ApiHeader({
    name: "x-service-token",
    description: "Service authentication token",
  })
  @UseGuards(ServiceTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(":id/payment")
  async confirmPayment(
    @Req() req: any,
    @Param("id") id: string,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.enrollmentsService.confirmPayment(id);
    const userId = req.telegramUser?.id || req.adminTelegramId;
    if (userId) {
      this.auditService.logAction(
        BigInt(userId),
        "CONFIRM_PAYMENT",
        BigInt(id),
        "Enrollment",
        null,
      );
    }
    return enrollment;
  }
}

