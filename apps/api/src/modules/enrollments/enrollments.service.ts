import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { EnrollmentResponseDto } from "./dto/enrollment-response.dto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { EnrollmentStatus } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
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
        ...(createEnrollmentDto.fullName && {
          fullName: createEnrollmentDto.fullName,
        }),
        ...(createEnrollmentDto.phone && { phone: createEnrollmentDto.phone }),
      },
    });

    // 2. Find Course
    const course = await this.prisma.course.findUnique({
      where: { refLink: createEnrollmentDto.refLink },
      include: { groups: true },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with refLink ${createEnrollmentDto.refLink} not found`,
      );
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
      const registrarToken = process.env.REGISTRAR_BOT_TOKEN;

      if (registrarToken && group.telegramChatId) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const res = await fetch(
              `https://api.telegram.org/bot${registrarToken}/createChatInviteLink`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: group.telegramChatId.toString(),
                  member_limit: 1,
                }),
              },
            );
            const data = await res.json();
            if (data.ok && data.result?.invite_link) {
              inviteLink = data.result.invite_link;
              break;
            } else {
              this.logger.warn(
                `Failed to generate invite link (attempt ${attempt}): ${JSON.stringify(data)}`,
              );
            }
          } catch (e) {
            this.logger.error(
              `Error creating chat invite link (attempt ${attempt})`,
              e,
            );
            if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }

      return new EnrollmentResponseDto({
        ...enrollment,
        paymentDueAt: enrollment.paymentDueAt || undefined,
        paymentPaidAt: enrollment.paymentPaidAt || undefined,
        metadata: enrollment.metadata
          ? (enrollment.metadata as any)
          : undefined,
        id: enrollment.id.toString(),
        userId: enrollment.userId.toString(),
        groupId: enrollment.groupId.toString(),
        inviteLink,
      } as any);
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictException("User is already enrolled in this group");
      }
      throw err;
    }
  }

  async getInviteLink(
    id: string,
    telegramUser: any,
  ): Promise<{ inviteLink: string }> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: BigInt(id) },
      include: {
        group: true,
        user: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    if (enrollment.user.telegramId !== BigInt(telegramUser.id)) {
      throw new ForbiddenException(
        "You are not allowed to access this enrollment",
      );
    }

    if (!enrollment.group.telegramChatId) {
      throw new NotFoundException("Telegram group not found for this course");
    }

    const registrarToken = process.env.REGISTRAR_BOT_TOKEN;
    if (!registrarToken) {
      throw new Error("REGISTRAR_BOT_TOKEN not configured");
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${registrarToken}/createChatInviteLink`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: enrollment.group.telegramChatId.toString(),
              member_limit: 1,
            }),
          },
        );
        const data = await res.json();
        if (data.ok && data.result?.invite_link) {
          return { inviteLink: data.result.invite_link };
        } else {
          this.logger.warn(
            `Failed to generate invite link (attempt ${attempt}): ${JSON.stringify(data)}`,
          );
        }
      } catch (e) {
        this.logger.error(
          `Error creating chat invite link (attempt ${attempt})`,
          e,
        );
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
      }
    }

    throw new Error(
      "Failed to generate Telegram invite link. Please try again.",
    );
  }

  async updateStatus(
    id: string,
    status: EnrollmentStatus,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.prisma.enrollment.update({
      where: { id: BigInt(id) },
      data: { status },
    });
    return this.mapToDto(enrollment);
  }

  async confirmPayment(id: string): Promise<EnrollmentResponseDto> {
    const enrollment = await this.prisma.enrollment.update({
      where: { id: BigInt(id) },
      data: { paymentPaidAt: new Date() },
    });

    await this.notificationsService
      .sendNotification(
        enrollment.userId,
        "Оплата подтверждена",
        "Оплата подтверждена, добро пожаловать в курс",
        "PAYMENT_CONFIRMED",
      )
      .catch((err) =>
        this.logger.error(
          `Failed to send payment confirmation to user ${enrollment.userId}`,
          err,
        ),
      );

    return this.mapToDto(enrollment);
  }

  private mapToDto(enrollment: any): EnrollmentResponseDto {
    return new EnrollmentResponseDto({
      ...enrollment,
      paymentDueAt: enrollment.paymentDueAt || undefined,
      paymentPaidAt: enrollment.paymentPaidAt || undefined,
      metadata: enrollment.metadata ? (enrollment.metadata as any) : undefined,
      id: enrollment.id.toString(),
      userId: enrollment.userId.toString(),
      groupId: enrollment.groupId.toString(),
    } as any);
  }
}
