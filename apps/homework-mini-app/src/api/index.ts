import { apiClient } from './client';
import type { UserProfile, Enrollment, Assignment, AssignmentSubmission } from '../types';

export async function getUserByTelegramId(telegramId: number): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>(`/users/by-telegram/${telegramId}`);
  return data;
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  const { data } = await apiClient.get<{ data: Enrollment[]; total: number }>(
    `/enrollments`,
    { params: { userId } },
  );
  return data.data;
}

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
