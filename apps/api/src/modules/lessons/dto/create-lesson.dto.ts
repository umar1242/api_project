import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  IsOptional,
  IsUrl,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { LessonType } from "../../../common/enums/lesson.enums";

export class CreateLessonDto {
  @ApiProperty({ example: "1" })
  @IsString()
  groupId: string;

  @ApiProperty({ example: "Introduction to TypeScript" })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: LessonType, default: LessonType.ONLINE })
  @IsEnum(LessonType)
  type: LessonType;

  @ApiProperty({ example: "2025-01-15T10:00:00Z" })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional({ example: 90, minimum: 15, maximum: 480 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  durationMin?: number;

  @ApiPropertyOptional({ example: "https://zoom.us/j/example" })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  meetingUrl?: string;
}
