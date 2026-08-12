import { IsString, IsObject, IsNotEmpty, IsOptional } from "class-validator";

export class SubmitVariantDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  // Record mapping taskId (stringified BigInt) to the user's answer (string)
  @IsObject()
  answers: Record<string, string>;

  // Record mapping taskId to an array of file URLs (1-4 photos, only for tasks with requiresAttachment)
  @IsObject()
  @IsOptional()
  fileUrls?: Record<string, string[]>;
}
