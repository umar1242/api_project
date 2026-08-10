import { apiClient } from './api.client';

export interface Lesson {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  type: 'ONLINE' | 'RECORDED';
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  startsAt: string;
  durationMin: number;
  meetingUrl: string | null;
}

export async function getUpcomingLessons(groupId: string, limit = 3): Promise<Lesson[]> {
  const response = await apiClient.get<Lesson[]>(`/lessons/group/${groupId}/upcoming`, {
    params: { limit },
  });
  return response.data;
}

export async function getStudentEnrollments(telegramId: string) {
  const userResponse = await apiClient.get(`/users/by-telegram/${telegramId}`);
  const user = userResponse.data;
  return user;
}
