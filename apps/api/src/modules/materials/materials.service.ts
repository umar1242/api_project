import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateMaterialDto } from "./dto/create-material.dto";
import { UpdateMaterialDto } from "./dto/update-material.dto";
import { MaterialResponseDto } from "./dto/material-response.dto";
import { MaterialStatus, EnrollmentStatus, Prisma } from "@prisma/client";

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDto(material: any): MaterialResponseDto {
    const dto: MaterialResponseDto = {
      id: material.id.toString(),
      groupId: material.groupId.toString(),
      lessonId: material.lessonId ? material.lessonId.toString() : null,
      title: material.title,
      description: material.description,
      fileUrl: material.fileUrl,
      telegramFileId: material.telegramFileId,
      status: material.status,
      publishAt: material.publishAt,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
    };

    if (material.lesson) {
      dto.lesson = {
        id: material.lesson.id.toString(),
        groupId: material.lesson.groupId.toString(),
        title: material.lesson.title,
        description: material.lesson.description,
        type: material.lesson.type as any,
        status: material.lesson.status as any,
        startsAt: material.lesson.startsAt,
        durationMin: material.lesson.durationMin,
        meetingUrl: material.lesson.meetingUrl,
        createdAt: material.lesson.createdAt,
        updatedAt: material.lesson.updatedAt,
      };
    }

    return dto;
  }

  async create(
    createMaterialDto: CreateMaterialDto,
  ): Promise<MaterialResponseDto> {
    const material = await this.prisma.material.create({
      data: {
        groupId: BigInt(createMaterialDto.groupId),
        lessonId: createMaterialDto.lessonId
          ? BigInt(createMaterialDto.lessonId)
          : null,
        title: createMaterialDto.title,
        description: createMaterialDto.description,
        fileUrl: createMaterialDto.fileUrl,
        telegramFileId: createMaterialDto.telegramFileId,
        status: createMaterialDto.status || MaterialStatus.PENDING,
        publishAt: createMaterialDto.publishAt
          ? new Date(createMaterialDto.publishAt)
          : null,
      },
      include: { lesson: true },
    });
    return this.mapToDto(material);
  }

  async publish(id: bigint): Promise<MaterialResponseDto> {
    try {
      const material = await this.prisma.material.update({
        where: { id },
        data: { status: MaterialStatus.PUBLISHED },
        include: { lesson: true },
      });
      return this.mapToDto(material);
    } catch {
      throw new NotFoundException(`Material ${id} not found`);
    }
  }

  async findAll(options?: { search?: string; take?: number }): Promise<MaterialResponseDto[]> {
    const where: Prisma.MaterialWhereInput = {};

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const materials = await this.prisma.material.findMany({
      where,
      take: options?.take ?? 50,
      orderBy: { createdAt: "desc" },
      include: { lesson: true },
    });

    return materials.map((m: any) => this.mapToDto(m));
  }

  async findAllByGroup(
    groupId: bigint,
    isStudent = false,
  ): Promise<MaterialResponseDto[]> {
    const where: Prisma.MaterialWhereInput = { groupId };
    if (isStudent) {
      where.status = MaterialStatus.PUBLISHED;
      where.OR = [{ publishAt: null }, { publishAt: { lte: new Date() } }];
    }

    const materials = await this.prisma.material.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { lesson: true },
    });

    return materials.map(
      (m: Prisma.MaterialGetPayload<{ include: { lesson: true } }>) =>
        this.mapToDto(m),
    );
  }

  async findAllByLesson(
    lessonId: bigint,
    isStudent = false,
  ): Promise<MaterialResponseDto[]> {
    const where: Prisma.MaterialWhereInput = { lessonId };
    if (isStudent) {
      where.status = MaterialStatus.PUBLISHED;
      where.OR = [{ publishAt: null }, { publishAt: { lte: new Date() } }];
    }

    const materials = await this.prisma.material.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { lesson: true },
    });

    return materials.map(
      (m: Prisma.MaterialGetPayload<{ include: { lesson: true } }>) =>
        this.mapToDto(m),
    );
  }

  async findAllByGroupForStudent(
    groupId: bigint,
    telegramId: bigint,
  ): Promise<MaterialResponseDto[]> {
    // 1. Verify user has an active enrollment (status=ACTIVE or COMPLETED)
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        groupId,
        user: { telegramId },
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        "User is not actively enrolled in this group",
      );
    }

    // 2. Return materials where status === PUBLISHED and (publishAt is null or <= now)
    const materials = await this.prisma.material.findMany({
      where: {
        groupId,
        status: MaterialStatus.PUBLISHED,
        OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      include: { lesson: true },
    });

    return materials.map(
      (m: Prisma.MaterialGetPayload<{ include: { lesson: true } }>) =>
        this.mapToDto(m),
    );
  }

  async findOne(id: bigint): Promise<MaterialResponseDto> {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { lesson: true },
    });
    if (!material) throw new NotFoundException(`Material ${id} not found`);
    return this.mapToDto(material);
  }

  async update(
    id: bigint,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<MaterialResponseDto> {
    const data: any = { ...updateMaterialDto };

    if (updateMaterialDto.groupId !== undefined) {
      data.groupId = BigInt(updateMaterialDto.groupId);
    }
    if (updateMaterialDto.lessonId !== undefined) {
      data.lessonId = updateMaterialDto.lessonId
        ? BigInt(updateMaterialDto.lessonId)
        : null;
    }
    if (updateMaterialDto.publishAt !== undefined) {
      data.publishAt = updateMaterialDto.publishAt
        ? new Date(updateMaterialDto.publishAt)
        : null;
    }

    try {
      const material = await this.prisma.material.update({
        where: { id },
        data,
        include: { lesson: true },
      });
      return this.mapToDto(material);
    } catch {
      throw new NotFoundException(`Material ${id} not found`);
    }
  }

  async remove(id: bigint): Promise<void> {
    try {
      await this.prisma.material.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`Material ${id} not found`);
    }
  }
}
