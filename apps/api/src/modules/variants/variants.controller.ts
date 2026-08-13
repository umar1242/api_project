import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiSecurity } from "@nestjs/swagger";
import { VariantsService } from "./variants.service";
import { CreateVariantDto } from "./dto/create-variant.dto";
import { VariantResponseDto, VariantPublicResponseDto } from "./dto/variant-response.dto";
import { VariantSubmissionResponseDto } from "./dto/variant-submission-response.dto";
import { AuditService } from "../audit/audit.service";
import { ServiceTokenGuard } from "../../common/guards/service-token.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("Variants")
@ApiSecurity("service-token")
@UseGuards(ServiceTokenGuard, RolesGuard)
@Controller("variants")
export class VariantsController {
  constructor(
    private readonly variantsService: VariantsService,
    private readonly auditService: AuditService,
  ) {}

  @ApiOperation({ summary: "Create a new variant" })
  @ApiResponse({ status: 201, type: VariantResponseDto })
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Post()
  create(
    @Body() createVariantDto: CreateVariantDto,
  ): Promise<VariantResponseDto> {
    return this.variantsService.create(createVariantDto);
  }

  @ApiOperation({ summary: "Get all variants" })
  @ApiResponse({ status: 200, type: [VariantResponseDto] })
  @Get()
  findAll(@Req() req: any): Promise<VariantResponseDto[]> {
    return this.variantsService.findAll(req.telegramUser?.id ? BigInt(req.telegramUser.id) : undefined);
  }

  @ApiOperation({ summary: "Get pending submissions requiring admin review" })
  @ApiResponse({ status: 200, type: [VariantSubmissionResponseDto] })
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Get("submissions/pending")
  getPendingSubmissions(): Promise<VariantSubmissionResponseDto[]> {
    return this.variantsService.findPendingSubmissions();
  }

  @ApiOperation({ summary: "Get a specific submission" })
  @ApiResponse({ status: 200, type: VariantSubmissionResponseDto })
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Get("submissions/:submissionId")
  getSubmission(
    @Param("submissionId") submissionId: string,
  ): Promise<VariantSubmissionResponseDto> {
    return this.variantsService.findSubmission(submissionId);
  }

  @ApiOperation({ summary: "Grade a submission" })
  @ApiResponse({ status: 200, type: VariantSubmissionResponseDto })
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Post("submissions/:submissionId/grade")
  async gradeSubmission(
    @Req() req: any,
    @Param("submissionId") submissionId: string,
    @Body()
    gradeSubmissionDto: import("./dto/grade-submission.dto").GradeSubmissionDto,
  ): Promise<VariantSubmissionResponseDto> {
    const result = await this.variantsService.gradeSubmission(
      submissionId,
      gradeSubmissionDto,
    );
    const userId = req.telegramUser?.id || req.adminTelegramId;
    if (userId) {
      this.auditService.logAction(
        BigInt(userId),
        "GRADE_SUBMISSION",
        BigInt(submissionId),
        "VariantSubmission",
        gradeSubmissionDto,
      );
    }
    return result;
  }

  @ApiOperation({ summary: "Get a variant by access code" })
  @ApiResponse({ status: 200, type: VariantResponseDto })
  @Get("by-code/:code")
  findByCode(@Param("code") code: string, @Req() req: any): Promise<VariantResponseDto> {
    return this.variantsService.findByCode(code, req.telegramUser?.id ? BigInt(req.telegramUser.id) : undefined);
  }

  @ApiOperation({ summary: "Get a variant by ID" })
  @ApiResponse({ status: 200, type: VariantResponseDto })
  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: any): Promise<VariantResponseDto> {
    return this.variantsService.findOne(id, req.telegramUser?.id ? BigInt(req.telegramUser.id) : undefined);
  }

  @ApiOperation({ summary: "Update tasks for a variant" })
  @ApiResponse({ status: 200 })
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Post(":id/tasks")
  updateTasks(
    @Param("id") id: string,
    @Body()
    updateTasksDto: {
      tasks: { id: string; correctAnswer?: string; optionsCount?: number }[];
    },
  ) {
    return this.variantsService.updateTasks(id, updateTasksDto);
  }

  @ApiOperation({ summary: "Submit answers for a variant" })
  @ApiResponse({ status: 201, type: VariantSubmissionResponseDto })
  @Post(":id/submissions")
  submitAnswers(
    @Req() req: any,
    @Param("id") id: string,
    @Body()
    submitVariantDto: import("./dto/submit-variant.dto").SubmitVariantDto,
  ): Promise<VariantSubmissionResponseDto> {
    return this.variantsService.submitAnswers(
      id,
      submitVariantDto,
      req.telegramUser?.id ? BigInt(req.telegramUser.id) : undefined,
    );
  }
}
