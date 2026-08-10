import { ApiProperty } from "@nestjs/swagger";
import { EnrollmentStatus } from "@prisma/client";

export class EnrollmentResponseDto {
  @ApiProperty({ description: "The unique enrollment ID", type: String })
  id: string; // Serialized BigInt

  @ApiProperty({ description: "The user ID", type: String })
  userId: string;

  @ApiProperty({ description: "The group ID", type: String })
  groupId: string;

  @ApiProperty({ description: "Enrollment status", enum: EnrollmentStatus })
  status: EnrollmentStatus;

  @ApiProperty({
    description: "When payment is due (for paid courses)",
    required: false,
  })
  paymentDueAt?: Date;

  @ApiProperty({ description: "When payment was confirmed", required: false })
  paymentPaidAt?: Date;

  @ApiProperty({ description: "Flexible additional metadata", required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: "Telegram chat invite link", required: false })
  inviteLink?: string;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;

  constructor(partial: Partial<EnrollmentResponseDto>) {
    Object.assign(this, partial);
  }
}
