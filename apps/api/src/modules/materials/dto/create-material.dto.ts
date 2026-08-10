import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsNumber,
} from "class-validator";
import { MaterialStatus } from "@prisma/client";

export class CreateMaterialDto {
  @ApiProperty({ description: "ID of the group this material belongs to" })
  @IsNumber()
  @IsNotEmpty()
  groupId: number;

  @ApiProperty({ description: "Title of the material" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: "Optional lesson ID if tied to a specific lesson",
  })
  @IsOptional()
  @IsNumber()
  lessonId?: number;

  @ApiPropertyOptional({ description: "Description of the material" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "URL of the file (S3, etc.)" })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: "Telegram file ID for native bot delivery",
  })
  @IsOptional()
  @IsString()
  telegramFileId?: string;

  @ApiPropertyOptional({
    enum: MaterialStatus,
    default: MaterialStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @ApiPropertyOptional({
    description: "ISO date string when the material should be published",
  })
  @IsOptional()
  @IsDateString()
  publishAt?: string;
}
