import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @ApiOperation({ summary: 'Create a new group linked to a course' })
  @ApiResponse({
    status: 201,
    description: 'Group successfully created',
    type: GroupResponseDto,
  })
  @ApiHeader({ name: 'x-service-token', description: 'Service authentication token' })
  @UseGuards(ServiceTokenGuard)
  @Post()
  async create(@Body() createGroupDto: CreateGroupDto): Promise<GroupResponseDto> {
    return this.groupsService.create(createGroupDto);
  }

  @ApiOperation({ summary: 'Get all groups or groups by course ID' })
  @ApiResponse({
    status: 200,
    description: 'List of groups',
    type: [GroupResponseDto],
  })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @Get()
  async findAll(@Query('courseId') courseId?: string): Promise<GroupResponseDto[]> {
    if (courseId) {
      return this.groupsService.findAllByCourseId(courseId);
    }
    return this.groupsService.findAll();
  }

  @ApiOperation({ summary: 'Link group to course' })
  @ApiResponse({
    status: 200,
    description: 'Group linked successfully',
    type: GroupResponseDto,
  })
  @ApiHeader({ name: 'x-service-token', description: 'Service authentication token' })
  @UseGuards(ServiceTokenGuard)
  @Patch(':id/link')
  async linkCourse(
    @Param('id') id: string,
    @Body('courseId') courseId: string
  ): Promise<GroupResponseDto> {
    return this.groupsService.linkCourse(id, courseId);
  }

  @ApiOperation({ summary: 'Get group by Telegram chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Group details',
    type: GroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiHeader({ name: 'x-service-token', description: 'Service authentication token' })
  @UseGuards(ServiceTokenGuard)
  @Get('by-chat/:chatId')
  async findByTelegramChatId(@Param('chatId') chatId: string): Promise<GroupResponseDto> {
    return this.groupsService.findByTelegramChatId(chatId);
  }
}
