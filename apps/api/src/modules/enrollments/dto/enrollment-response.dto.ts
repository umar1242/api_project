import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EnrollmentStatus } from "@prisma/client";

export class EnrollmentUserDto {
  @ApiProperty({ description: "User ID", type: String })
  id: string;

  @ApiProperty({ description: "Telegram ID", type: String })
  telegramId: string;

  @ApiProperty({ description: "Full Name" })
  fullName: string;

  @ApiPropertyOptional({ description: "Phone number" })
  phone?: string;

  @ApiProperty({ description: "User role" })
  role: string;

  @ApiProperty({ description: "User status" })
  status: string;

  @ApiProperty({ description: "XP points" })
  xp: number;
}

export class EnrollmentResponseDto {
  @ApiProperty({ description: "The unique enrollment ID", type: String })
  id: string; // Serialized BigInt

  @ApiProperty({ description: "The user ID", type: String })
  userId: string;

  @ApiProperty({ description: "The group ID", type: String })
  groupId: string;

  @ApiProperty({ description: "Enrollment status", enum: EnrollmentStatus })
  status: EnrollmentStatus;

  @ApiPropertyOptional({
    description: "When payment is due (for paid courses)",
  })
  paymentDueAt?: Date;

  @ApiPropertyOptional({ description: "When payment was confirmed" })
  paymentPaidAt?: Date;

  @ApiPropertyOptional({ description: "Flexible additional metadata" })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: "Telegram chat invite link" })
  inviteLink?: string;

  @ApiPropertyOptional({
    type: () => EnrollmentUserDto,
    description: "Enrolled user info",
  })
  user?: EnrollmentUserDto;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;

  constructor(partial: Partial<EnrollmentResponseDto>) {
    Object.assign(this, partial);
  }
}
