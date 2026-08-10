import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { LessonResponseDto } from "./dto/lesson-response.dto";

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDto(lesson: any): LessonResponseDto {
    return {
      id: lesson.id.toString(),
      groupId: lesson.groupId.toString(),
      title: lesson.title,
      description: lesson.description,
      type: lesson.type as any,
      status: lesson.status as any,
      startsAt: lesson.startsAt,
      durationMin: lesson.durationMin,
      meetingUrl: lesson.meetingUrl,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  }

  async create(dto: CreateLessonDto): Promise<LessonResponseDto> {
    const lesson = await this.prisma.lesson.create({
      data: {
        groupId: BigInt(dto.groupId),
        title: dto.title,
        description: dto.description,
        type: dto.type,
        startsAt: new Date(dto.startsAt),
        durationMin: dto.durationMin ?? 60,
        meetingUrl: dto.meetingUrl,
      },
    });
    return this.mapToDto(lesson);
  }

  async findAllByGroup(
    groupId: bigint,
    opts?: { skip?: number; take?: number },
  ): Promise<{ data: LessonResponseDto[]; total: number }> {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where: { groupId },
        skip: opts?.skip ? Number(opts.skip) : undefined,
        take: opts?.take ? Number(opts.take) : 50,
        orderBy: { startsAt: "asc" },
      }),
      this.prisma.lesson.count({ where: { groupId } }),
    ]);
    return { data: data.map((l) => this.mapToDto(l)), total };
  }

  async findUpcoming(groupId: bigint, limit = 5): Promise<LessonResponseDto[]> {
    const data = await this.prisma.lesson.findMany({
      where: { groupId, startsAt: { gt: new Date() } },
      take: limit,
      orderBy: { startsAt: "asc" },
    });
    return data.map((l) => this.mapToDto(l));
  }

  async findLessonsStartingSoon(lookAheadMs: number) {
    const now = new Date();
    const until = new Date(now.getTime() + lookAheadMs);
    const data = await this.prisma.lesson.findMany({
      where: { startsAt: { gte: now, lte: until } },
      orderBy: { startsAt: "asc" },
    });
    return data;
  }

  async findOne(id: bigint): Promise<LessonResponseDto> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException("Lesson not found");
    return this.mapToDto(lesson);
  }

  async update(id: bigint, dto: UpdateLessonDto): Promise<LessonResponseDto> {
    const data: any = { ...dto };
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.groupId) data.groupId = BigInt(dto.groupId);

    try {
      const lesson = await this.prisma.lesson.update({
        where: { id },
        data,
      });
      return this.mapToDto(lesson);
    } catch {
      throw new NotFoundException("Lesson not found");
    }
  }

  async remove(id: bigint): Promise<void> {
    try {
      await this.prisma.lesson.delete({ where: { id } });
    } catch {
      throw new NotFoundException("Lesson not found");
    }
  }
}
