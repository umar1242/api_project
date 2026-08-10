import { IsString, IsObject, IsNotEmpty, IsOptional } from "class-validator";

export class SubmitVariantDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  // Record mapping taskId (stringified BigInt) to the user's answer (string)
  @IsObject()
  answers: Record<string, string>;

  // Record mapping taskId to a fileUrl (for photo uploads)
  @IsObject()
  @IsOptional()
  fileUrls?: Record<string, string>;
}
