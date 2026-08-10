import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class GroupResponseDto {
  @ApiProperty({ description: "The unique group ID", type: String })
  id: string; // Serialized BigInt

  @ApiProperty({
    description: "The ID of the course this group belongs to",
    type: String,
    required: false,
  })
  courseId?: string;

  @ApiPropertyOptional()
  course?: {
    id: string;
    title: string;
  };

  @ApiProperty({
    description: "The Telegram Chat ID for this group",
    type: String,
  })
  telegramChatId: string;

  @ApiProperty({ description: "The title of the group" })
  title: string;

  @ApiProperty({
    description: "A free-text description of the group",
    required: false,
  })
  description?: string;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;

  constructor(partial: Partial<GroupResponseDto>) {
    Object.assign(this, partial);
  }
}
