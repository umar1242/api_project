import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MaterialStatus } from "@prisma/client";
import { LessonResponseDto } from "../../lessons/dto/lesson-response.dto";

export class MaterialResponseDto {
  @ApiProperty({ description: "Material ID" })
  id: string;

  @ApiProperty({ description: "Group ID" })
  groupId: string;

  @ApiPropertyOptional({ description: "Lesson ID if attached to a lesson" })
  lessonId?: string | null;

  @ApiProperty({ description: "Material title" })
  title: string;

  @ApiPropertyOptional({ description: "Material description" })
  description?: string | null;

  @ApiPropertyOptional({ description: "File URL" })
  fileUrl?: string | null;

  @ApiPropertyOptional({ description: "Telegram file ID" })
  telegramFileId?: string | null;

  @ApiProperty({ enum: MaterialStatus })
  status: MaterialStatus;

  @ApiPropertyOptional({ description: "When to auto-publish (if PENDING)" })
  publishAt?: Date | null;

  @ApiProperty({ description: "Creation date" })
  createdAt: Date;

  @ApiProperty({ description: "Last update date" })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => LessonResponseDto })
  lesson?: LessonResponseDto | null;
}
