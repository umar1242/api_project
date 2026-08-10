import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Transform } from "class-transformer";
import { UserRole, UserStatus } from "../../../common/enums/user.enums";

/**
 * Public API response shape for a User.
 * - Exposes only safe fields (allowlist via @Expose + ClassSerializerInterceptor).
 * - BigInt fields serialised to strings (JSON cannot represent BigInt natively).
 */
@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ type: String, example: "123456789" })
  @Transform(({ value }) => (value != null ? value.toString() : null))
  id: bigint;

  @Expose()
  @ApiProperty({ type: String, example: "987654321" })
  @Transform(({ value }) => (value != null ? value.toString() : null))
  telegramId: bigint;

  @Expose()
  @ApiProperty({ example: "Иванов Иван Иванович" })
  fullName: string;

  @Expose()
  @ApiProperty({ example: "+79991234567", nullable: true })
  phone: string | null;

  @Expose()
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @Expose()
  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
