import { ApiProperty } from "@nestjs/swagger";
import { CourseType } from "@prisma/client";

export class CourseResponseDto {
  @ApiProperty({ description: "The unique course ID", type: String })
  id: string; // BigInt serialized as string

  @ApiProperty({ description: "The title of the course" })
  title: string;

  @ApiProperty({ description: "The type of the course", enum: CourseType })
  type: CourseType;

  @ApiProperty({
    description: "A free-text description of the course",
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: "The course plan (topics, schedule)",
    required: false,
  })
  plan?: string;

  @ApiProperty({ description: "The referral link slug for this course" })
  refLink: string;

  @ApiProperty({
    description: "The 5-character unique access code",
    required: false,
  })
  accessCode?: string;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;

  constructor(partial: Partial<CourseResponseDto>) {
    Object.assign(this, partial);
  }
}
