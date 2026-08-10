import { apiClient } from './client';
import type { Lesson, Material, UserProfile, Enrollment, Assignment, AssignmentSubmission, GamificationStats, ShopItem } from '../types';

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserByTelegramId(telegramId: number): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>(`/users/by-telegram/${telegramId}`);
  return data;
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export async function getUpcomingLessons(groupId: string, limit = 10): Promise<Lesson[]> {
  const { data } = await apiClient.get<Lesson[]>(
    `/lessons/group/${groupId}/upcoming`,
    { params: { limit } },
  );
  return data;
}

export async function getLessonsByGroup(
  groupId: string,
  params?: { skip?: number; take?: number },
): Promise<{ data: Lesson[]; total: number }> {
  const { data } = await apiClient.get<{ data: Lesson[]; total: number }>(
    `/lessons/group/${groupId}`,
    { params },
  );
  return data;
}

// ─── Materials ───────────────────────────────────────────────────────────────

export async function getMaterialsByGroup(groupId: string): Promise<Material[]> {
  const { data } = await apiClient.get<Material[]>(`/materials/group/${groupId}`);
  return data;
}

export async function getMaterialsByLesson(lessonId: string): Promise<Material[]> {
  const { data } = await apiClient.get<Material[]>(`/materials/lesson/${lessonId}`);
  return data;
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

/**
 * Returns the user's active enrollments with embedded group and course info.
 * NOTE: The backend enrollments endpoint is extended to embed the group/course
 * in Stage 3+. For now we use the available endpoint.
 */
export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  const { data } = await apiClient.get<{ data: Enrollment[]; total: number }>(
    `/enrollments`,
    { params: { userId } },
  );
  return data.data;
}

// ─── Assignments ─────────────────────────────────────────────────────────────

export async function getAssignmentsByGroup(groupId: string): Promise<Assignment[]> {
  const { data } = await apiClient.get<Assignment[]>(`/assignments/group/${groupId}`);
  return data;
}

export async function getAssignmentById(assignmentId: string): Promise<Assignment> {
  const { data } = await apiClient.get<Assignment>(`/assignments/${assignmentId}`);
  return data;
}

export async function getMySubmission(assignmentId: string, userId: string): Promise<AssignmentSubmission | null> {
  try {
    const { data } = await apiClient.get<AssignmentSubmission>(`/assignments/${assignmentId}/submissions/my`, {
      params: { userId }
    });
    return data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function submitAssignment(assignmentId: string, payload: { answerText?: string, fileUrl?: string, userId: string }): Promise<AssignmentSubmission> {
  const { data } = await apiClient.post<AssignmentSubmission>(`/assignments/${assignmentId}/submissions`, payload);
  return data;
}

// ─── Gamification ────────────────────────────────────────────────────────────

export async function getGamificationStats(courseId: string, userId: string): Promise<GamificationStats> {
  const { data } = await apiClient.get<GamificationStats>(`/gamification/stats/${courseId}`, { params: { userId } });
  return data;
}

export async function getShopItems(courseId: string): Promise<ShopItem[]> {
  const { data } = await apiClient.get<ShopItem[]>(`/gamification/shop/${courseId}`);
  return data;
}

export async function purchaseShopItem(courseId: string, itemId: string, userId: string): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post<{ success: boolean; message: string }>(`/gamification/shop/${courseId}/purchase/${itemId}`, null, { params: { userId } });
  return data;
}
