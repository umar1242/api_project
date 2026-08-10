import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsObject,
} from "class-validator";

export class CreateEnrollmentDto {
  @ApiProperty({
    description: "The refLink of the course the user wants to enroll in",
  })
  @IsNotEmpty()
  @IsString()
  refLink: string;

  @ApiProperty({ description: "Full name as entered in the questionnaire" })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ description: "Primary contact phone number", required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: "Flexible additional metadata from questionnaire",
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  // Note: Telegram initData is expected to be passed in headers or body to auth guard
}
