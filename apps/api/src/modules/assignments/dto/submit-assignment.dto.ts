import { IsString, IsOptional, IsNumber } from "class-validator";

export class SubmitAssignmentDto {
  @IsNumber()
  enrollmentId: number;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
