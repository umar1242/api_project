import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async enroll(
    createEnrollmentDto: CreateEnrollmentDto,
    telegramUser: any,
  ): Promise<EnrollmentResponseDto> {
    // 1. Upsert User
    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(telegramUser.id) },
      create: {
        telegramId: BigInt(telegramUser.id),
        fullName: createEnrollmentDto.fullName,
        phone: createEnrollmentDto.phone ?? null,
      },
      update: {
        // Only update if they provided new info
        ...(createEnrollmentDto.fullName && { fullName: createEnrollmentDto.fullName }),
        ...(createEnrollmentDto.phone && { phone: createEnrollmentDto.phone }),
      },
    });

    // 2. Find Course
    const course = await this.prisma.course.findUnique({
      where: { refLink: createEnrollmentDto.refLink },
      include: { groups: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with refLink ${createEnrollmentDto.refLink} not found`);
    }

    if (course.groups.length === 0) {
      throw new NotFoundException(`No available groups found for this course`);
    }

    // 3. Auto-assign to the first group for now
    const group = course.groups[0];

    try {
      // 4. Create Enrollment
      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId: user.id,
          groupId: group.id,
          metadata: createEnrollmentDto.metadata ?? {},
        },
      });

      this.logger.log(`User ${user.id} enrolled in group ${group.id}`);

      let inviteLink: string | undefined = undefined;
      
      try {
        const registrarToken = process.env.REGISTRAR_BOT_TOKEN;
        if (registrarToken && group.telegramChatId) {
          const res = await fetch(`https://api.telegram.org/bot${registrarToken}/createChatInviteLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: group.telegramChatId.toString(),
              member_limit: 1, // specific to this user
            })
          });
          const data = await res.json();
          if (data.ok && data.result?.invite_link) {
            inviteLink = data.result.invite_link;
          } else {
            this.logger.warn(`Failed to generate invite link: ${JSON.stringify(data)}`);
          }
        }
      } catch (e) {
        this.logger.error('Error creating chat invite link', e);
      }

      return new EnrollmentResponseDto({
        ...enrollment,
        paymentDueAt: enrollment.paymentDueAt || undefined,
        paymentPaidAt: enrollment.paymentPaidAt || undefined,
        metadata: enrollment.metadata ? (enrollment.metadata as any) : undefined,
        id: enrollment.id.toString(),
        userId: enrollment.userId.toString(),
        groupId: enrollment.groupId.toString(),
        inviteLink,
      } as any);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('User is already enrolled in this group');
      }
      throw err;
    }
  }
}
