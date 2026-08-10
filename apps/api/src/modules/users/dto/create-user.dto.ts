import {
  IsString,
  IsOptional,
  IsEnum,
  Length,
  IsNotEmpty,
  IsNumber,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../../common/enums/user.enums";
import { Type } from "class-transformer";

export class CreateUserDto {
  @ApiProperty({
    example: 123456789,
    description: "Telegram user_id — the single source of identity",
    type: Number,
  })
  @IsNumber()
  @Type(() => Number)
  telegramId: number;

  @ApiProperty({ example: "Иванов Иван Иванович", maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  fullName: string;

  @ApiPropertyOptional({ example: "+79991234567" })
  @IsOptional()
  @IsString()
  @Length(7, 30)
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.STUDENT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
