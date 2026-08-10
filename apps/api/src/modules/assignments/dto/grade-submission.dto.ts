import { IsNumber, IsString, IsOptional } from 'class-validator';

export class GradeSubmissionDto {
  @IsNumber()
  grade: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
