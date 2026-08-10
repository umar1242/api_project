import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { VariantsService } from "./variants.service";
import { CreateVariantDto } from "./dto/create-variant.dto";
import { VariantResponseDto } from "./dto/variant-response.dto";
import { VariantSubmissionResponseDto } from "./dto/variant-submission-response.dto";
import { AuditService } from "../audit/audit.service";
import { Req } from "@nestjs/common";

@ApiTags("Variants")
@Controller("variants")
export class VariantsController {
  constructor(
    private readonly variantsService: VariantsService,
    private readonly auditService: AuditService,
  ) {}

  @ApiOperation({ summary: "Create a new variant" })
  @ApiResponse({ status: 201, type: VariantResponseDto })
  @Post()
  create(
    @Body() createVariantDto: CreateVariantDto,
  ): Promise<VariantResponseDto> {
    return this.variantsService.create(createVariantDto);
  }

  @ApiOperation({ summary: "Get all variants" })
  @ApiResponse({ status: 200, type: [VariantResponseDto] })
  @Get()
  findAll(): Promise<VariantResponseDto[]> {
    return this.variantsService.findAll();
  }

  @ApiOperation({ summary: "Get pending submissions requiring admin review" })
  @ApiResponse({ status: 200, type: [VariantSubmissionResponseDto] })
  @Get("submissions/pending")
  getPendingSubmissions(): Promise<VariantSubmissionResponseDto[]> {
    return this.variantsService.findPendingSubmissions();
  }

  @ApiOperation({ summary: "Get a specific submission" })
  @ApiResponse({ status: 200, type: VariantSubmissionResponseDto })
  @Get("submissions/:submissionId")
  getSubmission(
    @Param("submissionId") submissionId: string,
  ): Promise<VariantSubmissionResponseDto> {
    return this.variantsService.findSubmission(submissionId);
  }

  @ApiOperation({ summary: "Grade a submission" })
  @ApiResponse({ status: 200, type: VariantSubmissionResponseDto })
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

  @ApiOperation({ summary: "Get a variant by ID" })
  @ApiResponse({ status: 200, type: VariantResponseDto })
  @Get(":id")
  findOne(@Param("id") id: string): Promise<VariantResponseDto> {
    return this.variantsService.findOne(id);
  }

  @ApiOperation({ summary: "Update tasks for a variant" })
  @ApiResponse({ status: 200 })
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
    @Param("id") id: string,
    @Body()
    submitVariantDto: import("./dto/submit-variant.dto").SubmitVariantDto,
  ): Promise<VariantSubmissionResponseDto> {
    return this.variantsService.submitAnswers(id, submitVariantDto);
  }
}
