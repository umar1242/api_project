import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
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

@ApiTags("Enrollments")
@Controller("enrollments")
export class EnrollmentsController {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly auditService: AuditService,
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

