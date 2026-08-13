import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { VariantType, TaskType } from "@prisma/client";

export class CreateVariantSubQuestionDto {
  @IsNumber()
  orderIndex: number;

  @IsString()
  @IsOptional()
  correctAnswer?: string;
}

export class CreateVariantTaskDto {
  @IsEnum(TaskType)
  type: TaskType;

  @IsNumber()
  orderIndex: number;

  @IsBoolean()
  @IsOptional()
  requiresAdmin?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresAttachment?: boolean;

  @IsNumber()
  @IsOptional()
  optionsCount?: number;

  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  maxAttachments?: number;

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantSubQuestionDto)
  @IsOptional()
  subQuestions?: CreateVariantSubQuestionDto[];
}

export class CreateVariantDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(VariantType)
  @IsOptional()
  type?: VariantType;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  deadlineAt?: string;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  groupId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantTaskDto)
  @IsOptional()
  tasks?: CreateVariantTaskDto[];
}
