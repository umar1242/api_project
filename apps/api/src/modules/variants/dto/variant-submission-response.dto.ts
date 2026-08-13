import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { VariantResponseDto } from "./variant-response.dto";

export class VariantTaskAnswerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  submissionId: string;

  @ApiProperty()
  taskId: string;

  @ApiPropertyOptional()
  answer?: string;

  @ApiPropertyOptional({ type: [String] })
  fileUrls?: string[];

  @ApiPropertyOptional()
  subAnswers?: Record<string, string>;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional()
  feedback?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class VariantSubmissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  totalScore?: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => [VariantTaskAnswerResponseDto] })
  answers?: VariantTaskAnswerResponseDto[];

  @ApiPropertyOptional({ type: () => VariantResponseDto })
  variant?: VariantResponseDto;

  @ApiPropertyOptional()
  user?: any; // To avoid deep cyclic deps, or import UserResponseDto if needed
}
