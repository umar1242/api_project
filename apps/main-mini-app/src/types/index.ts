// ─────────────────────────────────────────────────────────────────────────────
// Domain types for the Student Dashboard Mini App
// ─────────────────────────────────────────────────────────────────────────────

export type LessonType = 'ONLINE' | 'RECORDED';
export type LessonStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface Lesson {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  type: LessonType;
  status: LessonStatus;
  startsAt: string; // ISO date string
  durationMin: number;
  meetingUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  groupId: string;
  lessonId: string | null;
  title: string;
  description: string | null;
  fileUrl: string | null;
  telegramFileId: string | null;
  status: 'PENDING' | 'PUBLISHED';
  publishAt: string | null;
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


export interface ScheduleGroup {
  groupId: string;
  groupTitle: string;
  courseTitle: string;
  lessons: Lesson[];
}

export interface GamificationStats {
  coins: number;
  currentStreak: number;
  finesBalance: number;
}

export interface ShopItem {
  id: string;
  courseId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
}
