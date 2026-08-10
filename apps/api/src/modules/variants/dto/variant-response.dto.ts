import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class VariantTaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  requiresAdmin: boolean;

  @ApiProperty()
  requiresAttachment: boolean;

  @ApiPropertyOptional()
  optionsCount?: number;

  @ApiPropertyOptional()
  correctAnswer?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class VariantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiPropertyOptional()
  startsAt?: Date;

  @ApiPropertyOptional()
  deadlineAt?: Date;

  @ApiPropertyOptional()
  courseId?: string;

  @ApiPropertyOptional()
  groupId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => [VariantTaskResponseDto] })
  tasks?: VariantTaskResponseDto[];
}

export class VariantPublicTaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  requiresAdmin: boolean;

  @ApiProperty()
  requiresAttachment: boolean;

  @ApiPropertyOptional()
  optionsCount?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class VariantPublicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiPropertyOptional()
  startsAt?: Date;

  @ApiPropertyOptional()
  deadlineAt?: Date;

  @ApiPropertyOptional()
  courseId?: string;

  @ApiPropertyOptional()
  groupId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => [VariantPublicTaskResponseDto] })
  tasks?: VariantPublicTaskResponseDto[];
}
