import { IsString, IsOptional, IsNumber, IsDateString } from "class-validator";

export class CreateAssignmentDto {
  @IsNumber()
  groupId: number;

  @IsOptional()
  @IsNumber()
  lessonId?: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @IsOptional()
  @IsDateString()
  deadlineAt?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
