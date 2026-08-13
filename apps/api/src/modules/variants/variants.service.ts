import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateVariantDto } from "./dto/create-variant.dto";
import {
  VariantTask,
  VariantTaskAnswer,
  Variant,
  VariantSubmission,
  User,
} from "@prisma/client";
import { GamificationService } from "../gamification/gamification.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class VariantsService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
    private notificationsService: NotificationsService,
  ) {}

  private async generateUniqueAccessCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const existing = await this.prisma.variant.findUnique({
        where: { accessCode: code },
      });
      if (!existing) return code;
    }
    throw new Error('Failed to generate a unique access code after 20 attempts');
  }

  private mapVariantToPublicDto(
    variant: any,
  ): import("./dto/variant-response.dto").VariantPublicResponseDto {
    return {
      ...variant,
      id: variant.id.toString(),
      courseId: variant.courseId?.toString(),
      groupId: variant.groupId?.toString(),
      tasks: variant.tasks?.map((task: VariantTask) => {
        const { correctAnswer, ...taskWithoutAnswer } = task;
        return {
          ...taskWithoutAnswer,
          id: task.id.toString(),
          variantId: task.variantId.toString(),
        };
      }),
    };
  }

  private mapVariantToDto(
    variant: any,
  ): import("./dto/variant-response.dto").VariantResponseDto {
    return {
      id: variant.id.toString(),
      title: variant.title,
      description: variant.description,
      type: variant.type,
      fileUrl: variant.fileUrl,
      accessCode: variant.accessCode,
      startsAt: variant.startsAt,
      deadlineAt: variant.deadlineAt,
      courseId: variant.courseId?.toString(),
      groupId: variant.groupId?.toString(),
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
      tasks: variant.tasks?.map((task: any) => ({
        id: task.id.toString(),
        variantId: task.variantId.toString(),
        type: task.type,
        orderIndex: task.orderIndex,
        requiresAdmin: task.requiresAdmin,
        requiresAttachment: task.requiresAttachment,
        optionsCount: task.optionsCount,
        maxAttachments: task.maxAttachments,
        subQuestions: task.subQuestions?.map((sq: any) => ({
          id: sq.id.toString(),
          orderIndex: sq.orderIndex,
        })),
      })),
    };
  }

  private mapVariantToAdminDto(
    variant: any,
  ): import("./dto/variant-response.dto").VariantAdminResponseDto {
    return {
      id: variant.id.toString(),
      title: variant.title,
      description: variant.description,
      type: variant.type,
      fileUrl: variant.fileUrl,
      accessCode: variant.accessCode,
      startsAt: variant.startsAt,
      deadlineAt: variant.deadlineAt,
      courseId: variant.courseId?.toString(),
      groupId: variant.groupId?.toString(),
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
      tasks: variant.tasks?.map((task: any) => ({
        id: task.id.toString(),
        variantId: task.variantId.toString(),
        type: task.type,
        orderIndex: task.orderIndex,
        requiresAdmin: task.requiresAdmin,
        requiresAttachment: task.requiresAttachment,
        optionsCount: task.optionsCount,
        maxAttachments: task.maxAttachments,
        correctAnswer: task.correctAnswer,
        subQuestions: task.subQuestions?.map((sq: any) => ({
          id: sq.id.toString(),
          orderIndex: sq.orderIndex,
          correctAnswer: sq.correctAnswer,
        })),
      })),
    };
  }

  private mapSubmissionToDto(
    submission: any,
  ): import("./dto/variant-submission-response.dto").VariantSubmissionResponseDto {
    return {
      ...submission,
      id: submission.id.toString(),
      variantId: submission.variantId.toString(),
      userId: submission.userId.toString(),
      answers: submission.answers?.map((answer: VariantTaskAnswer) => ({
        ...answer,
        id: answer.id.toString(),
        submissionId: answer.submissionId.toString(),
        taskId: answer.taskId.toString(),
      })),
      variant: submission.variant
        ? this.mapVariantToDto(submission.variant)
        : undefined,
      user: submission.user
        ? {
            ...submission.user,
            id: submission.user.id.toString(),
            telegramId: submission.user.telegramId.toString(),
          }
        : undefined,
    };
  }

  async create(data: CreateVariantDto) {
    const accessCode = await this.generateUniqueAccessCode();
    const variant = await this.prisma.variant.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        fileUrl: data.fileUrl,
        accessCode,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : null,
        courseId: data.courseId ? BigInt(data.courseId) : null,
        groupId: data.groupId ? BigInt(data.groupId) : null,
        tasks: {
          create:
            data.tasks?.map((task: import("./dto/create-variant.dto").CreateVariantTaskDto) => ({
              type: task.type,
              orderIndex: task.orderIndex,
              requiresAdmin: task.requiresAdmin || false,
              requiresAttachment: task.requiresAttachment || false,
              optionsCount: task.optionsCount,
              maxAttachments: task.requiresAttachment
                ? (task.maxAttachments ?? 4)
                : null,
              correctAnswer: task.correctAnswer,
              subQuestions: task.subQuestions?.length
                ? {
                    create: task.subQuestions.map((sq) => ({
                      orderIndex: sq.orderIndex,
                      correctAnswer: sq.correctAnswer,
                    })),
                  }
                : undefined,
            })) || [],
        },
      },
      include: {
        tasks: { include: { subQuestions: { orderBy: { orderIndex: 'asc' } } } },
      },
    });
    return this.mapVariantToAdminDto(variant);
  }

  async findAll(telegramId?: bigint) {
    let variants;
    if (telegramId) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { user: { telegramId }, status: { in: ["ACTIVE", "COMPLETED"] } }
      });
      const groupIds = enrollments.map((e: import("@prisma/client").Enrollment) => e.groupId);
      variants = await this.prisma.variant.findMany({
        where: { OR: [{ groupId: { in: groupIds } }, { groupId: null }] },
        include: { tasks: { include: { subQuestions: { orderBy: { orderIndex: 'asc' } } } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      variants = await this.prisma.variant.findMany({
        include: { tasks: { include: { subQuestions: { orderBy: { orderIndex: 'asc' } } } } },
        orderBy: { createdAt: "desc" },
      });
    }
    return variants.map((v: Variant & { tasks: VariantTask[] }) => this.mapVariantToDto(v));
  }

  async findOne(id: string, telegramId?: bigint) {
    const variant = await this.prisma.variant.findUnique({
      where: { id: BigInt(id) },
      include: { tasks: { include: { subQuestions: { orderBy: { orderIndex: 'asc' } } } } },
    });
    if (!variant) throw new NotFoundException("Variant not found");

    if (telegramId && variant.groupId) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { groupId: variant.groupId, user: { telegramId }, status: { in: ["ACTIVE", "COMPLETED"] } }
      });
      if (!enrollment) {
        throw new ForbiddenException("User is not enrolled in the group for this variant");
      }
    }

    return this.mapVariantToDto(variant);
  }

  async findByCode(code: string, telegramId?: bigint) {
    const normalizedCode = code.trim().toUpperCase();
    const variant = await this.prisma.variant.findUnique({
      where: { accessCode: normalizedCode },
      include: { tasks: { include: { subQuestions: { orderBy: { orderIndex: 'asc' } } } } },
    });
    if (!variant) throw new NotFoundException("Invalid or unknown code");

    if (telegramId && variant.groupId) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { groupId: variant.groupId, user: { telegramId }, status: { in: ["ACTIVE", "COMPLETED"] } }
      });
      if (!enrollment) {
        throw new ForbiddenException("User is not enrolled in the group for this variant");
      }
    }

    return this.mapVariantToDto(variant);
  }

  async findOneAdmin(id: string) {
    const variant = await this.prisma.variant.findUnique({
      where: { id: BigInt(id) },
      include: { tasks: { include: { subQuestions: { orderBy: { orderIndex: 'asc' } } } } },
    });
    if (!variant) throw new NotFoundException("Variant not found");
    return this.mapVariantToAdminDto(variant);
  }

  async updateTasks(
    id: string,
    updateTasksDto: {
      tasks: {
        id: string;
        correctAnswer?: string;
        optionsCount?: number;
        maxAttachments?: number;
      }[];
    },
  ) {
    for (const task of updateTasksDto.tasks) {
      await this.prisma.variantTask.update({
        where: { id: BigInt(task.id) },
        data: {
          correctAnswer: task.correctAnswer,
          optionsCount: task.optionsCount,
          ...(task.maxAttachments !== undefined
            ? { maxAttachments: task.maxAttachments }
            : {}),
        },
      });
    }
    return { success: true };
  }

  async submitAnswers(
    variantId: string,
    data: import("./dto/submit-variant.dto").SubmitVariantDto,
    telegramId?: bigint,
  ) {
    if (telegramId) {
      const u = await this.prisma.user.findUnique({ where: { telegramId } });
      if (!u) throw new ForbiddenException("User not found");
      if (data.userId && data.userId !== u.id.toString()) {
        throw new ForbiddenException("Cannot submit answers for another user");
      }
      data.userId = u.id.toString();
    }

    const variant = await this.prisma.variant.findUnique({
      where: { id: BigInt(variantId) },
      include: {
        tasks: { include: { subQuestions: { orderBy: { orderIndex: 'asc' } } } },
        group: true,
      },
    });
    if (!variant) throw new NotFoundException("Variant not found");

    let totalScore = 0;
    let needsAdminCheck = false;

    const answersToCreate = variant.tasks.map((task: any) => {
      const studentAnswer = data.answers[task.id.toString()];
      let fileUrls = data.fileUrls?.[task.id.toString()];

      if (task.requiresAttachment && fileUrls && fileUrls.length > 0) {
        const limit = task.maxAttachments ?? 4;
        if (fileUrls.length > limit) {
          throw new BadRequestException(
            `Task ${task.id.toString()} allows at most ${limit} attachment(s), got ${fileUrls.length}`,
          );
        }
      }
      if (!task.requiresAttachment) {
        fileUrls = undefined;
      }

      let score = 0;
      let subAnswersToSave: Record<string, string> | undefined;

      if (task.type === "WRITTEN_WORK" && task.subQuestions?.length > 0) {
        // Задание Типа 3 с несколькими подвопросами (2-6+).
        const studentSubAnswers: Record<string, string> =
          data.subAnswers?.[task.id.toString()] || {};
        subAnswersToSave = studentSubAnswers;

        if (!task.requiresAdmin) {
          // Режим 1: автопроверка — по баллу за каждый верно отвеченный подвопрос.
          let correctCount = 0;
          for (const sq of task.subQuestions) {
            const studentSub = studentSubAnswers[sq.id.toString()];
            if (
              studentSub &&
              sq.correctAnswer &&
              studentSub.trim().toLowerCase() ===
                sq.correctAnswer.trim().toLowerCase()
            ) {
              correctCount++;
            }
          }
          score = correctCount;
        } else {
          // Режим 2: ручная проверка админом, балл появится после проверки.
          needsAdminCheck = true;
        }
      } else {
        // MULTIPLE_CHOICE, SPECIFIC_ANSWER, и WRITTEN_WORK без подвопросов (одиночный ответ).
        // ВАЖНО: раньше ЛЮБОЕ задание WRITTEN_WORK принудительно уходило на ручную
        // проверку, даже если admin не включал requiresAdmin — это был баг.
        // Теперь на ручную проверку уходит только то, что admin явно пометил requiresAdmin.
        if (!task.requiresAdmin) {
          if (
            studentAnswer &&
            studentAnswer.trim().toLowerCase() ===
              task.correctAnswer?.trim().toLowerCase()
          ) {
            score = 1;
          }
        } else {
          needsAdminCheck = true;
        }
      }

      if (!task.requiresAdmin) {
        totalScore += score;
      }

      return {
        taskId: task.id,
        answer: studentAnswer,
        subAnswers: subAnswersToSave ?? undefined,
        fileUrls: fileUrls ?? [],
        score: task.requiresAdmin ? null : score,
      };
    });

    const submission = await this.prisma.variantSubmission.create({
      data: {
        variantId: BigInt(variantId),
        userId: BigInt(data.userId),
        totalScore: needsAdminCheck ? null : totalScore,
        status: needsAdminCheck ? "PENDING" : "GRADED",
        answers: {
          create: answersToCreate,
        },
      },
      include: {
        answers: true,
      },
    });

    if (!needsAdminCheck && totalScore > 0) {
      await this.prisma.user.update({
        where: { id: BigInt(data.userId) },
        data: { xp: { increment: totalScore } },
      });

      // Gamification: perfectTestReward
      if (totalScore === variant.tasks.length) {
        const courseId = variant.courseId || variant.group?.courseId;
        if (courseId) {
          const config = await this.prisma.gamificationConfig.findUnique({
            where: { courseId: courseId },
          });
          if (config && config.perfectTestReward > 0) {
            await this.gamificationService
              .addCoins(
                data.userId,
                courseId.toString(),
                config.perfectTestReward,
                `Perfect test score: ${variant.title}`,
                true,
              )
              .catch((err) =>
                console.error("Failed to award perfect test coins:", err),
              );
          }
        }
      }
    }

    return this.mapSubmissionToDto(submission);
  }

  async findPendingSubmissions() {
    const submissions = await this.prisma.variantSubmission.findMany({
      where: { status: "PENDING" },
      include: {
        variant: true,
        user: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return submissions.map((s: VariantSubmission & { variant: Variant, user: User }) => this.mapSubmissionToDto(s));
  }

  async findSubmission(submissionId: string) {
    const sub = await this.prisma.variantSubmission.findUnique({
      where: { id: BigInt(submissionId) },
      include: {
        variant: { include: { tasks: { include: { subQuestions: { orderBy: { orderIndex: 'asc' } } } } } },
        user: true,
        answers: true,
      },
    });
    if (!sub) throw new NotFoundException("Submission not found");
    return this.mapSubmissionToDto(sub);
  }

  async gradeSubmission(
    submissionId: string,
    data: import("./dto/grade-submission.dto").GradeSubmissionDto,
  ) {
    const sub = await this.prisma.variantSubmission.findUnique({
      where: { id: BigInt(submissionId) },
      include: {
        answers: true,
        variant: {
          include: {
            tasks: { include: { subQuestions: { orderBy: { orderIndex: 'asc' } } } },
            group: true,
          },
        },
      },
    });
    if (!sub) throw new NotFoundException("Submission not found");

    let totalScore = sub.totalScore || 0; // Existing auto-graded score

    // Update each answer score
    for (const answer of sub.answers) {
      const taskIdStr = answer.taskId.toString();
      const score = data.scores[taskIdStr];
      const feedback = data.feedback?.[taskIdStr];

      if (score !== undefined) {
        totalScore += score;
        await this.prisma.variantTaskAnswer.update({
          where: { id: answer.id },
          data: { score, feedback },
        });
      }
    }

    const updatedSubmission = await this.prisma.variantSubmission.update({
      where: { id: BigInt(submissionId) },
      data: {
        status: "GRADED",
        totalScore,
      },
      include: { answers: true },
    });

    if (totalScore > 0) {
      await this.prisma.user.update({
        where: { id: sub.userId },
        data: { xp: { increment: totalScore } },
      });

      // Assuming totalScore matches the number of tasks for a perfect score
      // Or we can just check if totalScore >= sub.variant.tasks.length if we assume max is 1 per task
      if (totalScore >= sub.variant.tasks.length) {
        const courseId = sub.variant.courseId || sub.variant.group?.courseId;
        if (courseId) {
          const config = await this.prisma.gamificationConfig.findUnique({
            where: { courseId: courseId },
          });
          if (config && config.perfectTestReward > 0) {
            await this.gamificationService
              .addCoins(
                sub.userId.toString(),
                courseId.toString(),
                config.perfectTestReward,
                `Perfect test score: ${sub.variant.title}`,
                true,
              )
              .catch((err) =>
                console.error("Failed to award perfect test coins:", err),
              );
          }
        }
      }
    }

    // Notify student about manual grading
    await this.notificationsService
      .sendNotification(
        sub.userId,
        "Работа проверена",
        `Ваша работа проверена, балл: ${totalScore}`,
        "SUBMISSION_GRADED",
      )
      .catch((err) =>
        console.error(
          `Failed to send grading notification to user ${sub.userId}:`,
          err,
        ),
      );

    return this.mapSubmissionToDto(updatedSubmission);
  }
}
