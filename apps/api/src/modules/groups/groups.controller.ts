import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
} from "@nestjs/swagger";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { GroupResponseDto } from "./dto/group-response.dto";
import { EnrollmentResponseDto } from "../enrollments/dto/enrollment-response.dto";
import { ServiceTokenGuard } from "../../common/guards/service-token.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { Req } from "@nestjs/common";

@ApiTags("Groups")
@Controller("groups")
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly auditService: AuditService,
  ) {}

  @ApiOperation({ summary: "Create a new group linked to a course" })
  @ApiResponse({
    status: 201,
    description: "Group successfully created",
    type: GroupResponseDto,
  })
  @ApiHeader({
    name: "x-service-token",
    description: "Service authentication token",
  })
  @UseGuards(ServiceTokenGuard)
  @Post()
  async create(
    @Req() req: any,
    @Body() createGroupDto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    const group = await this.groupsService.create(createGroupDto);
    const userId = req.telegramUser?.id || req.adminTelegramId;
    if (userId) {
      this.auditService.logAction(
        BigInt(userId),
        "CREATE_GROUP",
        BigInt(group.id),
        "Group",
        createGroupDto,
      );
    }
    return group;
  }

  @ApiOperation({ summary: "Get all groups or groups by course ID" })
  @ApiResponse({
    status: 200,
    description: "List of groups",
    type: [GroupResponseDto],
  })
  @ApiQuery({ name: "courseId", required: false, type: String })
  @Get()
  async findAll(
    @Query("courseId") courseId?: string,
  ): Promise<GroupResponseDto[]> {
    if (courseId) {
      return this.groupsService.findAllByCourseId(courseId);
    }
    return this.groupsService.findAll();
  }

  @ApiOperation({ summary: "Get all enrollments for a group" })
  @ApiResponse({
    status: 200,
    description: "List of enrollments in this group",
    type: [EnrollmentResponseDto],
  })
  @ApiHeader({
    name: "x-service-token",
    description: "Service authentication token",
  })
  @UseGuards(ServiceTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Get(":id/enrollments")
  async getEnrollments(
    @Param("id") id: string,
  ): Promise<EnrollmentResponseDto[]> {
    return this.groupsService.findEnrollmentsByGroupId(id);
  }

  @ApiOperation({ summary: "Link group to course" })
  @ApiResponse({
    status: 200,
    description: "Group linked successfully",
    type: GroupResponseDto,
  })
  @ApiHeader({
    name: "x-service-token",
    description: "Service authentication token",
  })
  @UseGuards(ServiceTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @Patch(":id/link")
  async linkCourse(
    @Req() req: any,
    @Param("id") id: string,
    @Body("courseId") courseId: string,
  ): Promise<GroupResponseDto> {
    const group = await this.groupsService.linkCourse(id, courseId);
    const userId = req.telegramUser?.id || req.adminTelegramId;
    if (userId) {
      this.auditService.logAction(
        BigInt(userId),
        "UPDATE_GROUP",
        BigInt(id),
        "Group",
        { courseId },
      );
    }
    return group;
  }

  @ApiOperation({ summary: "Get group by Telegram chat ID" })
  @ApiResponse({
    status: 200,
    description: "Group details",
    type: GroupResponseDto,
  })
  @ApiResponse({ status: 404, description: "Group not found" })
  @ApiHeader({
    name: "x-service-token",
    description: "Service authentication token",
  })
  @UseGuards(ServiceTokenGuard)
  @Get("by-chat/:chatId")
  async findByTelegramChatId(
    @Param("chatId") chatId: string,
  ): Promise<GroupResponseDto> {
    return this.groupsService.findByTelegramChatId(chatId);
  }
}
