import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';
import { UserRole } from '../../common/enums/user.enums';

/**
 * UsersController — internal API for bot-to-API user management.
 *
 * All endpoints are protected by ServiceTokenGuard (X-Service-Token header).
 * Mini App authentication (Telegram initData) is a separate flow in AuthModule (Stage 1+).
 */
@ApiTags('Users')
@ApiSecurity('service-token')
@UseGuards(ServiceTokenGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── POST /users ──────────────────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Register a new user (called by bots on /start)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  // ─── POST /users/upsert ───────────────────────────────────────────────────
  @Post('upsert')
  @ApiOperation({ summary: 'Create or update a user by telegramId (idempotent /start handler)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async upsert(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.upsert(dto);
  }

  // ─── GET /users/leaderboard ───────────────────────────────────────────────
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get top 10 students by XP' })
  @ApiResponse({ status: 200 })
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }

  // ─── GET /users ───────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all users with optional role filter' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query('role') role?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<{ data: UserResponseDto[]; total: number }> {
    return this.usersService.findAll({ role, skip, take });
  }

  // ─── GET /users/by-telegram/:telegramId ──────────────────────────────────
  @Get('by-telegram/:telegramId')
  @ApiOperation({ summary: 'Find user by Telegram user_id (used by bots on every message)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByTelegramId(
    @Param('telegramId', ParseIntPipe) telegramId: number,
  ): Promise<UserResponseDto | null> {
    return this.usersService.findByTelegramId(BigInt(telegramId));
  }

  // ─── GET /users/:id ───────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get user by internal ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.findOne(BigInt(id));
  }

  // ─── PUT /users/:id ───────────────────────────────────────────────────────
  @Put(':id')
  @ApiOperation({ summary: 'Update user fields (role, status, name, phone)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(BigInt(id), dto);
  }

  // ─── DELETE /users/:id ────────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete user (GDPR erasure only)' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(BigInt(id));
  }
}
