import { Injectable, NotFoundException } from "@nestjs/common";
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

  private mapVariantToDto(
    variant: any,
  ): import("./dto/variant-response.dto").VariantResponseDto {
    return {
      ...variant,
      id: variant.id.toString(),
      courseId: variant.courseId?.toString(),
      groupId: variant.groupId?.toString(),
      tasks: variant.tasks?.map((task: VariantTask) => ({
        ...task,
        id: task.id.toString(),
        variantId: task.variantId.toString(),
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
    const variant = await this.prisma.variant.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        fileUrl: data.fileUrl,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : null,
        courseId: data.courseId ? BigInt(data.courseId) : null,
        groupId: data.groupId ? BigInt(data.groupId) : null,
        tasks: {
          create:
            data.tasks?.map((task) => ({
              type: task.type,
              orderIndex: task.orderIndex,
              requiresAdmin: task.requiresAdmin || false,
              requiresAttachment: task.requiresAttachment || false,
              optionsCount: task.optionsCount,
              correctAnswer: task.correctAnswer,
            })) || [],
        },
      },
      include: {
        tasks: true,
      },
    });
    return this.mapVariantToDto(variant);
  }

  async findAll() {
    const variants = await this.prisma.variant.findMany({
      include: { tasks: true },
      orderBy: { createdAt: "desc" },
    });
    return variants.map((v) => this.mapVariantToDto(v));
  }

  async findOne(id: string) {
    const variant = await this.prisma.variant.findUnique({
      where: { id: BigInt(id) },
      include: { tasks: true },
    });
    if (!variant) throw new NotFoundException("Variant not found");
    return this.mapVariantToDto(variant);
  }

  async updateTasks(
    id: string,
    updateTasksDto: {
      tasks: { id: string; correctAnswer?: string; optionsCount?: number }[];
    },
  ) {
    for (const task of updateTasksDto.tasks) {
      await this.prisma.variantTask.update({
        where: { id: BigInt(task.id) },
        data: {
          correctAnswer: task.correctAnswer,
          optionsCount: task.optionsCount,
        },
      });
    }
    return { success: true };
  }

  async submitAnswers(
    variantId: string,
    data: import("./dto/submit-variant.dto").SubmitVariantDto,
  ) {
    const variant = await this.prisma.variant.findUnique({
      where: { id: BigInt(variantId) },
      include: { tasks: true, group: true },
    });
    if (!variant) throw new NotFoundException("Variant not found");

    let totalScore = 0;
    let needsAdminCheck = false;

    const answersToCreate = variant.tasks.map((task) => {
      const studentAnswer = data.answers[task.id.toString()];
      const fileUrl = data.fileUrls?.[task.id.toString()];

      let score = 0;
      let isCorrect = false;

      // Auto-grade logic for MULTIPLE_CHOICE or SPECIFIC_ANSWER (without admin requirement)
      if (
        task.type === "MULTIPLE_CHOICE" ||
        (task.type === "SPECIFIC_ANSWER" && !task.requiresAdmin)
      ) {
        if (
          studentAnswer &&
          studentAnswer.trim().toLowerCase() ===
            task.correctAnswer?.trim().toLowerCase()
        ) {
          score = 1; // 1 point per task (can be adjusted)
          isCorrect = true;
        }
      }

      if (task.requiresAdmin || task.type === "WRITTEN_WORK") {
        needsAdminCheck = true;
      } else {
        totalScore += score;
      }

      return {
        taskId: task.id,
        answer: studentAnswer,
        fileUrl: fileUrl,
        score:
          task.requiresAdmin || task.type === "WRITTEN_WORK" ? null : score,
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
    return submissions.map((s) => this.mapSubmissionToDto(s));
  }

  async findSubmission(submissionId: string) {
    const sub = await this.prisma.variantSubmission.findUnique({
      where: { id: BigInt(submissionId) },
      include: {
        variant: { include: { tasks: true } },
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
        variant: { include: { tasks: true, group: true } },
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
