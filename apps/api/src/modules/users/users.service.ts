import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

// PrismaClientKnownRequestError is imported from the runtime package,
// not from @prisma/client types — this works before prisma generate.
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDto(user: any): UserResponseDto {
    return new UserResponseDto(user as UserResponseDto);
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new user.
   * Fails with 409 if the telegramId is already registered.
   */
  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.create({
        data: {
          telegramId: BigInt(dto.telegramId),
          fullName: dto.fullName,
          phone: dto.phone,
          role: dto.role,
        },
      });
      this.logger.log(`Created user ${user.id} (tg:${user.telegramId})`);
      return this.toDto(user);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          `User with telegramId ${dto.telegramId} already exists`,
        );
      }
      throw err;
    }
  }

  /**
   * List all users.
   * Supports optional role filter and pagination.
   */
  async findAll(params: {
    role?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: UserResponseDto[]; total: number }> {
    const { role, skip = 0, take = 50 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = role ? { role } : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users.map((u) => this.toDto(u)), total };
  }

  /**
   * Find a single user by internal database ID.
   */
  async findOne(id: bigint): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.toDto(user);
  }

  /**
   * Find a user by Telegram user_id.
   * Used by bots on every incoming message to resolve identity.
   */
  async findByTelegramId(telegramId: bigint): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    return user ? this.toDto(user) : null;
  }

  /**
   * Upsert by telegramId — create if not exists, otherwise update fields.
   * Called during bot /start to register or refresh user info.
   */
  async upsert(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(dto.telegramId) },
      create: {
        telegramId: BigInt(dto.telegramId),
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        role: dto.role,
      },
      update: {
        fullName: dto.fullName,
        phone: dto.phone ?? null,
      },
    });
    return this.toDto(user);
  }

  /**
   * Partial update — only provided fields are modified.
   */
  async update(id: bigint, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.findOne(id); // Ensure exists, throws 404 otherwise
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.role && { role: dto.role }),
        ...(dto.status && { status: dto.status }),
      },
    });
    return this.toDto(user);
  }

  /**
   * Hard delete — for GDPR erasure requests only.
   */
  async remove(id: bigint): Promise<void> {
    await this.findOne(id); // Ensure exists
    await this.prisma.user.delete({ where: { id } });
    this.logger.warn(`Deleted user ${id}`);
  }

  /**
   * Get leaderboard (top 10 users by XP).
   */
  async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      where: { role: 'STUDENT', status: 'ACTIVE' },
      orderBy: { xp: 'desc' },
      take: 10,
    });
    return users.map(u => ({
      id: u.id.toString(),
      fullName: u.fullName,
      xp: u.xp,
    }));
  }
}
