import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { CourseType } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCourseDto {
  @ApiProperty({ description: "The title of the course", maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: "The type of the course",
    enum: CourseType,
    default: CourseType.FREE,
    required: false,
  })
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;

  @ApiProperty({
    description: "A free-text description of the course",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "The course plan (topics, schedule)",
    required: false,
  })
  @IsOptional()
  @IsString()
  plan?: string;
}
