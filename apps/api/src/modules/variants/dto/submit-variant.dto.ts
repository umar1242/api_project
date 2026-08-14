import { IsString, IsObject, IsNotEmpty, IsOptional } from "class-validator";

export class SubmitVariantDto {
  @IsString()
  @IsOptional()
  userId?: string;

  // Record mapping taskId (stringified BigInt) to the user's answer (string)
  @IsObject()
  answers: Record<string, string>;

  // Record mapping taskId to an array of fileUrls (for photo uploads, 1-4 photos)
  @IsObject()
  @IsOptional()
  fileUrls?: Record<string, string[]>;

  // Record mapping taskId to { subQuestionId: answer } for WRITTEN_WORK tasks with sub-questions
  @IsObject()
  @IsOptional()
  subAnswers?: Record<string, Record<string, string>>;
}
