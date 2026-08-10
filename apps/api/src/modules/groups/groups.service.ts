import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { GroupResponseDto } from "./dto/group-response.dto";

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(createGroupDto: CreateGroupDto): Promise<GroupResponseDto> {
    // Check if a group with the same telegramChatId already exists
    const existingGroup = await this.prisma.group.findUnique({
      where: { telegramChatId: BigInt(createGroupDto.telegramChatId) },
    });

    if (existingGroup) {
      throw new ConflictException(
        `Group with telegramChatId ${createGroupDto.telegramChatId} already exists`,
      );
    }

    let courseId = null;
    if (createGroupDto.courseId) {
      courseId = BigInt(createGroupDto.courseId);

      // Verify course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException(
          `Course with id ${createGroupDto.courseId} not found`,
        );
      }
    }

    const group = await this.prisma.group.create({
      data: {
        title: createGroupDto.title,
        description: createGroupDto.description,
        courseId,
        telegramChatId: BigInt(createGroupDto.telegramChatId),
      },
    });

    return new GroupResponseDto({
      ...group,
      description: group.description || undefined,
      id: group.id.toString(),
      courseId: group.courseId?.toString(),
      telegramChatId: group.telegramChatId.toString(),
    });
  }

  async findAllByCourseId(courseIdStr: string): Promise<GroupResponseDto[]> {
    const courseId = BigInt(courseIdStr);

    const groups = await this.prisma.group.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: { course: true },
    });

    return groups.map(
      (group: any) =>
        new GroupResponseDto({
          ...group,
          description: group.description || undefined,
          id: group.id.toString(),
          courseId: group.courseId?.toString(),
          telegramChatId: group.telegramChatId.toString(),
          course: group.course
            ? { id: group.course.id.toString(), title: group.course.title }
            : undefined,
        }),
    );
  }

  async findAll(): Promise<GroupResponseDto[]> {
    const groups = await this.prisma.group.findMany({
      orderBy: { createdAt: "desc" },
      include: { course: true },
    });

    return groups.map(
      (group: any) =>
        new GroupResponseDto({
          ...group,
          description: group.description || undefined,
          id: group.id.toString(),
          courseId: group.courseId?.toString(),
          telegramChatId: group.telegramChatId.toString(),
          course: group.course
            ? { id: group.course.id.toString(), title: group.course.title }
            : undefined,
        }),
    );
  }

  async linkCourse(
    groupIdStr: string,
    courseIdStr: string,
  ): Promise<GroupResponseDto> {
    const id = BigInt(groupIdStr);
    const courseId = BigInt(courseIdStr);

    const group = await this.prisma.group.update({
      where: { id },
      data: { courseId },
      include: { course: true },
    });

    return new GroupResponseDto({
      ...group,
      description: group.description || undefined,
      id: group.id.toString(),
      courseId: group.courseId?.toString(),
      telegramChatId: group.telegramChatId.toString(),
      course: group.course
        ? { id: group.course.id.toString(), title: group.course.title }
        : undefined,
    });
  }

  async findByTelegramChatId(chatIdStr: string): Promise<GroupResponseDto> {
    const telegramChatId = BigInt(chatIdStr);
    const group = await this.prisma.group.findUnique({
      where: { telegramChatId },
    });

    if (!group) {
      throw new NotFoundException(
        `Group with telegramChatId ${chatIdStr} not found`,
      );
    }

    return new GroupResponseDto({
      ...group,
      description: group.description || undefined,
      id: group.id.toString(),
      courseId: group.courseId?.toString(),
      telegramChatId: group.telegramChatId.toString(),
    });
  }
}
