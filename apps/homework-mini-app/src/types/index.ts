export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'GRADED';

export interface Assignment {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  status: AssignmentStatus;
  deadlineAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  status: SubmissionStatus;
  answerText: string | null;
  fileUrl: string | null;
  grade: number | null;
  feedback: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  telegramId: string;
  fullName: string;
  phone: string | null;
  role: 'STUDENT' | 'CURATOR' | 'ADMIN';
  status: 'ACTIVE' | 'PAUSED' | 'BANNED';
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  groupId: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXCLUDED' | 'COMPLETED';
  paymentDueAt: string | null;
  paymentPaidAt: string | null;
  createdAt: string;
  group?: {
    id: string;
    title: string;
    courseId: string | null;
    course?: {
      id: string;
      title: string;
      type: 'FREE' | 'PAID';
    };
  };
}
