import { IsObject, IsNumber, IsOptional, IsString } from "class-validator";

export class GradeSubmissionDto {
  // mapping taskId to score
  @IsObject()
  scores: Record<string, number>;

  // optional feedback mapping taskId to string
  @IsObject()
  @IsOptional()
  feedback?: Record<string, string>;

  // overall general feedback for the submission
  @IsString()
  @IsOptional()
  generalFeedback?: string;
}
