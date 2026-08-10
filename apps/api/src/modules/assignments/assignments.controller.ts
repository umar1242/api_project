import { Controller, Post, Get, Body, Param, ParseIntPipe, Patch, Put, UseGuards, Req } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @UseGuards(ServiceTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Post()
  async create(@Body() createAssignmentDto: CreateAssignmentDto) {
    const assignment = await this.assignmentsService.create(createAssignmentDto);
    return {
      ...assignment,
      id: assignment.id.toString(),
      groupId: assignment.groupId.toString(),
      lessonId: assignment.lessonId ? assignment.lessonId.toString() : undefined,
    };
  }

  @Get('group/:groupId')
  async findAllByGroup(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.assignmentsService.findAllByGroup(groupId);
  }

  @Post(':id/submit')
  async submit(
    @Param('id', ParseIntPipe) assignmentId: number,
    @Body() submitAssignmentDto: SubmitAssignmentDto,
  ) {
    const submission = await this.assignmentsService.submit(assignmentId, submitAssignmentDto);
    return {
      ...submission,
      id: submission.id.toString(),
      assignmentId: submission.assignmentId.toString(),
      enrollmentId: submission.enrollmentId.toString(),
    };
  }

  @UseGuards(ServiceTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Get(':id/submissions')
  async getSubmissions(@Param('id', ParseIntPipe) assignmentId: number) {
    return this.assignmentsService.getSubmissions(assignmentId);
  }

  @UseGuards(ServiceTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Put(':id/submissions/:submissionId/grade')
  async gradeSubmission(
    @Param('id', ParseIntPipe) assignmentId: number,
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() gradeSubmissionDto: GradeSubmissionDto,
  ) {
    const submission = await this.assignmentsService.gradeSubmission(submissionId, gradeSubmissionDto);
    return {
      ...submission,
      id: submission.id.toString(),
      assignmentId: submission.assignmentId.toString(),
      enrollmentId: submission.enrollmentId.toString(),
    };
  }
}
