import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { CourseResponseDto } from "./dto/course-response.dto";
import { nanoid } from "nanoid";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  private async generateUniqueAccessCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const existing = await this.prisma.course.findUnique({
        where: { accessCode: code },
      });
      if (!existing) return code;
    }
    throw new Error('Failed to generate a unique access code after 20 attempts');
  }

  async create(createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    const refLink = nanoid(10); // Generate a unique 10-character slug
    const accessCode = await this.generateUniqueAccessCode();

    const course = await this.prisma.course.create({
      data: {
        ...createCourseDto,
        refLink,
        accessCode,
      },
    });

    return new CourseResponseDto({
      ...course,
      description: course.description || undefined,
      plan: course.plan || undefined,
      accessCode: course.accessCode || undefined,
      id: course.id.toString(),
    });
  }

  async findAll(): Promise<CourseResponseDto[]> {
    const courses = await this.prisma.course.findMany({
      orderBy: { createdAt: "desc" },
    });

    return courses.map(
      (course: any) =>
        new CourseResponseDto({
          ...course,
          description: course.description || undefined,
          plan: course.plan || undefined,
          accessCode: course.accessCode || undefined,
          id: course.id.toString(),
        }),
    );
  }

  async findByCode(code: string): Promise<CourseResponseDto> {
    const normalizedCode = code.trim().toUpperCase();
    const course = await this.prisma.course.findUnique({
      where: { accessCode: normalizedCode },
    });
    if (!course) throw new NotFoundException(`Invalid or unknown code`);
    return new CourseResponseDto({
      ...course,
      description: course.description || undefined,
      plan: course.plan || undefined,
      accessCode: course.accessCode || undefined,
      id: course.id.toString(),
    });
  }

  async findByRefLink(refLink: string): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { refLink },
    });

    if (!course) {
      throw new NotFoundException(`Course with refLink ${refLink} not found`);
    }

    return new CourseResponseDto({
      ...course,
      description: course.description || undefined,
      plan: course.plan || undefined,
      accessCode: course.accessCode || undefined,
      id: course.id.toString(),
    });
  }

  async announce(id: string, adminTelegramId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: BigInt(id) },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    const adminBotToken = process.env.ADMIN_BOT_TOKEN;
    const registrarBotUsername =
      process.env.REGISTRAR_BOT_USERNAME || "student1242bot";

    const text =
      `📢 <b>${course.title}</b>\n\n` +
      (course.description ? `${course.description}\n\n` : "") +
      `🔑 Код доступа: <code>${course.accessCode || ""}</code>\n\n` +
      `Отправьте этот код боту @${registrarBotUsername}, чтобы записаться:\n` +
      `https://t.me/${registrarBotUsername}`;

    if (adminBotToken && adminTelegramId) {
      const res = await fetch(
        `https://api.telegram.org/bot${adminBotToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: adminTelegramId.toString(),
            text,
            parse_mode: "HTML",
          }),
        },
      );
      const data = await res.json();
      if (!data.ok) {
        throw new Error(
          `Failed to send Telegram message: ${JSON.stringify(data)}`,
        );
      }
    }

    return {
      success: true,
      message: "Announcement sent successfully",
      courseId: id,
    };
  }
}

