import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { VariantsService } from './variants.service';
import { CreateVariantDto } from './dto/create-variant.dto';

@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post()
  create(@Body() createVariantDto: CreateVariantDto) {
    return this.variantsService.create(createVariantDto);
  }

  @Get()
  findAll() {
    return this.variantsService.findAll();
  }

  @Get('submissions/pending')
  getPendingSubmissions() {
    return this.variantsService.findPendingSubmissions();
  }

  @Get('submissions/:submissionId')
  getSubmission(@Param('submissionId') submissionId: string) {
    return this.variantsService.findSubmission(submissionId);
  }

  @Post('submissions/:submissionId/grade')
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() gradeSubmissionDto: import('./dto/grade-submission.dto').GradeSubmissionDto
  ) {
    return this.variantsService.gradeSubmission(submissionId, gradeSubmissionDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.variantsService.findOne(id);
  }

  @Post(':id/tasks')
  updateTasks(
    @Param('id') id: string,
    @Body() updateTasksDto: { tasks: { id: string, correctAnswer?: string, optionsCount?: number }[] }
  ) {
    return this.variantsService.updateTasks(id, updateTasksDto);
  }

  @Post(':id/submissions')
  submitAnswers(
    @Param('id') id: string,
    @Body() submitVariantDto: import('./dto/submit-variant.dto').SubmitVariantDto
  ) {
    return this.variantsService.submitAnswers(id, submitVariantDto);
  }
}
