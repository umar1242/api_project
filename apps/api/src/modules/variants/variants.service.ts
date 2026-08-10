import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVariantDto } from './dto/create-variant.dto';

@Injectable()
export class VariantsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateVariantDto) {
    return this.prisma.variant.create({
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
          create: data.tasks?.map((task) => ({
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
  }

  async findAll() {
    return this.prisma.variant.findMany({
      include: { tasks: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const variant = await this.prisma.variant.findUnique({
      where: { id: BigInt(id) },
      include: { tasks: true },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  async updateTasks(id: string, updateTasksDto: { tasks: { id: string, correctAnswer?: string, optionsCount?: number }[] }) {
    for (const task of updateTasksDto.tasks) {
      await this.prisma.variantTask.update({
        where: { id: BigInt(task.id) },
        data: {
          correctAnswer: task.correctAnswer,
          optionsCount: task.optionsCount,
        }
      });
    }
    return { success: true };
  }

  async submitAnswers(variantId: string, data: import('./dto/submit-variant.dto').SubmitVariantDto) {
    const variant = await this.findOne(variantId);
    let totalScore = 0;
    let needsAdminCheck = false;

    const answersToCreate = variant.tasks.map(task => {
      const studentAnswer = data.answers[task.id.toString()];
      const fileUrl = data.fileUrls?.[task.id.toString()];
      
      let score = 0;
      let isCorrect = false;

      // Auto-grade logic for MULTIPLE_CHOICE or SPECIFIC_ANSWER (without admin requirement)
      if (task.type === 'MULTIPLE_CHOICE' || (task.type === 'SPECIFIC_ANSWER' && !task.requiresAdmin)) {
        if (studentAnswer && studentAnswer.trim().toLowerCase() === task.correctAnswer?.trim().toLowerCase()) {
          score = 1; // 1 point per task (can be adjusted)
          isCorrect = true;
        }
      }

      if (task.requiresAdmin || task.type === 'WRITTEN_WORK') {
        needsAdminCheck = true;
      } else {
        totalScore += score;
      }

      return {
        taskId: task.id,
        answer: studentAnswer,
        fileUrl: fileUrl,
        score: task.requiresAdmin || task.type === 'WRITTEN_WORK' ? null : score,
      };
    });

    const submission = await this.prisma.variantSubmission.create({
      data: {
        variantId: BigInt(variantId),
        userId: BigInt(data.userId),
        totalScore: needsAdminCheck ? null : totalScore,
        status: needsAdminCheck ? 'PENDING' : 'GRADED',
        answers: {
          create: answersToCreate
        }
      },
      include: {
        answers: true
      }
    });

    if (!needsAdminCheck && totalScore > 0) {
      await this.prisma.user.update({
        where: { id: BigInt(data.userId) },
        data: { xp: { increment: totalScore } }
      });
    }

    return submission;
  }

  async findPendingSubmissions() {
    return this.prisma.variantSubmission.findMany({
      where: { status: 'PENDING' },
      include: {
        variant: true,
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findSubmission(submissionId: string) {
    const sub = await this.prisma.variantSubmission.findUnique({
      where: { id: BigInt(submissionId) },
      include: {
        variant: { include: { tasks: true } },
        user: true,
        answers: true,
      }
    });
    if (!sub) throw new NotFoundException('Submission not found');
    return sub;
  }

  async gradeSubmission(submissionId: string, data: import('./dto/grade-submission.dto').GradeSubmissionDto) {
    const sub = await this.findSubmission(submissionId);
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
        status: 'GRADED',
        totalScore,
      },
      include: { answers: true }
    });

    if (totalScore > 0) {
      await this.prisma.user.update({
        where: { id: sub.userId },
        data: { xp: { increment: totalScore } }
      });
    }

    return updatedSubmission;
  }
}
