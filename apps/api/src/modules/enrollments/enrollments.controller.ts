import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { TelegramAuthGuard, TelegramUser } from '../../common/guards/telegram-auth.guard';
import { Request } from 'express';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ summary: 'Submit registration questionnaire and enroll in course' })
  @ApiResponse({
    status: 201,
    description: 'Successfully enrolled',
    type: EnrollmentResponseDto,
  })
  @ApiHeader({ name: 'tg-init-data', description: 'Telegram Web App initData' })
  @UseGuards(TelegramAuthGuard)
  @Post()
  async enroll(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @Req() request: Request & { telegramUser?: TelegramUser },
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.enroll(createEnrollmentDto, request.telegramUser!);
  }
}
