import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    const refLink = nanoid(10); // Generate a unique 10-character slug

    const course = await this.prisma.course.create({
      data: {
        ...createCourseDto,
        refLink,
      },
    });

    return new CourseResponseDto({
      ...course,
      description: course.description || undefined,
      plan: course.plan || undefined,
      id: course.id.toString(),
    });
  }

  async findAll(): Promise<CourseResponseDto[]> {
    const courses = await this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return courses.map(
      (course: any) =>
        new CourseResponseDto({
          ...course,
          description: course.description || undefined,
          plan: course.plan || undefined,
          id: course.id.toString(),
        }),
    );
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
      id: course.id.toString(),
    });
  }
}
