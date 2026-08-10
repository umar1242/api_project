import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { GamificationService } from "../gamification/gamification.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { SubmitAssignmentDto } from "./dto/submit-assignment.dto";
import { GradeSubmissionDto } from "./dto/grade-submission.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { Assignment, AssignmentSubmission } from "@prisma/client";

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly db: PrismaService,
    private readonly gamificationService: GamificationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(data: CreateAssignmentDto) {
    return this.db.assignment.create({
      data: {
        groupId: BigInt(data.groupId),
        title: data.title,
        description: data.description || undefined,
        publishAt: data.publishAt ? new Date(data.publishAt) : undefined,
        deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : undefined,
        fileUrl: data.fileUrl || undefined,
        lessonId: data.lessonId ? BigInt(data.lessonId) : undefined,
      },
    });
  }

  async findAllByGroup(groupId: number) {
    const assignments = await this.db.assignment.findMany({
      where: { groupId: BigInt(groupId) },
    });
    return assignments.map((a: Assignment) => ({
      ...a,
      id: a.id.toString(),
      groupId: a.groupId.toString(),
      lessonId: a.lessonId ? a.lessonId.toString() : undefined,
    }));
  }

  async submit(assignmentId: number, data: SubmitAssignmentDto) {
    return this.db.assignmentSubmission.create({
      data: {
        assignmentId: BigInt(assignmentId),
        enrollmentId: BigInt(data.enrollmentId),
        fileUrl: data.fileUrl || undefined,
        content: data.content || undefined,
      },
    });
  }

  async getSubmissions(assignmentId: number) {
    const submissions = await this.db.assignmentSubmission.findMany({
      where: { assignmentId: BigInt(assignmentId) },
    });
    return submissions.map((s: AssignmentSubmission) => ({
      ...s,
      id: s.id.toString(),
      assignmentId: s.assignmentId.toString(),
      enrollmentId: s.enrollmentId.toString(),
    }));
  }

  async gradeSubmission(submissionId: number, data: GradeSubmissionDto) {
    const submission = await this.db.assignmentSubmission.findUnique({
      where: { id: BigInt(submissionId) },
      include: {
        enrollment: {
          include: { group: true },
        },
      },
    });
    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    const updated = await this.db.assignmentSubmission.update({
      where: { id: BigInt(submissionId) },
      data: {
        grade: data.grade,
        feedback: data.feedback || undefined,
        status: "GRADED",
      },
    });

    if (
      data.grade &&
      data.grade >= 80 &&
      submission.enrollment.group.courseId
    ) {
      try {
        await this.gamificationService.addCoins(
          submission.enrollment.userId.toString(),
          submission.enrollment.group.courseId.toString(),
          20, // default reward
          `Assignment graded with score: ${data.grade}`,
        );
      } catch (err: any) {
        console.error("Failed to award coins:", err.message);
      }
    }

    // Notify student about manual grading
    await this.notificationsService
      .sendNotification(
        submission.enrollment.userId,
        "Работа проверена",
        `Ваша работа проверена, балл: ${data.grade}`,
        "SUBMISSION_GRADED",
      )
      .catch((err) =>
        console.error(
          `Failed to send grading notification to user ${submission.enrollment.userId}:`,
          err,
        ),
      );

    return updated;
  }
}
