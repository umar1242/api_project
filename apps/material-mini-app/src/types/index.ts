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
}

export interface Material {
  id: string;
  groupId: string;
  lessonId: string | null;
  title: string;
  content: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
