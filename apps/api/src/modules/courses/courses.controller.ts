import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { TelegramUser } from '../../common/guards/telegram-auth.guard';
import { Req } from '@nestjs/common';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly auditService: AuditService,
  ) {}

  @ApiOperation({ summary: 'Create a new course and generate a refLink' })
  @ApiResponse({
    status: 201,
    description: 'Course successfully created',
    type: CourseResponseDto,
  })
  @ApiHeader({ name: 'x-service-token', description: 'Service authentication token' })
  @UseGuards(ServiceTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Req() req: any, @Body() createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    const course = await this.coursesService.create(createCourseDto);
    if (req.telegramUser?.id) {
      this.auditService.logAction(BigInt(req.telegramUser.id), 'CREATE_COURSE', BigInt(course.id), 'Course', createCourseDto);
    }
    return course;
  }

  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({
    status: 200,
    description: 'List of courses',
    type: [CourseResponseDto],
  })
  @Get()
  async findAll(): Promise<CourseResponseDto[]> {
    return this.coursesService.findAll();
  }

  @ApiOperation({ summary: 'Get course by referral link slug' })
  @ApiResponse({
    status: 200,
    description: 'Course details',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Get(':refLink')
  async findByRefLink(@Param('refLink') refLink: string): Promise<CourseResponseDto> {
    return this.coursesService.findByRefLink(refLink);
  }
}
