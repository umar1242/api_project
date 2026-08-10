import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType, LessonStatus } from '../../../common/enums/lesson.enums';

export class LessonResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() groupId: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty({ enum: LessonType }) type: LessonType;
  @ApiProperty({ enum: LessonStatus }) status: LessonStatus;
  @ApiProperty() startsAt: Date;
  @ApiProperty() durationMin: number;
  @ApiPropertyOptional() meetingUrl?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
