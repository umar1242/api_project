import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ description: 'The ID of the course this group belongs to', type: String, required: false })
  @IsOptional()
  @IsNumberString()
  courseId?: string; // Serialized BigInt

  @ApiProperty({ description: 'The Telegram Chat ID for this group', type: String })
  @IsNotEmpty()
  @IsNumberString()
  telegramChatId: string;

  @ApiProperty({ description: 'The title of the group', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'A free-text description of the group', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
